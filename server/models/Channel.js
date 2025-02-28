const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  roles: { type: String, required: true },
  schemeAdmin: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ChannelSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['DIRECT', 'GROUP', 'PUBLIC'] },
  members: [MemberSchema],
  title: { type: String, required: true },
  displayName: { type: String, required: false }, // Will be set dynamically
  creator: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastPostAt: { type: Date, default: Date.now },
  totalMsgCount: { type: Number, default: 0 },
  totalMsgCountRoot: { type: Number, default: 0 }
});

// Middleware to automatically set displayName
ChannelSchema.pre('save', function (next) {
  if (this.members.length >= 2) {
    const member1Id = this.members[0].user.toString();
    const member2Id = this.members[1].user.toString();
    this.displayName = `${member1Id}:${member2Id}`;
  }
  next();
});

module.exports = mongoose.model('Channel', ChannelSchema);
