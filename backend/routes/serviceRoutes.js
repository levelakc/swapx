const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  getPopularServices,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/file-upload');

router.route('/')
  .get(getServices)
  .post(protect, upload.array('images', 5), createService);

router.route('/popular')
  .get(getPopularServices);

router.route('/:id')
  .get(getServiceById);

module.exports = router;
