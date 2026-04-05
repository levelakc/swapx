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

  const services = await Service.find(query)
    .populate('provider', 'full_name email avatar')
    .sort({ createdAt: -1 });

  const lang = req.headers['accept-language'];
  const targetLang = lang && lang.startsWith('he') ? 'he' : 'en';

  const translatedServices = services.map(service => {
    const serviceObj = service.toObject();
    
    const getTranslation = (source, key, fallback) => {
        if (!source) return fallback;
        let val;
        if (typeof source.get === 'function') val = source.get(key);
        else val = source[key];
        return val || fallback;
    };

    serviceObj.description = getTranslation(serviceObj.description_translations, targetLang, serviceObj.description);
    serviceObj.title = getTranslation(serviceObj.title_translations, targetLang, serviceObj.title);

    return serviceObj;
  });

  res.json(translatedServices);
});

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('provider', 'full_name email');
  if (service) {
    // Increment views without saving the whole document here to avoid race conditions or overwrites
    await Service.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    service.views = (service.views || 0) + 1;

    // Convert to object to modify for response without affecting DB
    const serviceObj = service.toObject();

    const lang = req.headers['accept-language'];
    const targetLang = lang && lang.startsWith('he') ? 'he' : 'en';

    // Helper to safely get translation from Map OR plain object
    const getTranslation = (source, key, fallback) => {
        if (!source) return fallback;
        let val;
        if (typeof source.get === 'function') val = source.get(key);
        else val = source[key];
        return val || fallback;
    };

    const transDesc = getTranslation(serviceObj.description_translations, targetLang, serviceObj.description);
    serviceObj.description = transDesc;

    const transTitle = getTranslation(serviceObj.title_translations, targetLang, serviceObj.title);
    serviceObj.title = transTitle;

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
    provider_email: req.user.email || 'not-provided@ahlafot.co.il',
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
  const poolSize = limit * 3;
  
  const popularServices = await Service.find({ status: 'active' })
    .populate('provider', 'full_name email avatar')
    .sort({ views: -1 })
    .limit(poolSize);

  const lang = req.headers['accept-language'];
  const targetLang = lang && lang.startsWith('he') ? 'he' : 'en';

  const translatedServices = popularServices.map(service => {
    const serviceObj = service.toObject();
    const getTranslation = (source, key, fallback) => {
        if (!source) return fallback;
        let val;
        if (typeof source.get === 'function') val = source.get(key);
        else val = source[key];
        return val || fallback;
    };

    serviceObj.description = getTranslation(serviceObj.description_translations, targetLang, serviceObj.description);
    serviceObj.title = getTranslation(serviceObj.title_translations, targetLang, serviceObj.title);

    return serviceObj;
  });

  const shuffled = translatedServices.sort(() => 0.5 - Math.random());
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

  if (req.query.lastCategory && !preferredCategories.includes(req.query.lastCategory)) {
    preferredCategories.push(req.query.lastCategory);
  }

  let query = { status: 'active' };
  if (preferredCategories.length > 0) {
    query.category = { $in: preferredCategories };
  }

  if (req.user) {
    query.provider = { $ne: req.user._id };
  }

  let suggestedPool = await Service.find(query)
    .populate('provider', 'full_name email avatar')
    .sort({ createdAt: -1 })
    .limit(poolSize);

  if (suggestedPool.length < poolSize) {
    const additionalServices = await Service.find({ 
      status: 'active', 
      _id: { $nin: suggestedPool.map(s => s._id) },
      ...(req.user ? { provider: { $ne: req.user._id } } : {})
    })
    .populate('provider', 'full_name email avatar')
    .sort({ createdAt: -1 })
    .limit(poolSize - suggestedPool.length);
    
    suggestedPool = [...suggestedPool, ...additionalServices];
  }

  const lang = req.headers['accept-language'];
  const targetLang = lang && lang.startsWith('he') ? 'he' : 'en';

  const translatedServices = suggestedPool.map(service => {
    const serviceObj = service.toObject();
    const getTranslation = (source, key, fallback) => {
        if (!source) return fallback;
        let val;
        if (typeof source.get === 'function') val = source.get(key);
        else val = source[key];
        return val || fallback;
    };

    serviceObj.description = getTranslation(serviceObj.description_translations, targetLang, serviceObj.description);
    serviceObj.title = getTranslation(serviceObj.title_translations, targetLang, serviceObj.title);

    return serviceObj;
  });

  const shuffled = translatedServices.sort(() => 0.5 - Math.random());
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
