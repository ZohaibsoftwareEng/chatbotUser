const Channel = require('../models/Channel');
const Message = require("../models/Message");



exports.createChannel = async (req, res) => {
  try {
    const { type, members, title, displayName, creator } = req.body;
    
    const newChannel = new Channel({
      type,
      members,
      title,
      displayName,
      creator,
    });

    await newChannel.save();
    res.status(201).json({ success: true, data: newChannel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.addMessage = async (req, res) => {
  try {
    const { editedBy, channel, message, type, files } = req.body;

    if (!editedBy || !channel || !message || !type) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    const newMessage = new Message({
      editedBy,
      channel,
      message,
      type,
      files
    });

    await newMessage.save();

    res.status(201).json({ success: true, message: "Message added successfully", data: newMessage });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getMessagesByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }
    
    const messages = await Message.find({ channel: channelId }).sort({ createdAt: -1 });
    
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


