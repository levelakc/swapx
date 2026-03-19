const asyncHandler = require('express-async-handler');
const Trade = require('../models/Trade');
const Item = require('../models/Item');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Helper function to validate items and ownership
const validateItems = async (itemIds, ownerId) => {
  if (!itemIds || itemIds.length === 0) return { valid: true, items: [] };

  const items = await Item.find({ _id: { $in: itemIds } });

  if (items.length !== itemIds.length) {
    return { valid: false, message: 'One or more items not found' };
  }

  // Ensure items are not already traded
  const tradedItems = items.filter(item => item.status === 'traded');
  if (tradedItems.length > 0) {
    return { valid: false, message: 'One or more items are already traded' };
  }

  // Ensure ownerId owns all items
  if (ownerId) {
    const foreignItems = items.filter(item => item.created_by.toString() !== ownerId.toString());
    if (foreignItems.length > 0) {
      return { valid: false, message: 'You can only offer your own items' };
    }
  }

  return { valid: true, items };
};

// @desc    Create a trade offer
// @route   POST /api/trades
// @access  Private
const createTrade = asyncHandler(async (req, res) => {
  const { receiver_email, offered_items, requested_items, cash_offered, cash_requested, message } = req.body;
  const initiator_email = req.user.email;

  // Validate receiver
  const receiver = await User.findOne({ email: receiver_email });
  if (!receiver) {
    res.status(404);
    throw new Error('Receiver not found');
  }

  // Prevent trading with self
  if (initiator_email === receiver_email) {
    res.status(400);
    throw new Error('Cannot initiate a trade with yourself');
  }

  // Validate offered items (must belong to initiator)
  const offeredValidation = await validateItems(offered_items, req.user._id);
  if (!offeredValidation.valid) {
    res.status(400);
    throw new Error(`Invalid offered items: ${offeredValidation.message}`);
  }

  // Validate requested items (must belong to receiver)
  let requestedValidation = { valid: true, items: [] };
  if (requested_items && requested_items.length > 0) {
    requestedValidation = await validateItems(requested_items, null);
    if (!requestedValidation.valid) {
      res.status(400);
      throw new Error(`Invalid requested items: ${requestedValidation.message}`);
    }

    // Check if requested items are owned by the receiver
    const foreignRequestedItems = requestedValidation.items.filter(item => item.created_by.toString() !== receiver._id.toString());
    if (foreignRequestedItems.length > 0) {
        res.status(400);
        throw new Error('One or more requested items do not belong to the receiver');
    }
  }

  const newTrade = await Trade.create({
    initiator_email,
    receiver_email,
    offered_items,
    requested_items,
    cash_offered: cash_offered || 0,
    cash_requested: cash_requested || 0,
    messages: message ? [{ sender: initiator_email, content: message, type: 'text' }] : [],
    status: 'pending',
  });

  // Set offered items status to pending (if not already pending)
  if (offeredValidation.items.length > 0) {
    await Item.updateMany({ _id: { $in: offered_items }, status: 'active' }, { status: 'pending' });
  }

  // Set requested items status to pending (if not already pending)
  if (requestedValidation && requestedValidation.items && requestedValidation.items.length > 0) {
    await Item.updateMany({ _id: { $in: requested_items }, status: 'active' }, { status: 'pending' });
  }

  // ALWAYS create a NEW Conversation for this specific trade
  const conversation = await Conversation.create({
      participants: [initiator_email, receiver_email],
      related_item_id: requested_items && requested_items.length > 0 ? requested_items[0] : undefined,
      related_trade_id: newTrade._id,
      last_message: message || 'Sent you a trade offer!', // Initialize with first message
      last_message_at: Date.now(),
      unread_count: {
          [initiator_email]: 0,
          [receiver_email]: 1
      }
  });

  // Create initial message in the message collection too (for real-time chat)
  await Message.create({
      conversation_id: conversation._id.toString(),
      sender_email: initiator_email,
      content: message || 'Sent you a trade offer!',
      type: 'offer',
      trade_data: {
          trade_id: newTrade._id,
          offered_items,
          requested_items,
          cash_offered,
          cash_requested,
      }
  });

  res.status(201).json({
      ...newTrade.toObject(),
      conversationId: conversation._id
  });
});

