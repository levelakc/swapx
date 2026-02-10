const mongoose = require('mongoose');

const itemSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    description_translations: {
      type: Map,
      of: String,
    },
    title_translations: {
      type: Map,
      of: String,
    },
    category: {
      type: String, // References Category.name
      required: true,
    },
    listing_type: {
      type: String,
      enum: ['item', 'service'],
      default: 'item',
    },
    price_type: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed',
    },
    subcategory: {
      type: String,
    },
    estimated_value: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'excellent', 'good', 'fair'],
    },
    images: [
      {
        type: String,
      },
    ],
    location: {
      type: String,
    },
    attributes: {
      type: Object, // Flexible schema for category-specific attributes
    },
    looking_for: [
      {
        type: String, // Categories the owner wants to trade for
      },
    ],
    cash_flexibility: {
      type: String,
      enum: ['willing_to_add', 'willing_to_receive', 'both', 'trade_only'],
      default: 'trade_only',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'traded', 'withdrawn'],
      default: 'active',
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller_full_name: {
      type: String,
    },
    seller_avatar: {
      type: String,
    },
    seller_bio: {
      type: String,
    },
    seller_location: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: {
      type: Date,
      default: null,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);
