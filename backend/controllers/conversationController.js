const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Item = require('../models/Item');
const { getIO } = require('../socket'); // Corrected import
const { handleIncomingMessage } = require('../services/chatbotService');

// @desc    Get user's conversations
// @route   GET /api/conversations
// @access  Private
const getUserConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.email })
    .populate('related_item_id') // Populate related item details
    .populate('related_trade_id') // Populate related trade details
    .sort({ last_message_at: -1 });

  res.json(conversations);
});

// @desc    Create a new conversation
// @route   POST /api/conversations
// @access  Private
const createConversation = asyncHandler(async (req, res) => {
  const { participant_email, related_item_id, related_trade_id, initial_message } = req.body;
  const current_user_email = req.user.email;

  // Ensure both participants exist
  const otherParticipant = await User.findOne({ email: participant_email });
  if (!otherParticipant) {
    res.status(404);
    throw new Error('Other participant not found');
  }

  // Prevent creating conversation with self
  if (current_user_email === participant_email) {
    res.status(400);
    throw new Error('Cannot create conversation with yourself');
  }

  // if related_item_id is provided, check if it exists
  let item = null;
  if (related_item_id) {
    item = await Item.findById(related_item_id);
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }
  }

  // Check if conversation already exists between these participants, possibly for the same item/trade
  let conversation = await Conversation.findOne({
    participants: { $all: [current_user_email, participant_email] },
    related_item_id: related_item_id,
    related_trade_id: related_trade_id,
  });

  if (conversation) {
    // If conversation exists, just return it
    res.json(conversation);
    return;
  }

  // Create new conversation
  conversation = new Conversation({
    participants: [current_user_email, participant_email],
    related_item_id: related_item_id,
    related_trade_id: related_trade_id,
    last_message: initial_message || '',
    last_message_at: Date.now(),
    unread_count: {
      [current_user_email]: 0,
      [participant_email]: initial_message ? 1 : 0, // Mark initial message as unread for the other participant
    },
  });

  const createdConversation = await conversation.save();

  // If initial message is provided, save it
  if (initial_message) {
    const message = await Message.create({
      conversation_id: createdConversation._id.toString(),
      sender_email: current_user_email,
      content: initial_message,
    });
    // Emit new message event to conversation participants
    getIO().to(createdConversation._id.toString()).emit('newMessage', message);
    createdConversation.last_message = initial_message;
    createdConversation.last_message_at = message.createdAt;
    await createdConversation.save();
  }

  // Emit conversationCreated event to participants
  createdConversation.participants.forEach(email => {
    // This assumes some mapping of user email to socket ID or a way to target specific users
    // For now, we'll just emit to the conversation room.
    getIO().to(createdConversation._id.toString()).emit('conversationCreated', createdConversation);
  });
  
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

  // Ensure current user is a participant
  if (!conversation.participants.includes(current_user_email)) {
    res.status(403);
    throw new Error('Not authorized to view this conversation');
  }

  const messages = await Message.find({ conversation_id: conversationId }).sort({ createdAt: 1 });

  // Mark messages as read for the current user
  await Message.updateMany(
    { conversation_id: conversationId, sender_email: { $ne: current_user_email }, read: false },
    { read: true }
  );

  // Reset unread count for the current user in the conversation
  conversation.unread_count.set(current_user_email, 0);
  await conversation.save();

  console.log('getConversationMessages messages:', messages);
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

  // Ensure current user is a participant
  if (!conversation.participants.includes(current_user_email)) {
    res.status(403);
    throw new Error('Not authorized to send message in this conversation');
  }

  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const message = new Message({
    conversation_id: conversationId,
    sender_email: current_user_email,
    content,
    type: type || 'text',
    trade_data: type === 'offer' || type === 'counter' ? trade_data : undefined,
  });

  const createdMessage = await message.save();

  // Update last message and last message at in conversation
  conversation.last_message = content;
  conversation.last_message_at = Date.now();

  // Increment unread count for other participants
  conversation.participants.forEach(participant => {
    if (participant !== current_user_email) {
      conversation.unread_count.set(participant, (conversation.unread_count.get(participant) || 0) + 1);
    }
  });
  await conversation.save();

  // Emit new message event to conversation participants
  getIO().to(conversationId.toString()).emit('newMessage', createdMessage);

  // Handle chatbot logic
  handleIncomingMessage(createdMessage);

  const messages = await Message.find({ conversation_id: conversationId }).sort({ createdAt: 1 });
  res.status(201).json(messages);
});

module.exports = {
  getUserConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
};
