const mongoose = require('mongoose');

const chatBotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chatbot name is required'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initialMessages: {
    type: String,
    default: ''
  },
  suggestedMessages: {
    type: [String],
    default: []
  },
  messagePlaceholder: {
    type: String,
    default: ''
  },
  collectUserFeedback: {
    type: Boolean,
    default: false
  },
  regenerateMessages: {
    type: Boolean,
    default: false
  },
  aiChat:{type:Boolean, default: false},
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  displayName: {
    type: String,
    default: ''
  },
  userMessageColor: {
    type: String,
    default: '#3B82F6'
  },
  chatBubbleColor: {
    type: String,
    default: '#000000'
  },
  chatBubbleAlignment: {
    type: String,
    enum: ['left', 'right'],
    default: 'right'
  },
  autoShowDelay: {
    type: String,
    default: '3'
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatBot', chatBotSchema); 