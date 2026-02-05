const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: String, // User email
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['text', 'offer', 'counter'],
      default: 'text',
    },
    // If type is offer/counter, include trade data
    trade_data: {
      offered_items: [{ type: String }],
      requested_items: [{ type: String }],
      cash_offered: { type: Number, default: 0 },
      cash_requested: { type: Number, default: 0 },
    },
  },
  {
    _id: false, // Do not create _id for subdocuments
  }
);

const tradeSchema = mongoose.Schema(
  {
    initiator_email: {
      type: String,
      required: true,
    },
    receiver_email: {
      type: String,
      required: true,
    },
    offered_items: [
      {
        type: String, // Item ID
      },
    ],
    requested_items: [
      {
        type: String, // Item ID
      },
    ],
    cash_offered: {
      type: Number,
      default: 0,
    },
    cash_requested: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'countered', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trade', tradeSchema);
