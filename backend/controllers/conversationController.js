const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Item = require('../models/Item');
const { getIO } = require('../socket');
const { handleIncomingMessage, getChatbotForLanguage } = require('../services/chatbotService');

// @desc    Get user's conversations
// @route   GET /api/conversations
// @access  Private
const getUserConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.email })
    .populate('related_item_id')
    .populate('related_trade_id')
    .sort({ last_message_at: -1 });

  res.json(conversations);
});

// @desc    Create a new conversation
// @route   POST /api/conversations
// @access  Private
const createConversation = asyncHandler(async (req, res) => {
  const { participant_email, related_item_id, related_trade_id, initial_message } = req.body;
  const current_user_email = req.user.email;

  const otherParticipant = await User.findOne({ email: participant_email });
  if (!otherParticipant) {
    res.status(404);
    throw new Error('Other participant not found');
  }

  if (current_user_email === participant_email) {
    res.status(400);
    throw new Error('Cannot create conversation with yourself');
  }

  let item = null;
  if (related_item_id) {
    item = await Item.findById(related_item_id);
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [current_user_email, participant_email] },
    related_item_id: related_item_id,
    related_trade_id: related_trade_id,
  });

  if (conversation) {
    res.json(conversation);
    return;
  }

  conversation = new Conversation({
    participants: [current_user_email, participant_email],
    related_item_id: related_item_id,
    related_trade_id: related_trade_id,
    last_message: initial_message || '',
    last_message_at: Date.now(),
    unread_count: {
      [current_user_email]: 0,
      [participant_email]: initial_message ? 1 : 0,
    },
  });

  const createdConversation = await conversation.save();

  if (initial_message) {
    const message = await Message.create({
      conversation_id: createdConversation._id.toString(),
      sender_email: current_user_email,
      content: initial_message,
    });
    try {
        getIO().to(createdConversation._id.toString()).emit('newMessage', message);
    } catch (err) {
        console.error('Socket emit error:', err.message);
    }
    createdConversation.last_message = initial_message;
    createdConversation.last_message_at = message.createdAt;
    await createdConversation.save();
  }

  try {
      createdConversation.participants.forEach(email => {
        getIO().to(createdConversation._id.toString()).emit('conversationCreated', createdConversation);
      });
  } catch (err) {
      console.error('Socket emit error:', err.message);
  }
  
  res.status(201).json(createdConversation);
});

// @desc    Get messages for a conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
const getConversationMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;
  const current_user_email = req.user.email;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  if (!conversation.participants.includes(current_user_email)) {
    res.status(403);
    throw new Error('Not authorized to view this conversation');
  }

  const messages = await Message.find({ conversation_id: conversationId }).sort({ createdAt: 1 });

  await Message.updateMany(
    { conversation_id: conversationId, sender_email: { $ne: current_user_email }, read: false },
    { read: true }
  );

  conversation.unread_count = {
      ...conversation.unread_count,
      [current_user_email]: 0
  };
  await conversation.save();

  res.json(messages);
});

// @desc    Send a message in a conversation
// @route   POST /api/conversations/:id/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;
  const { content, type, trade_data } = req.body;
  const current_user_email = req.user.email;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  if (!conversation.participants.includes(current_user_email)) {
    res.status(403);
    throw new Error('Not authorized to send message in this conversation');
  }

  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const message = new Message({
    conversation_id: conversationId.toString(),
    sender_email: current_user_email,
    content,
    type: type || 'text',
    trade_data: type === 'offer' || type === 'counter' ? trade_data : undefined,
  });

  const createdMessage = await message.save();

  conversation.last_message = content;
  conversation.last_message_at = Date.now();

  const newUnreadCount = { ...conversation.unread_count };
  conversation.participants.forEach(participant => {
    if (participant !== current_user_email) {
      newUnreadCount[participant] = (newUnreadCount[participant] || 0) + 1;
    }
  });
  conversation.unread_count = newUnreadCount;
  await conversation.save();

  try {
      getIO().to(conversationId.toString()).emit('newMessage', createdMessage);
  } catch (err) {
      console.error('Socket emit error:', err.message);
  }

  // Handle chatbot logic safely (don't await or block response)
  handleIncomingMessage(createdMessage).catch(err => console.error('Chatbot error:', err.message));

  // Return the created message directly
  res.status(201).json(createdMessage);
});

// @desc    Start or get support chat
// @route   POST /api/conversations/support
// @access  Private
const startSupportChat = asyncHandler(async (req, res) => {
  const user = req.user;
  const chatbot = getChatbotForLanguage(user.language || 'en');

  let conversation = await Conversation.findOne({
    participants: { $all: [user.email, chatbot.email] },
  });

  if (!conversation) {
    const welcomeMessage = {
      en: `Hello ${user.full_name}, welcome to SwapX! I'm ${chatbot.name}, your personal assistant.`,
      he: `שלום ${user.full_name}, ברוך הבא ל-SwapX! אני ${chatbot.name}, העוזרת האישית שלך.`,
    };
    const content = welcomeMessage[user.language] || welcomeMessage.en;

    conversation = await Conversation.create({
      participants: [user.email, chatbot.email],
      last_message: content,
      last_message_at: Date.now(),
      unread_count: { [user.email]: 1 },
    });

    await Message.create({
      conversation_id: conversation._id.toString(),
      sender_email: chatbot.email,
      content: content,
    });
  }

  res.json(conversation);
});

module.exports = {
  getUserConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  startSupportChat,
};