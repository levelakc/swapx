const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
  {
    participants: [
      {
        type: String, // Array of participant email addresses
        required: true,
      },
    ],
    related_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    },
    related_trade_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade',
      default: null,
    },
    last_message: {
      type: String,
    },
    last_message_at: {
      type: Date,
      default: Date.now,
    },
    unread_count: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 }); // Index for faster participant lookup

module.exports = mongoose.model('Conversation', conversationSchema);
