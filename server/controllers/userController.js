const User = require('../models/User');
const Message = require('../models/Message');


const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const user = await User.create(userData);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const upvoteMessage = async (req, res) => {
  const { messageId } = req.params; 
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user has already upvoted
    if (message.upvotes.includes(userId)) {
      return res.status(400).json({ message: 'You have already upvoted this message' });
    }

    // Add user ID to upvotes
    message.upvotes.push(userId);
    await message.save();

    res.status(200).json({ message: 'Message upvoted successfully', upvotes: message.upvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Downvote a message
const downvoteMessage = async (req, res) => {
  const { messageId } = req.params; 
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user has already downvoted
    if (message.downvotes.includes(userId)) {
      return res.status(400).json({ message: 'You have already downvoted this message' });
    }

    // Add user ID to downvotes
    message.downvotes.push(userId);
    await message.save();

    res.status(200).json({ message: 'Message downvoted successfully', downvotes: message.downvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  upvoteMessage,
  downvoteMessage,
}; 