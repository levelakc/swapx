const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Item = require('../models/Item');
const Trade = require('../models/Trade');
const Category = require('../models/Category');
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
  now.setDate(now.getDate() + 7); // Reset now for 30 days calculation
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

module.exports = {
  getPlatformStats,
  getAllUsers,
  getAllItems,
  getAllTrades,
  getOnlineUsers,
  updateUserCoins, // Export the new function
};
