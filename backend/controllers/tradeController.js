const asyncHandler = require('express-async-handler');
const Trade = require('../models/Trade');
const Item = require('../models/Item');
const User = require('../models/User');

// Helper function to validate items and ownership
const validateItems = async (itemIds, ownerEmail) => {
  if (!itemIds || itemIds.length === 0) return { valid: true, items: [] };

  const items = await Item.find({ _id: { $in: itemIds } });

  if (items.length !== itemIds.length) {
    return { valid: false, message: 'One or more items not found' };
  }

  // Ensure items are active
  const inactiveItems = items.filter(item => item.status !== 'active');
  if (inactiveItems.length > 0) {
    return { valid: false, message: 'One or more items are not active' };
  }

  // Ensure ownerEmail owns all items
  if (ownerEmail) {
    const foreignItems = items.filter(item => item.created_by !== ownerEmail);
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
  const offeredValidation = await validateItems(offered_items, req.user.email);
  if (!offeredValidation.valid) {
    res.status(400);
    throw new Error(`Invalid offered items: ${offeredValidation.message}`);
  }

  // Validate requested items (must belong to receiver and be active)
  const requestedValidation = await validateItems(requested_items, null); // No owner check for requested items
  if (!requestedValidation.valid) {
    res.status(400);
    throw new Error(`Invalid requested items: ${requestedValidation.message}`);
  }

  // Check if requested items are owned by the receiver
  const foreignRequestedItems = requestedValidation.items.filter(item => item.created_by !== receiver.email);
  if (foreignRequestedItems.length > 0) {
      res.status(400);
      throw new Error('One or more requested items do not belong to the receiver');
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

  // Set offered items status to pending
  if (offeredValidation.items.length > 0) {
    await Item.updateMany({ _id: { $in: offered_items } }, { status: 'pending' });
  }

  // Set requested items status to pending
  if (requestedValidation.items.length > 0) {
    await Item.updateMany({ _id: { $in: requested_items } }, { status: 'pending' });
  }


  res.status(201).json(newTrade);
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

    // Also mark any other pending trades involving these items as cancelled
    // This is a complex operation and might be better handled by a separate background job or more sophisticated logic
    // For now, we'll assume a simpler flow.
    // In a real app, you'd find other trades where these items are 'pending' and cancel them.

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

module.exports = {
  createTrade,
  getSentTrades,
  getReceivedTrades,
  getTradeById,
  updateTradeStatus,
  addTradeMessage,
};
