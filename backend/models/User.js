const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    bio: {
      type: String,
    },
    avatar: {
      type: String,
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    verification_status: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified',
    },
    rating: {
      type: Number,
      default: 0,
    },
    total_trades: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 0,
    },
    lastLoginRewardClaimed: {
      type: Date,
      default: null,
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true, // This adds created_at and updated_at fields
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hashing.');
    next();
  } else {
    console.log('Password modified, hashing...');
    console.log('Original password:', this.password);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Hashed password:', this.password);
    next();
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log('Entered password:', enteredPassword);
  console.log('Stored hash:', this.password);
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  console.log('Password match result:', isMatch);
  return isMatch;
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', userSchema);
