const express = require('express');
const router = express.Router();
const {createChannel, addMessage, getMessagesByChannel} = require('../controllers/channelController');

router.post('/', createChannel);
router.post('/addMessage',addMessage)
router.get('/getMessages/:channelId', getMessagesByChannel)


module.exports = router; 