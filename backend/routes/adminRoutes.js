const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getAllUsers,
  getAllItems,
  getAllTrades,
  getOnlineUsers,
  updateUserCoins,
  updateUserRole,
  getSupportConversations,
  resolveSupportRequest,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin only routes
router.route('/stats').get(protect, authorize('admin'), getPlatformStats);
router.route('/users').get(protect, authorize('admin'), getAllUsers);
router.route('/users/:id/coins').put(protect, authorize('admin'), updateUserCoins);
router.route('/users/:id/role').put(protect, authorize('admin'), updateUserRole);

// Admin and Moderator routes
router.route('/items').get(protect, authorize('admin', 'moderator'), getAllItems);
router.route('/trades').get(protect, authorize('admin', 'moderator'), getAllTrades);
router.route('/online-users').get(protect, authorize('admin', 'moderator'), getOnlineUsers);
router.route('/support').get(protect, authorize('admin', 'moderator'), getSupportConversations);
router.route('/support/:id/resolve').put(protect, authorize('admin', 'moderator'), resolveSupportRequest);

module.exports = router;
