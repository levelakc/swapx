const asyncHandler = require('express-async-handler');
const Item = require('../models/Item');
const User = require('../models/User'); // Needed to check user's items
const Category = require('../models/Category'); // Needed to validate category
const { translateText } = require('../services/translationService');

// @desc    Get all active items
// @route   GET /api/items
// @access  Public
const getItems = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const limit = Number(req.query.limit); // Get limit for featured items

  // Handle featured items request (random sample of truly featured, or fallback to random active)
  if (req.query.featured === 'true') {
    let featuredItems = await Item.aggregate([
      { $match: { status: 'active', isFeatured: true, featuredUntil: { $gt: new Date() } } },
      { $sample: { size: limit || 8 } },
    ]);

    // If no truly featured items, fall back to a random sample of any active items
    if (featuredItems.length === 0) {
      featuredItems = await Item.aggregate([
        { $match: { status: 'active' } },
        { $sample: { size: limit || 8 } },
      ]);
    }
    return res.json({ items: featuredItems, page: 1, pages: 1, count: featuredItems.length });
  }

  // Update expired featured items
  await Item.updateMany(
    { isFeatured: true, featuredUntil: { $lt: new Date() } },
    { $set: { isFeatured: false, featuredUntil: null } }
  );

  const keyword = req.query.keyword
    ? {
        title: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const category = req.query.category
    ? {
        category: req.query.category,
      }
    : {};

  const condition = req.query.condition
    ? {
        condition: req.query.condition,
      }
    : {};

  const listing_type = req.query.listing_type
    ? {
        listing_type: req.query.listing_type,
      }
    : {};

  const query = {
    ...keyword,
    ...category,
    ...condition,
    ...listing_type,
    status: 'active', // Only show active items
  };

  console.log('getItems query:', query);
  const count = await Item.countDocuments(query);
  const items = await Item.find(query)
    .sort({ isFeatured: -1, featuredUntil: -1, createdAt: -1 }) // Sort featured items first, then by recency
    .limit(limit || pageSize) // Apply limit if provided, otherwise use pageSize
    .skip(pageSize * (page - 1));

  res.json({ items, page, pages: Math.ceil(count / (limit || pageSize)) });
});

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate('created_by', 'email name');

  if (item) {
    // Increment views without saving the whole document here to avoid race conditions or overwrites
    await Item.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    item.viewsCount = (item.viewsCount || 0) + 1;

    // Convert to object to modify for response without affecting DB
    const itemObj = item.toObject();

    const lang = req.headers['accept-language'];
    const targetLang = lang && lang.startsWith('he') ? 'he' : 'en';

    if (item.description_translations && item.description_translations.has(targetLang)) {
      itemObj.description = item.description_translations.get(targetLang);
    }
    if (item.title_translations && item.title_translations.has(targetLang)) {
        itemObj.title = item.title_translations.get(targetLang);
    }

    res.json(itemObj);
  } else {
    res.status(404);
    throw new Error('Item not found');
  }
});

// @desc    Create a new item
// @route   POST /api/items
// @access  Private
const createItem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subcategory,
    estimated_value,
    condition,
    location,
    attributes,
    looking_for,
    cash_flexibility,
    listing_type,
  } = req.body;

  // Validate category by ID
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Invalid category specified');
  }

  const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

  // Advanced Translation Tech: Automatically translate to EN and HE
  const title_en = await translateText(title, 'en');
  const title_he = await translateText(title, 'he');
  const desc_en = await translateText(description, 'en');
  const desc_he = await translateText(description, 'he');

  const item = new Item({
    title,
    title_translations: new Map([['en', title_en], ['he', title_he]]),
    description,
    description_translations: new Map([['en', desc_en], ['he', desc_he]]),
    category: categoryExists.name, // Store the name for reference if schema expects String
    subcategory,
    estimated_value,
    condition,
    images: images || [],
    location: location || req.user.location,
    attributes,
    looking_for,
    cash_flexibility,
    listing_type: listing_type || 'item',
    created_by: req.user._id, // User is attached via protect middleware
    seller_full_name: req.user.full_name,
    seller_avatar: req.user.avatar,
    seller_bio: req.user.bio,
    seller_location: req.user.location,
  });

  const createdItem = await item.save();
  res.status(201).json(createdItem);
});

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
const updateItem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subcategory,
    estimated_value,
    condition,
    location,
    attributes,
    looking_for,
    cash_flexibility,
    status,
  } = req.body;

  let images = req.body.images ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) : [];

  if (req.files) {
    const uploadedImages = req.files.map((file) => `/uploads/${file.filename}`);
    images = [...images, ...uploadedImages];
  }
  
  const item = await Item.findById(req.params.id);

  if (item) {
    // Check if the logged in user is the owner of the item
    if (item.created_by.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this item');
    }

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findOne({ name: category });
      if (!categoryExists) {
        res.status(400);
        throw new Error('Invalid category specified');
      }
      item.category = category;
    }

    if (title && title !== item.title) {
        item.title = title;
        const title_en = await translateText(title, 'en');
        const title_he = await translateText(title, 'he');
        item.title_translations = new Map([['en', title_en], ['he', title_he]]);
    }
    
    if (description && description !== item.description) {
        item.description = description;
        const desc_en = await translateText(description, 'en');
        const desc_he = await translateText(description, 'he');
        item.description_translations = new Map([['en', desc_en], ['he', desc_he]]);
    }

    item.subcategory = subcategory || item.subcategory;
    item.estimated_value = estimated_value || item.estimated_value;
    item.condition = condition || item.condition;
    item.location = location || item.location;
    item.attributes = attributes || item.attributes;
    item.looking_for = looking_for || item.looking_for;
    item.cash_flexibility = cash_flexibility || item.cash_flexibility;
    item.status = status || item.status;
    item.images = images || item.images;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } else {
    res.status(404);
    throw new Error('Item not found');
  }
});

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Private
const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (item) {
    // Check if the logged in user is the owner of the item
    if (item.created_by.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this item');
    }
    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } else {
    res.status(404);
    throw new Error('Item not found');
  }
});

// @desc    Get current user's items
// @route   GET /api/items/my
// @access  Private
const getMyItems = asyncHandler(async (req, res) => {
  const items = await Item.find({ created_by: req.user._id });
  res.json(items);
});

// @desc    Feature an item
// @route   POST /api/items/:id/feature
// @access  Private
const featureItem = asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const FEATURE_COST = 5; // Example cost
  const FEATURE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  const item = await Item.findById(itemId);
  const user = req.user; // User from protect middleware

  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }

  // Check if the logged in user is the owner of the item
  if (item.created_by !== user.email) {
    res.status(403);
    throw new Error('Not authorized to feature this item');
  }

  // Check if user has enough coins
  if (user.coins < FEATURE_COST) {
    res.status(400);
    throw new Error(`Not enough coins. You need ${FEATURE_COST} coins to feature this item.`);
  }

  // Deduct coins and update user
  user.coins -= FEATURE_COST;
  await user.save();

  // Set item as featured
  item.isFeatured = true;
  item.featuredUntil = new Date(Date.now() + FEATURE_DURATION_MS);
  await item.save();

  res.json({ message: 'Item successfully featured!', item, userCoins: user.coins });
});

// @desc    Get popular items
// @route   GET /api/items/popular
// @access  Public
const getPopularItems = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8; // Default to 8 popular items

  const popularItems = await Item.find({ status: 'active' })
    .sort({ viewsCount: -1, createdAt: -1 }) // Sort by views count, then by recency
    .limit(limit);

  res.json({ items: popularItems });
});


module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
  featureItem,
  getPopularItems,
};
