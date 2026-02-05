const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getChatbotForLanguage } = require('../services/chatbotService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { full_name, email, password, role, language } = req.body;

  if (!full_name || !email || !password) {
    res.status(400);
    throw new Error('Please enter all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    full_name,
    email,
    password,
    role,
    language: language || 'en',
    coins: 5, // Initial coins
    lastLoginRewardClaimed: new Date(),
  });

  if (user) {
    // Create a conversation with the chatbot
    const chatbot = getChatbotForLanguage(user.language);
    const welcomeMessage = {
      en: `Hello ${user.full_name}, welcome to SwapX! I'm ${chatbot.name}, your personal assistant. Feel free to ask me anything about the platform.`,
      he: `שלום ${user.full_name}, ברוך הבא ל-SwapX! אני ${chatbot.name}, העוזרת האישית שלך. אל תהסס לשאול אותי כל דבר על הפלטפורמה.`,
      ar: `مرحباً ${user.full_name}، أهلاً بك في SwapX! أنا ${chatbot.name}، مساعدك الشخصي. لا تتردد في أن تسألني أي شيء عن المنصة.`,
      ru: `Здравствуйте ${user.full_name}, добро пожаловать в SwapX! Я ${chatbot.name}, ваш личный помощник. Не стесняйтесь задавать мне любые вопросы о платформе.`,
    };

    const conversation = await Conversation.create({
      participants: [user.email, chatbot.email],
      last_message: welcomeMessage[user.language],
      last_message_at: Date.now(),
    });

    await Message.create({
      conversation_id: conversation._id,
      sender_email: chatbot.email,
      content: welcomeMessage[user.language],
    });

    res.status(201).json({
      _id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      language: user.language,
      token: user.getSignedJwtToken(),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  let dailyReward = false;

  console.log('Login attempt for email:', email);
  console.log('User found:', !!user); // Will be true if user exists, false otherwise

  if (user && (await user.matchPassword(password))) {
    console.log('Password matched for user:', email);

    // --- Daily Login Reward Logic ---
    const now = new Date();
    const lastClaimed = user.lastLoginRewardClaimed;

    // Check if a new day has started since the last claim
    if (!lastClaimed || lastClaimed.toDateString() !== now.toDateString()) {
      user.coins += 5;
      user.lastLoginRewardClaimed = now;
      await user.save(); // Save the updated user document
      dailyReward = true;
      console.log(`User ${user.email} received 5 daily login reward. Current coins: ${user.coins}`);
    }
    // --- End Daily Login Reward Logic ---

    res.json({
      _id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      language: user.language,
      token: user.getSignedJwtToken(),
      dailyReward,
    });
  } else {
    console.log('Login failed for email:', email, '- Invalid credentials or password mismatch');
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
  const token = req.user.getSignedJwtToken();
  res.redirect(`http://localhost:3000/login?token=${token}`);
});

// @desc    Handle Facebook OAuth callback
// @route   GET /api/auth/facebook/callback
// @access  Public
const facebookCallback = asyncHandler(async (req, res) => {
  const token = req.user.getSignedJwtToken();
  res.redirect(`http://localhost:3000/login?token=${token}`);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleCallback,
  facebookCallback,
};
