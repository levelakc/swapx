const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');
const Category = require('../models/Category');
const { translateText } = require('../services/translationService');

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

  let categoryQuery = {};
  if (req.query.category) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.query.category);
    
    if (isObjectId) {
      const mainCat = await Category.findById(req.query.category);
      if (mainCat) {
        const childCats = await Category.find({ parent: mainCat._id });
        const catNames = [mainCat.name, ...childCats.map(c => c.name)];
        categoryQuery = { category: { $in: catNames } };
      } else {
        categoryQuery = { category: req.query.category };
      }
    } else {
      const mainCat = await Category.findOne({ name: req.query.category });
      if (mainCat) {
          const childCats = await Category.find({ parent: mainCat._id });
          const catNames = [mainCat.name, ...childCats.map(c => c.name)];
          categoryQuery = { category: { $in: catNames } };
      } else {
          categoryQuery = { category: req.query.category };
      }
    }
  }

  const query = {
    ...keyword,
    ...location,
    ...categoryQuery,
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
    service.views = (service.views || 0) + 1;
    await service.save();

    // Convert to object to modify for response without affecting DB
    const serviceObj = service.toObject();

    const lang = req.headers['accept-language'];
    const targetLang = lang && lang.startsWith('he') ? 'he' : 'en';

    if (service.description_translations && service.description_translations.has(targetLang)) {
      serviceObj.description = service.description_translations.get(targetLang);
    }
    if (service.title_translations && service.title_translations.has(targetLang)) {
        serviceObj.title = service.title_translations.get(targetLang);
    }

    res.json(serviceObj);
  } else {
    res.status(404);
    throw new Error('Service not found');
  }
});

// @desc    Create a new service
// @route   POST /api/services
// @access  Private
const createService = asyncHandler(async (req, res) => {
  const { title, description, category, hourly_rate, availability, location, website, social_instagram, social_facebook, google_reviews_link } = req.body;

  // Validate category if ID is provided
  let categoryName = category;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
  if (isObjectId) {
    const categoryExists = await Category.findById(category);
    if (categoryExists) {
      categoryName = categoryExists.name;
    }
  }

  const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

  // Advanced Translation Tech: Automatically translate to EN and HE
  const title_en = await translateText(title, 'en');
  const title_he = await translateText(title, 'he');
  const desc_en = await translateText(description, 'en');
  const desc_he = await translateText(description, 'he');

  const service = new Service({
    title,
    title_translations: new Map([['en', title_en], ['he', title_he]]),
    description,
    description_translations: new Map([['en', desc_en], ['he', desc_he]]),
    category: categoryName,
    hourly_rate: Number(hourly_rate),
    availability,
    location,
    images,
    provider: req.user._id,
    provider_name: req.user.full_name,
    provider_avatar: req.user.avatar,
    provider_email: req.user.email,
    website,
    social_instagram,
    social_facebook,
    google_reviews_link
  });

  const createdService = await service.save();
  res.status(201).json(createdService);
});

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private
const updateService = asyncHandler(async (req, res) => {
  const { title, description, category, hourly_rate, availability, location, website, social_instagram, social_facebook, google_reviews_link, status } = req.body;

  const service = await Service.findById(req.params.id);

  if (service) {
    if (service.provider.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this service');
    }

    if (title && title !== service.title) {
        service.title = title;
        const title_en = await translateText(title, 'en');
        const title_he = await translateText(title, 'he');
        service.title_translations = new Map([['en', title_en], ['he', title_he]]);
    }
    
    if (description && description !== service.description) {
        service.description = description;
        const desc_en = await translateText(description, 'en');
        const desc_he = await translateText(description, 'he');
        service.description_translations = new Map([['en', desc_en], ['he', desc_he]]);
    }

    if (category) {
        let categoryName = category;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
        if (isObjectId) {
            const categoryExists = await Category.findById(category);
            if (categoryExists) {
                categoryName = categoryExists.name;
            }
        }
        service.category = categoryName;
    }

    service.hourly_rate = hourly_rate ? Number(hourly_rate) : service.hourly_rate;
    service.availability = availability || service.availability;
    service.location = location || service.location;
    service.website = website !== undefined ? website : service.website;
    service.social_instagram = social_instagram !== undefined ? social_instagram : service.social_instagram;
    service.social_facebook = social_facebook !== undefined ? social_facebook : service.social_facebook;
    service.google_reviews_link = google_reviews_link !== undefined ? google_reviews_link : service.google_reviews_link;
    service.status = status || service.status;

    if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file) => `/uploads/${file.filename}`);
        service.images = [...service.images, ...newImages];
    }

    const updatedService = await service.save();
    res.json(updatedService);
  } else {
    res.status(404);
    throw new Error('Service not found');
  }
});

// @desc    Get popular services
// @route   GET /api/services/popular
// @access  Public
const getPopularServices = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 8;
  // Fetch more than limit to allow for random sampling on refresh
  const poolSize = limit * 3;
  
  const popularServices = await Service.find({ status: 'active' })
    .sort({ views: -1 })
    .limit(poolSize);

  // Randomly sample 'limit' services from the 'poolSize' popular ones
  const shuffled = popularServices.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, limit);

  res.json({ services: selected });
});

// @desc    Get suggested services based on user activity or preferences
// @route   GET /api/services/suggested
// @access  Public (Optional Protect)
const getSuggestedServices = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const poolSize = limit * 3;
  let preferredCategories = [];

  // Check for category search in query (from frontend cookie or state)
  if (req.query.lastCategory && !preferredCategories.includes(req.query.lastCategory)) {
    preferredCategories.push(req.query.lastCategory);
  }

  let query = { status: 'active' };
  if (preferredCategories.length > 0) {
    query.category = { $in: preferredCategories };
  }

  // Exclude provider's own services if logged in
  if (req.user) {
    query.provider = { $ne: req.user._id };
  }

  let suggestedPool = await Service.find(query)
    .sort({ createdAt: -1 })
    .limit(poolSize);

  // Fallback if not enough services found in preferred categories
  if (suggestedPool.length < poolSize) {
    const additionalServices = await Service.find({ 
      status: 'active', 
      _id: { $nin: suggestedPool.map(s => s._id) },
      ...(req.user ? { provider: { $ne: req.user._id } } : {})
    })
    .sort({ createdAt: -1 })
    .limit(poolSize - suggestedPool.length);
    
    suggestedPool = [...suggestedPool, ...additionalServices];
  }

  // Randomly sample 'limit' services from the 'poolSize' suggested ones
  const shuffled = suggestedPool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, limit);

  res.json({ services: selected });
});

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  getPopularServices,
  getSuggestedServices,
};
