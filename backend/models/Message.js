const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    conversation_id: {
      type: String, // Conversation ID
      required: true,
    },
    sender_email: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'offer', 'counter', 'accept', 'reject', 'system', 'image', 'voice', 'buttons'],
      default: 'text',
    },
    buttons: [{
      text: String,
      payload: String,
    }],
    trade_data: {
      type: Object, // To store trade offer details if message type is offer/counter
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);
