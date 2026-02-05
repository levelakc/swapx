const express = require('express');
const router = express.Router();
const {
  createTrade,
  getSentTrades,
  getReceivedTrades,
  getTradeById,
  updateTradeStatus,
  addTradeMessage,
} = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get((req, res) => {
    console.log('GET /api/trades received');
    res.json({ message: 'GET /api/trades received' });
  })
  .post(protect, createTrade);

router.get('/sent', protect, getSentTrades);
router.get('/received', protect, getReceivedTrades);
router.route('/:id')
  .get(protect, getTradeById)
  .put(protect, updateTradeStatus); // To update status like accept, reject, complete

router.post('/:id/message', protect, addTradeMessage); // Add a message to a trade

module.exports = router;
