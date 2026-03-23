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

  let attributeQuery = {};
  if (req.query.attributes) {
    try {
      const parsedAttrs = JSON.parse(req.query.attributes);
      Object.keys(parsedAttrs).forEach((key) => {
        if (parsedAttrs[key] !== '' && parsedAttrs[key] !== null && parsedAttrs[key] !== false) {
          attributeQuery[`attributes.${key}`] = parsedAttrs[key];
        }
      });
    } catch (e) {
      console.error('Error parsing attributes query:', e);
    }
  }

  let categoryQuery = {};
  if (req.query.category) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.query.category);
    
    if (isObjectId) {
      // Find the category and its children
      const mainCat = await Category.findById(req.query.category);
      if (mainCat) {
        const childCats = await Category.find({ parent: mainCat._id });
        const catNames = [mainCat.name, ...childCats.map(c => c.name)];
        categoryQuery = { category: { $in: catNames } };
      } else {
        // Fallback to name if ID not found (unlikely but safe)
        categoryQuery = { category: req.query.category };
      }
    } else {
      // It's a name
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

  const condition = req.query.condition
    ? {
        condition: req.query.condition,
      }
    : {};

  const query = {
    ...keyword,
    ...categoryQuery,
    ...condition,
    ...attributeQuery,
    status: 'active', // Only show active items
  };

  if (req.query.location) {
    query.location = { $regex: req.query.location, $options: 'i' };
  }

  if (req.query.listing_type) {
    query.listing_type = req.query.listing_type;
  }

  console.log('getItems query:', JSON.stringify(query));
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
  } = req.body;

  // Handle stringified fields from FormData
  let parsedAttributes = attributes;
  if (typeof attributes === 'string') {
    try {
      parsedAttributes = JSON.parse(attributes);
    } catch (e) {
      parsedAttributes = {};
    }
  }

  let parsedLookingFor = looking_for;
  if (typeof looking_for === 'string') {
    parsedLookingFor = looking_for.split(',').filter(Boolean);
  }

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
    category: categoryExists.name,
    subcategory,
    estimated_value,
    condition,
    images: images || [],
    location: location || req.user.location || 'Not Specified',
    attributes: parsedAttributes,
    looking_for: parsedLookingFor,
    cash_flexibility,
    created_by: req.user._id,
    seller_full_name: req.user.full_name || 'Ahlafot User',
    seller_avatar: req.user.avatar || `https://placehold.co/100x100/6366f1/white?text=${encodeURIComponent(req.user.full_name || 'U')}`,
    seller_bio: req.user.bio || 'Professional trader on Ahlafot',
    seller_location: req.user.location || location || 'Israel',
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
    
    // Handle stringified fields from FormData
    if (attributes !== undefined) {
      let parsedAttributes = attributes;
      if (typeof attributes === 'string') {
        try {
          parsedAttributes = JSON.parse(attributes);
        } catch (e) {
          parsedAttributes = item.attributes;
        }
      }
      item.attributes = parsedAttributes;
    }

    if (looking_for !== undefined) {
      let parsedLookingFor = looking_for;
      if (typeof looking_for === 'string') {
        parsedLookingFor = looking_for.split(',').filter(Boolean);
      }
      item.looking_for = parsedLookingFor;
    }

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
  const items = await Item.find({ created_by: req.user._id }).sort({ createdAt: -1 });
  res.json({ items }); // Return as object with items array
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
  if (item.created_by.toString() !== user._id.toString()) {
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
  const limit = Number(req.query.limit) || 8;
  const poolSize = limit * 3;

  const popularItems = await Item.find({ status: 'active' })
    .sort({ viewsCount: -1, createdAt: -1 })
    .limit(poolSize);

  // Randomly sample 'limit' items from the 'poolSize' popular ones
  const shuffled = popularItems.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, limit);

  res.json({ items: selected });
});

// @desc    Get suggested items based on user activity or preferences
// @route   GET /api/items/suggested
// @access  Public (Optional Protect)
const getSuggestedItems = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const poolSize = limit * 3;
  let preferredCategories = [];

  // 1. If user is logged in, look at their items and looking_for
  if (req.user) {
    const userItems = await Item.find({ created_by: req.user._id });
    userItems.forEach(item => {
      if (item.category && !preferredCategories.includes(item.category)) {
        preferredCategories.push(item.category);
      }
      if (item.looking_for) {
        item.looking_for.forEach(cat => {
          if (!preferredCategories.includes(cat)) preferredCategories.push(cat);
        });
      }
    });
  }

  // 2. Check for category search in query (from frontend cookie or state)
  if (req.query.lastCategory && !preferredCategories.includes(req.query.lastCategory)) {
    preferredCategories.push(req.query.lastCategory);
  }

  let query = { status: 'active' };
  if (preferredCategories.length > 0) {
    query.category = { $in: preferredCategories };
  }

  // Exclude user's own items if logged in
  if (req.user) {
    query.created_by = { $ne: req.user._id };
  }

  let suggestedPool = await Item.find(query)
    .sort({ createdAt: -1 })
    .limit(poolSize);

  // Fallback if not enough items found in preferred categories
  if (suggestedPool.length < poolSize) {
    const additionalItems = await Item.find({ 
      status: 'active', 
      _id: { $nin: suggestedPool.map(i => i._id) },
      ...(req.user ? { created_by: { $ne: req.user._id } } : {})
    })
    .sort({ createdAt: -1 })
    .limit(poolSize - suggestedPool.length);
    
    suggestedPool = [...suggestedPool, ...additionalItems];
  }

  // Randomly sample 'limit' items from the 'poolSize' suggested ones
  const shuffled = suggestedPool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, limit);

  res.json({ items: selected });
});

// @desc    Get items that are mutual matches for the user's inventory
// @route   GET /api/items/matches
// @access  Private
const getMutualMatches = asyncHandler(async (req, res) => {
  const userItems = await Item.find({ created_by: req.user._id, status: 'active' });
  
  if (!userItems || userItems.length === 0) {
    return res.json({ matches: [] });
  }

  const allMatches = [];
  const seenItemIds = new Set();

  for (const myItem of userItems) {
    // 1. Find items whose category is in my "looking_for"
    // 2. AND those items' "looking_for" contains my item's category
    // 3. AND the value is within +/- 30% range
    // 4. AND not my own item
    
    const valueMin = myItem.estimated_value * 0.7;
    const valueMax = myItem.estimated_value * 1.3;

    const matches = await Item.find({
      status: 'active',
      created_by: { $ne: req.user._id },
      category: { $in: myItem.looking_for },
      looking_for: myItem.category,
      estimated_value: { $gte: valueMin, $lte: valueMax }
    }).populate('created_by', 'name email avatar');

    matches.forEach(match => {
      if (!seenItemIds.has(match._id.toString())) {
        allMatches.push({
          item: match,
          matchReason: `Matching your ${myItem.title}`,
          matchedWith: myItem._id
        });
        seenItemIds.add(match._id.toString());
      }
    });
  }

  // Sort matches by recency
  allMatches.sort((a, b) => b.item.createdAt - a.item.createdAt);

  res.json({ matches: allMatches.slice(0, 20) }); // Limit to top 20 matches
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
  getSuggestedItems,
  getMutualMatches,
};
