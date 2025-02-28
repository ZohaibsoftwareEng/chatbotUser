const mongoose = require('mongoose');

// Room Schema for MongoDB references
const RoomSchema = new mongoose.Schema({
  redisRoomId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  name: {
    type: String
  }
}, {
  timestamps: true
});

// Message Schema
const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: String,  // Keeping as String to match Redis user IDs
    required: true
  },
  receiver: {
    type: String,  // Keeping as String to match Redis user IDs
    required: true
  },
  timestamp: {
    type: Number,
    default: () => Date.now()
  },
  read: {
    type: Boolean,
    default: false
  }
});

// Main UserChat Schema
const UserChatSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  redisRoomId: {
    type: String,
    required: true
  },
  participants: [{
    type: String,    // Keeping as String to match Redis user IDs
    required: true
  }],
  messages: [MessageSchema],
  lastMessage: {
    type: MessageSchema,
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: () => new Map()
  }
}, {
  timestamps: true
});

// Indexes
UserChatSchema.index({ roomId: 1 });
UserChatSchema.index({ redisRoomId: 1 });
UserChatSchema.index({ participants: 1 });

// Static Methods
UserChatSchema.statics.addMessage = async function(messageData) {
  const { sender, receiver, content, redisRoomId, timestamp } = messageData;
  
  // Find or create room
  let room = await mongoose.model('Room').findOne({ redisRoomId });
  if (!room) {
    room = await mongoose.model('Room').create({
      redisRoomId,
      type: 'private'
    });
  }

  const message = {
    content,
    sender,
    receiver,
    timestamp,
    read: false
  };

  // Update or create conversation
  const chat = await this.findOneAndUpdate(
    { redisRoomId },
    {
      $push: { messages: message },
      $set: { 
        lastMessage: message,
        roomId: room._id 
      },
      $setOnInsert: {
        participants: [sender, receiver]
      },
      $inc: {
        [`unreadCount.${receiver}`]: 1
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  return chat;
};

UserChatSchema.statics.markMessagesAsRead = async function(redisRoomId, userId) {
  return this.findOneAndUpdate(
    { redisRoomId },
    {
      $set: {
        'messages.$[msg].read': true,
        [`unreadCount.${userId}`]: 0
      }
    },
    {
      arrayFilters: [{ 'msg.receiver': userId, 'msg.read': false }],
      new: true
    }
  );
};

UserChatSchema.statics.getUserConversations = async function(userId) {
  return this.find(
    { participants: userId },
    {
      roomId: 1,
      redisRoomId: 1,
      participants: 1,
      lastMessage: 1,
      unreadCount: 1
    }
  )
  .populate('roomId')
  .sort({ 'lastMessage.timestamp': -1 });
};

UserChatSchema.statics.getRoomMessages = async function(redisRoomId, limit = 50, skip = 0) {
  const chat = await this.findOne(
    { redisRoomId },
    { messages: { $slice: [skip, limit] } }
  )
  .populate('roomId');
  return chat ? chat.messages : [];
};

const Room = mongoose.model('Room', RoomSchema);
const UserChat = mongoose.model('UserChat', UserChatSchema);

module.exports = { Room, UserChat };