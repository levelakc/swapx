const express = require('express');
const router = express.Router();
const {
  getUserConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getUserConversations)
  .post(protect, createConversation);

router.route('/:id/messages')
  .get(protect, getConversationMessages)
  .post(protect, sendMessage);

module.exports = router;
