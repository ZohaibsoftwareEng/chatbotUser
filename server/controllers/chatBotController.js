const ChatBot = require('../models/ChatBot');
const User = require('../models/User');
const Subscriber = require('../models/Subscriber');
const mongoose = require('mongoose');


// Create a new chatbot
exports.createChatBot = async (req, res) => {
    try {
        // First check if user exists
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Cannot create chatbot for non-existent user.' });
        }

        const chatBot = new ChatBot({
            userId: req.body.userId,
            ...req.body
        });

        const savedChatBot = await chatBot.save();
  
        // Update user's chatBots array
        await User.findByIdAndUpdate(
            req.body.userId,
            { $push: { chatBots: savedChatBot._id } }
        );

        res.status(201).json(savedChatBot);
    } catch (error) {
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(400).json({ message: error.message });
    }
};

// Get all chatbots for a user
exports.getUserChatBots = async (req, res) => {
    try {
        const chatBots = await ChatBot.find({ userId: req.params.userId })
            .populate({
                path: 'subscribers',
                select: 'name email summary hasNotification messages createdAt' // excluding password
            });
        res.status(200).json(chatBots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single chatbot
exports.getChatBot = async (req, res) => {
    try {
        const chatBot = await ChatBot.findById(req.params.id)
            .populate({
                path: 'subscribers',
                select: 'name email summary hasNotification messages createdAt'
            });
        if (!chatBot) {
            return res.status(404).json({ message: 'ChatBot not found' });
        }
        res.status(200).json(chatBot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a chatbot
exports.updateChatBot = async (req, res) => {
    try {
        const chatBot = await ChatBot.findById(req.params.id);
        if (!chatBot) {
            return res.status(404).json({ message: 'ChatBot not found' });
        }

        // Check if user owns this chatbot
        if (chatBot.userId.toString() !== req.body.userId) {
            return res.status(403).json({ message: 'Not authorized to update this chatbot' });
        }

        const updatedChatBot = await ChatBot.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedChatBot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a chatbot
exports.deleteChatBot = async (req, res) => {
    try {
        const chatBot = await ChatBot.findById(req.params.id);
        if (!chatBot) {
            return res.status(404).json({ message: 'ChatBot not found' });
        }

        // Check if user owns this chatbot
        if (chatBot.userId.toString() !== req.body.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this chatbot' });
        }

        // Remove chatbot from user's chatBots array
        await User.findByIdAndUpdate(
            chatBot.userId,
            { $pull: { chatBots: req.params.id } }
        );

        await ChatBot.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'ChatBot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 


exports.createSubscriber = async (req, res) => {
    try {
        const { name, email, password, chatBotId } = req.body;

        // Check if chatbot exists
        const chatBot = await ChatBot.findById(chatBotId);
        if (!chatBot) {
            return res.status(404).json({ message: 'ChatBot not found' });
        }

        // Check if subscriber email already exists
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({ message: 'Subscriber with this email already exists' });
        }

        // Create new subscriber
        const newSubscriber = new Subscriber({
            name,
            email,
            password, // In production, make sure to hash the password before saving
        });

        const savedSubscriber = await newSubscriber.save();

        // Add subscriber to chatbot
        chatBot.subscribers.push(savedSubscriber._id);
        await chatBot.save();

        res.status(201).json({ message: 'Subscriber created and added to chatbot', subscriber: savedSubscriber });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