// @desc    Get trades initiated by current user
// @route   GET /api/trades/sent
// @access  Private
const getSentTrades = asyncHandler(async (req, res) => {
  const trades = await Trade.find({ initiator_email: req.user.email })
    .sort({ createdAt: -1 });
  res.json(trades);
});

// @desc    Get trades received by current user
// @route   GET /api/trades/received
// @access  Private
const getReceivedTrades = asyncHandler(async (req, res) => {
  const trades = await Trade.find({ receiver_email: req.user.email })
    .sort({ createdAt: -1 });
  res.json(trades);
});

// @desc    Get a single trade by ID
// @route   GET /api/trades/:id
// @access  Private
const getTradeById = asyncHandler(async (req, res) => {
  const trade = await Trade.findById(req.params.id);

  if (!trade) {
    res.status(404);
    throw new Error('Trade not found');
  }

  // Only allow participants to view the trade
  if (trade.initiator_email !== req.user.email && trade.receiver_email !== req.user.email) {
    res.status(403);
    throw new Error('Not authorized to view this trade');
  }

  res.json(trade);
});

// @desc    Update trade status (accept, reject, cancel, complete)
// @route   PUT /api/trades/:id
// @access  Private
const updateTradeStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body; // status can be 'accepted', 'rejected', 'cancelled', 'completed', 'countered'
  const tradeId = req.params.id;
  const userEmail = req.user.email;

  const trade = await Trade.findById(tradeId);

  if (!trade) {
    res.status(404);
    throw new Error('Trade not found');
  }

  // Only participants can update trade status
  if (trade.initiator_email !== userEmail && trade.receiver_email !== userEmail) {
    res.status(403);
    throw new Error('Not authorized to update this trade');
  }

  // --- Logic for status transitions ---
  if (status === 'accepted') {
    if (trade.receiver_email !== userEmail) {
      res.status(403);
      throw new Error('Only the receiver can accept an offer');
    }
    if (trade.status !== 'pending' && trade.status !== 'countered') {
      res.status(400);
      throw new Error(`Cannot accept a trade with status: ${trade.status}`);
    }

    // Update trade status
    trade.status = 'accepted';
    trade.messages.push({ sender: userEmail, content: message || 'Trade accepted.', type: 'accept' });

    // Mark all items involved in this trade as 'traded'
    const itemIdsToMarkTraded = [...trade.offered_items, ...trade.requested_items];
    await Item.updateMany({ _id: { $in: itemIdsToMarkTraded } }, { status: 'traded' });

    // Cancel all other pending trades involving these items
    const overlappingTrades = await Trade.find({
      _id: { $ne: trade._id },
      status: { $in: ['pending', 'countered'] },
      $or: [
        { offered_items: { $in: itemIdsToMarkTraded } },
        { requested_items: { $in: itemIdsToMarkTraded } }
      ]
    });

    for (const otherTrade of overlappingTrades) {
      otherTrade.status = 'cancelled';
      otherTrade.messages.push({ 
        sender: 'system', 
        content: 'This trade was cancelled because one of the items was traded in another offer.', 
        type: 'text' 
      });
      await otherTrade.save();

      // Also send a system message to the associated conversation
      const otherConversation = await Conversation.findOne({ related_trade_id: otherTrade._id });
      if (otherConversation) {
        // Increment unread for participants of overlapping trades
        const newUC = { ...otherConversation.unread_count };
        otherConversation.participants.forEach(p => {
            if (p !== 'system@ahlafot.com') {
                newUC[p] = (newUC[p] || 0) + 1;
            }
        });
        otherConversation.unread_count = newUC;
        otherConversation.last_message = 'Trade cancelled due to item being traded elsewhere.';
        otherConversation.last_message_at = Date.now();
        await otherConversation.save();

        await Message.create({
          conversation_id: otherConversation._id.toString(),
          sender_email: 'system@ahlafot.com',
          content: 'This trade was cancelled because one of the items was traded in another offer.',
          type: 'system'
        });
      }
    }

    // Find the related conversation
    const conversation = await Conversation.findOne({ related_trade_id: trade._id });
    if (conversation) {
        const otherParticipant = conversation.participants.find(p => p !== userEmail);
        const newUnreadCount = { ...conversation.unread_count };
        newUnreadCount[otherParticipant] = (newUnreadCount[otherParticipant] || 0) + 1;
        newUnreadCount[userEmail] = 0; // Clear for current user since they just acted
        
        conversation.unread_count = newUnreadCount;
        conversation.last_message = message || 'Trade accepted.';
        conversation.last_message_at = Date.now();
        await conversation.save();

        await Message.create({
            conversation_id: conversation._id.toString(),
            sender_email: userEmail,
            content: message || 'Trade accepted.',
            type: 'accept'
        });
    }

  } else if (status === 'rejected') {
    if (trade.receiver_email !== userEmail) {
      res.status(403);
      throw new Error('Only the receiver can reject an offer');
    }
    if (trade.status !== 'pending' && trade.status !== 'countered') {
      res.status(400);
      throw new Error(`Cannot reject a trade with status: ${trade.status}`);
    }

    trade.status = 'rejected';
    trade.messages.push({ sender: userEmail, content: message || 'Trade rejected.', type: 'reject' });

    // Revert item statuses from pending to active
    const itemIdsToRevert = [...trade.offered_items, ...trade.requested_items];
    await Item.updateMany({ _id: { $in: itemIdsToRevert } }, { status: 'active' });

    const conversation = await Conversation.findOne({ related_trade_id: trade._id });
    if (conversation) {
        const otherParticipant = conversation.participants.find(p => p !== userEmail);
        const newUnreadCount = { ...conversation.unread_count };
        newUnreadCount[otherParticipant] = (newUnreadCount[otherParticipant] || 0) + 1;
        newUnreadCount[userEmail] = 0;
        
        conversation.unread_count = newUnreadCount;
        conversation.last_message = message || 'Trade rejected.';
        conversation.last_message_at = Date.now();
        await conversation.save();

        await Message.create({
            conversation_id: conversation._id.toString(),
            sender_email: userEmail,
            content: message || 'Trade rejected.',
            type: 'reject'
        });
    }

  } else if (status === 'cancelled') {
    // Both initiator and receiver can cancel before acceptance/rejection
    if (trade.status !== 'pending' && trade.status !== 'countered') {
      res.status(400);
      throw new Error(`Cannot cancel a trade with status: ${trade.status}`);
    }

    trade.status = 'cancelled';
    trade.messages.push({ sender: userEmail, content: message || 'Trade cancelled.', type: 'text' });

    // Revert item statuses from pending to active
    const itemIdsToRevert = [...trade.offered_items, ...trade.requested_items];
    await Item.updateMany({ _id: { $in: itemIdsToRevert } }, { status: 'active' });

    // Find the related conversation and update the last 'offer' message to say "Offer removed"
    const conversation = await Conversation.findOne({ related_trade_id: trade._id });
    if (conversation) {
        const otherParticipant = conversation.participants.find(p => p !== userEmail);
        const newUnreadCount = { ...conversation.unread_count };
        newUnreadCount[otherParticipant] = (newUnreadCount[otherParticipant] || 0) + 1;
        newUnreadCount[userEmail] = 0;

        conversation.unread_count = newUnreadCount;
        conversation.last_message = 'Offer removed';
        conversation.last_message_at = Date.now();
        await conversation.save();

        // Find the most recent offer message and update it
        await Message.updateMany(
            { conversation_id: conversation._id, type: 'offer' },
            { $set: { content: 'Offer removed', 'trade_data.status': 'cancelled' } }
        );
        // Add a system message for cancellation
        await Message.create({
            conversation_id: conversation._id.toString(),
            sender_email: 'system@ahlafot.com',
            content: 'The offer was removed by one of the parties.',
            type: 'system'
        });
    }


  } else if (status === 'completed') {
      if (trade.status !== 'accepted') {
          res.status(400);
          throw new Error('Trade must be accepted before it can be completed.');
      }
      // Both users can mark as complete, but it should ideally be confirmed by both
      // For simplicity, we allow either to mark it.
      trade.status = 'completed';
      trade.messages.push({ sender: userEmail, content: message || 'Trade completed.', type: 'text' });

      // Update total_trades for both users
      await User.updateOne({ email: trade.initiator_email }, { $inc: { total_trades: 1 } });
      await User.updateOne({ email: trade.receiver_email }, { $inc: { total_trades: 1 } });

  } else if (status === 'countered') {
      // Countering means creating a new trade and referencing it, or modifying the current one.
      // For now, let's assume a 'counter' is just a message that changes the status of THIS trade
      // A more robust system would involve creating a new 'Trade' document for the counter-offer
      // and linking them.
      if (trade.receiver_email !== userEmail) {
          res.status(403);
          throw new Error('Only the receiver can counter an offer');
      }
      if (trade.status !== 'pending') {
          res.status(400);
          throw new Error(`Cannot counter a trade with status: ${trade.status}`);
      }
      trade.status = 'countered';
      // If a message is provided, add it. The message should ideally contain the counter-offer details.
      if (message) {
          trade.messages.push({ sender: userEmail, content: message, type: 'counter' });
      } else {
          res.status(400);
          throw new Error('Counter offers require a message detailing the new terms.');
      }

  } else {
    res.status(400);
    throw new Error('Invalid trade status provided');
  }

  const updatedTrade = await trade.save();
  res.json(updatedTrade);
});

