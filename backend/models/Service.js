const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String, // e.g. "Home Improvement", "Digital Services"
      required: true,
    },
    hourly_rate: {
      type: Number,
      required: true,
    },
    availability: {
      type: String, // e.g. "Weekends", "9-5", "24/7"
    },
    location: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider_name: {
      type: String,
    },
    provider_avatar: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    website: { type: String },
    social_instagram: { type: String },
    social_facebook: { type: String },
    google_reviews_link: { type: String },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
