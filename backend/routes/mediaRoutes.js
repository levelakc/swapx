const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/message-media-upload');

router.post('/messages', protect, upload.single('media'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
