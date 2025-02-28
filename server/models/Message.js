const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  message: { type: String, required: true },
  type: { type: String, required: true, enum: ['Simple', 'Rich', 'File'] },
  files: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);