// @desc    Add a message to a trade
// @route   POST /api/trades/:id/message
// @access  Private
const addTradeMessage = asyncHandler(async (req, res) => {
  const { content, type } = req.body;
  const tradeId = req.params.id;
  const userEmail = req.user.email;

  const trade = await Trade.findById(tradeId);

  if (!trade) {
    res.status(404);
    throw new Error('Trade not found');
  }

  // Only participants can add messages
  if (trade.initiator_email !== userEmail && trade.receiver_email !== userEmail) {
    res.status(403);
    throw new Error('Not authorized to message this trade');
  }

  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  trade.messages.push({ sender: userEmail, content, type: type || 'text' });
  const updatedTrade = await trade.save();

  res.status(201).json(updatedTrade.messages[updatedTrade.messages.length - 1]);
});

// @desc    Counter a trade offer
// @route   PUT /api/trades/:id/counter
// @access  Private
const counterTrade = asyncHandler(async (req, res) => {
  const { offered_items, requested_items, cash_offered, cash_requested, message } = req.body;
  const tradeId = req.params.id;
  const userEmail = req.user.email;

  const trade = await Trade.findById(tradeId);

  if (!trade) {
    res.status(404);
    throw new Error('Trade not found');
  }

  if (trade.initiator_email !== userEmail && trade.receiver_email !== userEmail) {
    res.status(403);
    throw new Error('Not authorized to counter this trade');
  }

  if (trade.status !== 'pending' && trade.status !== 'countered') {
    res.status(400);
    throw new Error(`Cannot counter a trade with status: ${trade.status}`);
  }

  trade.offered_items = offered_items;
  trade.requested_items = requested_items;
  trade.cash_offered = cash_offered || 0;
  trade.cash_requested = cash_requested || 0;
  trade.status = 'countered';

  if (message) {
      trade.messages.push({ sender: userEmail, content: message, type: 'counter' });
  }

  const updatedTrade = await trade.save();
  
  // We should also emit a system message in the Conversation so the chat shows "Offer Countered".
  const conversation = await Conversation.findOne({ related_trade_id: trade._id });
  if (conversation) {
      const otherParticipant = conversation.participants.find(p => p !== userEmail);
      const newUnreadCount = { ...conversation.unread_count };
      newUnreadCount[otherParticipant] = (newUnreadCount[otherParticipant] || 0) + 1;
      
      conversation.unread_count = newUnreadCount;
      conversation.last_message = message || 'Counter offer sent!';
      conversation.last_message_at = Date.now();
      await conversation.save();

      await Message.create({
          conversation_id: conversation._id.toString(),
          sender_email: userEmail,
          content: message || 'Counter offer sent!',
          type: 'offer',
          trade_data: {
              trade_id: trade._id,
              offered_items,
              requested_items,
              cash_offered: trade.cash_offered,
              cash_requested: trade.cash_requested,
          }
      });
  }

  res.json(updatedTrade);
});

module.exports = {
  createTrade,
  getSentTrades,
  getReceivedTrades,
  getTradeById,
  updateTradeStatus,
  addTradeMessage,
  counterTrade,
};
