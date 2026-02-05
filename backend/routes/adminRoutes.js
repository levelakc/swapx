const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getAllUsers,
  getAllItems,
  getAllTrades,
  getOnlineUsers,
  updateUserCoins,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes are protected and require 'admin' role
router.route('/stats').get(protect, authorize('admin'), getPlatformStats);
router.route('/users').get(protect, authorize('admin'), getAllUsers);
router.route('/users/:id/coins').put(protect, authorize('admin'), updateUserCoins);
router.route('/items').get(protect, authorize('admin'), getAllItems);
router.route('/trades').get(protect, authorize('admin'), getAllTrades);
router.route('/online-users').get(protect, authorize('admin'), getOnlineUsers);

module.exports = router;
