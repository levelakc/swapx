const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Item = require('../models/Item');
const Trade = require('../models/Trade');
const Category = require('../models/Category');
const Conversation = require('../models/Conversation');
const ActivityLog = require('../models/ActivityLog');
const { getOnlineUsersList } = require('../socket'); // Import the new function

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getPlatformStats = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  const activeItemsCount = await Item.countDocuments({ status: 'active' });
  const totalItemsCount = await Item.countDocuments();
  const pendingTradesCount = await Trade.countDocuments({ status: 'pending' });
  const completedTradesCount = await Trade.countDocuments({ status: 'completed' });
  const categoriesCount = await Category.countDocuments();

  const now = new Date();
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
  const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  const newItemsLast7Days = await Item.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
  const newItemsLast30Days = await Item.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  const completedTradesLast7Days = await Trade.countDocuments({ status: 'completed', updatedAt: { $gte: sevenDaysAgo } });
  const completedTradesLast30Days = await Trade.countDocuments({ status: 'completed', updatedAt: { $gte: thirtyDaysAgo } });

  res.json({
    usersCount,
    activeItemsCount,
    totalItemsCount,
    pendingTradesCount,
    completedTradesCount,
    categoriesCount,
    newUsersLast7Days,
    newUsersLast30Days,
    newItemsLast7Days,
    newItemsLast30Days,
    completedTradesLast7Days,
    completedTradesLast30Days,
  });
});

// @desc    List all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password'); // Exclude passwords
  res.json(users);
});

// @desc    List all items (any status)
// @route   GET /api/admin/items
// @access  Private/Admin
const getAllItems = asyncHandler(async (req, res) => {
  const items = await Item.find({});
  res.json(items);
});

// @desc    List all trades
// @route   GET /api/admin/trades
// @access  Private/Admin
const getAllTrades = asyncHandler(async (req, res) => {
  const trades = await Trade.find({});
  res.json(trades);
});

// @desc    Get list of currently online users
// @route   GET /api/admin/online-users
// @access  Private/Admin
const getOnlineUsers = asyncHandler(async (req, res) => {
  const onlineUsers = getOnlineUsersList();
  res.json(onlineUsers);
});

// @desc    Update a user's coin balance
// @route   PUT /api/admin/users/:id/coins
// @access  Private/Admin
const updateUserCoins = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { coins } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (typeof coins !== 'number' || coins < 0) {
    res.status(400);
    throw new Error('Coin value must be a non-negative number');
  }

  user.coins = coins; // Set the new coin balance
  await user.save();

  res.json({
    _id: user._id,
    full_name: user.full_name,
    email: user.email,
    coins: user.coins,
    message: 'User coins updated successfully',
  });
});

// @desc    Update a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!['user', 'moderator', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  user.role = role;
  await user.save();

  res.json({
    _id: user._id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    message: 'User role updated successfully',
  });
});

// @desc    Get conversations that need human support
// @route   GET /api/admin/support
// @access  Private/Admin/Moderator
const getSupportConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ is_support_needed: true })
    .sort({ last_message_at: -1 });
  res.json(conversations);
});

// @desc    Mark a support request as resolved
// @route   PUT /api/admin/support/:id/resolve
// @access  Private/Admin/Moderator
const resolveSupportRequest = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  conversation.is_support_needed = false;
  await conversation.save();

  res.json({ message: 'Support request resolved' });
});

// @desc    Get user activity logs
// @route   GET /api/admin/users/:id/logs
// @access  Private/Admin
const getUserLogs = asyncHandler(async (req, res) => {
  const logs = await ActivityLog.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

const { sendEmail } = require('../services/emailService');

// @desc    Send custom email to a user
// @route   POST /api/admin/send-email
// @access  Private/Admin
const sendAdminEmail = asyncHandler(async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    res.status(400);
    throw new Error('Please provide all fields: to, subject, message');
  }

  await sendEmail({
    to,
    subject,
    text: message,
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <div style="background: #6366f1; padding: 20px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
                <h1>AHLAFOT Admin Support</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
                &copy; ${new Date().getFullYear()} AHLAFOT. All rights reserved.
            </div>
          </div>`,
  });

  res.json({ message: 'Email sent successfully' });
});

module.exports = {
  getPlatformStats,
  getAllUsers,
  getAllItems,
  getAllTrades,
  getOnlineUsers,
  updateUserCoins,
  updateUserRole,
  getSupportConversations,
  resolveSupportRequest,
  getUserLogs,
  sendAdminEmail,
};