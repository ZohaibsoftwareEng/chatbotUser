const express = require('express');
const router = express.Router();
const chatBotController = require('../controllers/chatBotController');

// Create a new chatbot
router.post('/', chatBotController.createChatBot);

// Get all chatbots for a user
router.get('/user/:userId', chatBotController.getUserChatBots);

// Get a single chatbot
router.get('/:id', chatBotController.getChatBot);

// Update a chatbot
router.put('/:id', chatBotController.updateChatBot);

// Delete a chatbot
router.delete('/:id', chatBotController.deleteChatBot);
router.post('/subscriber/create', chatBotController.createSubscriber);




module.exports = router; 