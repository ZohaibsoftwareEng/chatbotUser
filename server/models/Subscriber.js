const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bot', 'user'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
});

const summarySchema = new mongoose.Schema({
  Tone: {
    type: String,
    required: true
  },
  TotalMessages: {
    type: String,
    required: true
  }
});

const subscriberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  summary: {
    type: summarySchema,
    required: false
  },
  hasNotification: {
    type: Boolean,
    default: false
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);