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

  const userSchema = new mongoose.Schema({
    
    name: {
      type: String,
      required: false,
      default:"kuch b name ha"
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
    color: {
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
    chatBots: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatBot'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  module.exports = mongoose.model('User', userSchema); 