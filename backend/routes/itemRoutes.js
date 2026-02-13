const express = require('express');
const router = express.Router();
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
  featureItem,
  getPopularItems,
  getSuggestedItems,
} = require('../controllers/itemController');
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');
const upload = require('../utils/file-upload');

// Routes
router.route('/')
  .get(getItems)
  .post(protect, upload.array('images', 5), createItem); // Max 5 images per item

router.get('/my', protect, getMyItems);
router.get('/popular', getPopularItems); // New route for popular items
router.get('/suggested', optionalProtect, getSuggestedItems);

router.route('/:id')
  .get(getItemById)
  .put(protect, upload.array('images', 5), updateItem) // Max 5 images per item
  .delete(protect, deleteItem);

router.post('/:id/feature', protect, featureItem); // New route to feature an item

module.exports = router;
