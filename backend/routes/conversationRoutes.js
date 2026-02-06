const express = require('express');
const router = express.Router();
const {
  getUserConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  startSupportChat,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/support', protect, startSupportChat);

router.route('/')
  .get(protect, getUserConversations)
  .post(protect, createConversation);

router.route('/:id/messages')
  .get(protect, getConversationMessages)
  .post(protect, sendMessage);

module.exports = router;
