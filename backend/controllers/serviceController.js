const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        title: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const location = req.query.location
    ? {
        location: {
          $regex: req.query.location,
          $options: 'i',
        },
      }
    : {};

  const query = {
    ...keyword,
    ...location,
    status: 'active',
  };

  const services = await Service.find(query).sort({ createdAt: -1 });
  res.json(services);
});

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('provider', 'name email');
  if (service) {
    res.json(service);
  } else {
    res.status(404);
    throw new Error('Service not found');
  }
});

// @desc    Create a new service
// @route   POST /api/services
// @access  Private
const createService = asyncHandler(async (req, res) => {
  const { title, description, category, hourly_rate, availability, location } = req.body;

  const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

  const service = new Service({
    title,
    description,
    category,
    hourly_rate,
    availability,
    location,
    images,
    provider: req.user._id,
    provider_name: req.user.full_name,
    provider_avatar: req.user.avatar,
  });

  const createdService = await service.save();
  res.status(201).json(createdService);
});

module.exports = {
  getServices,
  getServiceById,
  createService,
};
