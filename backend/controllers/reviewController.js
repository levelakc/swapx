const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Service = require('../models/Service');

// @desc    Add a review for a service
// @route   POST /api/reviews
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { service_id, rating, comment } = req.body;

  const service = await Service.findById(service_id);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  // Prevent reviewing own service
  if (service.provider.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot review your own service');
  }

  const review = await Review.create({
    service_id,
    reviewer: req.user._id,
    rating,
    comment,
  });

  res.status(201).json(review);
});

// @desc    Get reviews for a service
// @route   GET /api/reviews/:serviceId
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ service_id: req.params.serviceId })
    .populate('reviewer', 'full_name avatar')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

module.exports = {
  addReview,
  getReviews,
};
