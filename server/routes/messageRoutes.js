const express = require('express');
const session = require("express-session");
const { upvoteMessage, downvoteMessage } = require('../controllers/userController');
const router = express.Router();
const auth = (req, res, next) => {
  req.user = req.user || {};
  req.user._id = "67c1654901a7c368e8bd9b5b";
  next();
};

// Route to upvote a message
router.post('/messages/:messageId/upvote', auth, upvoteMessage);

// Route to downvote a message
router.post('/messages/:messageId/downvote', auth, downvoteMessage);

module.exports = router;