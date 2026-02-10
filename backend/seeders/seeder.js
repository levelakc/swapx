const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Item = require('../models/Item');
const Service = require('../models/Service');
const Trade = require('../models/Trade');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { seedChatbotUsers, getChatbotForLanguage } = require('../services/chatbotService');

dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('MONGO_URI from seeder:', process.env.MONGO_URI);
connectDB();

const ISRAELI_CITIES = [
  'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 
  'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה',
  'בני ברק', 'חולון', 'רמת גן', 'אשקלון',
  'רחובות', 'בת ים', 'הרצליה', 'כפר סבא',
  'חדרה', 'מודיעין', 'לוד', 'רמלה', 'רעננה',
  'גבעתיים', 'הוד השרון', 'קריית אתא', 'נהריה'
];

const CATEGORY_PRICE_RANGES_USD = {
  cars: { min: 5000, max: 150000 },
  motorcycles: { min: 2000, max: 30000 },
  boats: { min: 10000, max: 200000 },
  real_estate: { min: 200000, max: 5000000 },
  phones: { min: 100, max: 1500 },
  computers: { min: 300, max: 5000 },
  gaming: { min: 50, max: 1000 },
  cameras: { min: 200, max: 8000 },
  watches: { min: 100, max: 50000 },
  jewelry: { min: 50, max: 20000 },
  handbags: { min: 100, max: 10000 },
  sneakers: { min: 50, max: 2000 },
  fashion: { min: 20, max: 1000 },
  furniture: { min: 50, max: 5000 },
  art: { min: 100, max: 100000 },
  pets: { min: 0, max: 5000 },
  services: { min: 20, max: 500 },
  other: { min: 10, max: 1000 },
};

const CATEGORY_IMAGES = {
  phones: [
    { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop', title: 'iPhone 15 Pro', title_he: 'אייפון 15 פרו' },
    { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop', title: 'Samsung Galaxy S23', title_he: 'סמסונג גלקסי S23' },
    { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop', title: 'Google Pixel 8', title_he: 'גוגל פיקסל 8' }
  ],
  computers: [
    { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop', title: 'MacBook Air M2', title_he: 'מקבוק אייר M2' },
    { url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=800&auto=format&fit=crop', title: 'Dell XPS 15', title_he: 'דל XPS 15' },
    { url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=800&auto=format&fit=crop', title: 'Gaming PC Setup', title_he: 'מחשב גיימינג עוצמתי' }
  ],
  cars: [
    { url: 'https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=800&auto=format&fit=crop', title: 'Porsche 911', title_he: 'פורשה 911' },
    { url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800&auto=format&fit=crop', title: 'Tesla Model 3', title_he: 'טסלה מודל 3' },
    { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800&auto=format&fit=crop', title: 'Range Rover Sport', title_he: 'ריינג׳ רובר ספורט' }
  ],
  watches: [
    { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop', title: 'Rolex Submariner', title_he: 'רולקס סאבמרינר' },
    { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop', title: 'Apple Watch Ultra', title_he: 'אפל ווטש אולטרה' }
  ],
  furniture: [
    { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop', title: 'Modern Velvet Sofa', title_he: 'ספת קטיפה מודרנית' },
    { url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=800&auto=format&fit=crop', title: 'Designer Lounge Chair', title_he: 'כסא מעצבים' }
  ],
  gaming: [
    { url: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=800&auto=format&fit=crop', title: 'PlayStation 5', title_he: 'פלייסטיישן 5' },
    { url: 'https://images.unsplash.com/photo-1621259182903-06dc1c460599?q=80&w=800&auto=format&fit=crop', title: 'Xbox Series X', title_he: 'אקסבוקס Series X' }
  ],
  cameras: [
    { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop', title: 'Sony A7 IV', title_he: 'סוני A7 IV' },
    { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&auto=format&fit=crop', title: 'Fujifilm X-T5', title_he: 'פוג׳יפילם X-T5' }
  ],
  sneakers: [
    { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop', title: 'Air Jordan 1', title_he: 'אייר ג׳ורדן 1' },
    { url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=80&w=800&auto=format&fit=crop', title: 'Yeezy Boost 350', title_he: 'איזי בוסט 350' }
  ],
  other: [
    { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop', title: 'Premium Item', title_he: 'פריט איכותי' }
  ]
};


async function generateRandomItem(category, user, itemIndex, allCategories) {
  const conditions = ['new', 'like_new', 'excellent', 'good', 'fair'];
  const cashFlexibilities = ['willing_to_add', 'willing_to_receive', 'both', 'trade_only'];
  
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const randomCashFlexibility = cashFlexibilities[Math.floor(Math.random() * cashFlexibilities.length)];

  // Select unique image from dictionary based on itemIndex
  const categoryAssets = CATEGORY_IMAGES[category.name] || CATEGORY_IMAGES['other'];
  const assetIndex = itemIndex % categoryAssets.length;
  const randomAsset = categoryAssets[assetIndex];

  let title = randomAsset.title_he || randomAsset.title;

  let description;
  let description_en;
  const itemTypeHe = category.label_he || 'פריט';
  const itemTypeEn = category.label_en || 'Item';
  
  const hebrewDescriptions = [
      `פריט ${itemTypeHe} במצב מעולה, כמעט לא היה בשימוש.`, 
      `שמרתי על ה${itemTypeHe} הזה בקנאות. מוכן להחלפה מעניינת.`, 
      `הזדמנות להשיג ${itemTypeHe} איכותי במחיר הוגן.`, 
      `מוצר שמור מאוד, מגיע עם כל האביזרים.`, 
      `מחפש לשדרג את ה${itemTypeHe} שלי למשהו חדש.`, 
  ];

  const englishDescriptions = [
      `${itemTypeEn} in excellent condition, barely used.`,
      `I kept this ${itemTypeEn} in great shape. Open to trades.`,
      `Opportunity to get a high-quality ${itemTypeEn} at a fair price.`,
      `Very well maintained, comes with all original accessories.`,
      `Looking to upgrade my ${itemTypeEn} to something newer.`
  ];
  
  const descIndex = (itemIndex + Math.floor(Math.random() * 5)) % hebrewDescriptions.length;
  description = hebrewDescriptions[descIndex];
  description_en = englishDescriptions[descIndex];

  const priceRange = CATEGORY_PRICE_RANGES_USD[category.name] || { min: 50, max: 500 };
  const estimated_value = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;

  const numLookingFor = Math.floor(Math.random() * 2) + 1;
  const lookingFor = [];
  if (allCategories && allCategories.length > 0) {
    for (let i = 0; i < numLookingFor; i++) {
      const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
      if (!lookingFor.includes(randomCat._id)) {
        lookingFor.push(randomCat._id);
      }
    }
  }

  return {
    title: title,
    title_translations: { en: randomAsset.title, he: randomAsset.title_he || title },
    description: description,
    description_translations: { en: description_en, he: description },
    category: category._id,
    listing_type: 'item',
    estimated_value: estimated_value,
    condition: randomCondition,
    images: [randomAsset.url],
    location: user.location || ISRAELI_CITIES[Math.floor(Math.random() * ISRAELI_CITIES.length)],
    attributes: {}, 
    looking_for: lookingFor, 
    cash_flexibility: randomCashFlexibility,
    created_by: user._id, 
    seller_full_name: user.full_name,
    seller_avatar: user.avatar,
    seller_bio: user.bio,
    seller_location: user.location || 'Israel'
  };
}

const seedData = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Item.deleteMany(),
      Service.deleteMany(),
      Trade.deleteMany(),
      Conversation.deleteMany(),
      Message.deleteMany(),
    ]);
    console.log('Data cleared successfully.');

    // --- CATEGORIES ---
    const mainCategoriesData = [
      { name: 'electronics', label_en: 'Electronics', label_he: 'אלקטרוניקה', icon: 'zap' },
      { name: 'vehicles', label_en: 'Vehicles', label_he: 'רכב', icon: 'car' },
      { name: 'fashion_main', label_en: 'Fashion', label_he: 'אופנה', icon: 'shirt' },
      { name: 'home', label_en: 'Home & Garden', label_he: 'בית וגן', icon: 'home' },
      { name: 'real_estate_main', label_en: 'Real Estate', label_he: 'נדל"ן', icon: 'building' },
      { name: 'lifestyle', label_en: 'Lifestyle', label_he: 'פנאי', icon: 'smile' },
      { name: 'services_main', label_en: 'Services', label_he: 'שירותים', icon: 'briefcase' },
      { name: 'other_main', label_en: 'Other', label_he: 'אחר', icon: 'circle' }
    ];
    
    const mainCategories = {};
    const createdCategories = [];

    for (const cat of mainCategoriesData) {
        const newCat = await Category.create({ ...cat, parent: null });
        mainCategories[cat.name] = newCat;
        // We DON'T add parents to createdCategories for item seeding, we want specific items
    }

    const subCategoriesData = [
        // Electronics
        { name: 'phones', parent: 'electronics', label_en: 'Cell Phones', icon: 'smartphone', label_he: 'סלולר' },
        { name: 'tablets', parent: 'electronics', label_en: 'Tablets', icon: 'tablet', label_he: 'טאבלטים' },
        { name: 'computers', parent: 'electronics', label_en: 'Computers', icon: 'monitor', label_he: 'מחשבים' },
        { name: 'gaming', parent: 'electronics', label_en: 'Gaming', icon: 'gamepad', label_he: 'גיימינג' },
        { name: 'cameras', parent: 'electronics', label_en: 'Cameras', icon: 'camera', label_he: 'מצלמות' },
        { name: 'audio', parent: 'electronics', label_en: 'Audio', icon: 'headphones', label_he: 'אודיו' },
        { name: 'tv', parent: 'electronics', label_en: 'TV & Screens', icon: 'tv', label_he: 'טלוויזיות' },
        { name: 'drones', parent: 'electronics', label_en: 'Drones', icon: 'send', label_he: 'רחפנים' },

        // Vehicles
        { name: 'cars', parent: 'vehicles', label_en: 'Cars', icon: 'car', label_he: 'מכוניות' },
        { name: 'motorcycles', parent: 'vehicles', label_en: 'Motorcycles', icon: 'bike', label_he: 'אופנועים' },
        { name: 'boats', parent: 'vehicles', label_en: 'Boats', icon: 'anchor', label_he: 'סירות' },
        { name: 'scooters', parent: 'vehicles', label_en: 'Scooters', icon: 'wind', label_he: 'קורקינטים' },
        { name: 'bicycles', parent: 'vehicles', label_en: 'Bicycles', icon: 'bicycle', label_he: 'אופניים' },

        // Fashion
        { name: 'fashion', parent: 'fashion_main', label_en: 'Clothing', icon: 'shirt', label_he: 'ביגוד' },
        { name: 'sneakers', parent: 'fashion_main', label_en: 'Sneakers', icon: 'footprints', label_he: 'נעליים' },
        { name: 'watches', parent: 'fashion_main', label_en: 'Watches', icon: 'watch', label_he: 'שעונים' },
        { name: 'jewelry', parent: 'fashion_main', label_en: 'Jewelry', icon: 'diamond', label_he: 'תכשיטים' },
        { name: 'handbags', parent: 'fashion_main', label_en: 'Handbags', icon: 'shopping-bag', label_he: 'תיקים' },

        // Home
        { name: 'furniture', parent: 'home', label_en: 'Furniture', icon: 'sofa', label_he: 'רהיטים' },
        { name: 'kitchen', parent: 'home', label_en: 'Kitchen', icon: 'coffee', label_he: 'מטבח' },
        { name: 'garden', parent: 'home', label_en: 'Garden', icon: 'flower', label_he: 'גינה' },
        { name: 'tools', parent: 'home', label_en: 'Tools', icon: 'tool', label_he: 'כלי עבודה' },

        // Real Estate
        { name: 'real_estate', parent: 'real_estate_main', label_en: 'Properties', icon: 'home', label_he: 'נכסים' },

        // Lifestyle
        { name: 'art', parent: 'lifestyle', label_en: 'Art', icon: 'palette', label_he: 'אמנות' },
        { name: 'pets', parent: 'lifestyle', label_en: 'Pets', icon: 'dog', label_he: 'חיות מחמד' },
        { name: 'books', parent: 'lifestyle', label_en: 'Books', icon: 'book', label_he: 'ספרים' },
        { name: 'music', parent: 'lifestyle', label_en: 'Musical Instruments', icon: 'music', label_he: 'כלי נגינה' },

        // Services
        { name: 'services', parent: 'services_main', label_en: 'General Services', icon: 'briefcase', label_he: 'שירותים כלליים' },

        // Other
        { name: 'other', parent: 'other_main', label_en: 'Other', icon: 'box', label_he: 'אחר' }
    ];

    for (const sub of subCategoriesData) {
        const parentCat = mainCategories[sub.parent];
        const newCat = await Category.create({ ...sub, parent: parentCat._id });
        createdCategories.push(newCat);
    }
    console.log('Categories seeded.');

    // --- USERS ---
    const usersToCreate = [
      {
        full_name: 'Admin User',
        email: 'admin@swapx.com',
        password: 'password', 
        role: 'admin',
        bio: 'מנהל המערכת הראשי של SwapX.',
        avatar: 'https://i.pravatar.cc/150?u=admin',
        phone: '050-0000000',
        location: 'Tel Aviv, Israel',
        verification_status: 'verified',
        language: 'he'
      },
      {
        full_name: 'דני כהן',
        email: 'dani@example.com',
        password: 'password123',
        role: 'user',
        bio: 'אוהב להחליף ציוד צילום וגאדג\'טים.',
        avatar: 'https://i.pravatar.cc/150?u=dani',
        phone: '054-123-4567',
        location: ISRAELI_CITIES[0],
        verification_status: 'verified',
        language: 'he'
      },
      {
        full_name: 'יעל לוי',
        email: 'yael@example.com',
        password: 'password123',
        role: 'user',
        bio: 'אספנית של תיקי יוקרה ותכשיטים.',
        avatar: 'https://i.pravatar.cc/150?u=yael',
        phone: '052-987-6543',
        location: ISRAELI_CITIES[1],
        verification_status: 'pending',
        language: 'he'
      },
       {
        full_name: 'דוד מזרחי',
        email: 'david@example.com',
        password: 'password123',
        role: 'user',
        bio: 'מתעסק בנדל\'ן ורכבי יוקרה.',
        avatar: 'https://i.pravatar.cc/150?u=david',
        phone: '050-111-2222',
        location: ISRAELI_CITIES[2],
        verification_status: 'verified',
        language: 'he'
      },
      {
        full_name: 'נועה אברהם',
        email: 'noa@example.com',
        password: 'password123',
        role: 'user',
        bio: 'סטודנטית לעיצוב, מחפשת מציאות.',
        avatar: 'https://i.pravatar.cc/150?u=noa',
        phone: '053-333-4444',
        location: ISRAELI_CITIES[3],
        verification_status: 'verified',
        language: 'he'
      },
      {
        full_name: 'יוסי פרידמן',
        email: 'yossi@example.com',
        password: 'password123',
        role: 'user',
        bio: 'מוזיקאי בנשמה, מחליף כלי נגינה.',
        avatar: 'https://i.pravatar.cc/150?u=yossi',
        phone: '058-555-6666',
        location: ISRAELI_CITIES[4],
        verification_status: 'verified',
        language: 'he'
      }
    ];
    
    // Hash passwords manually here if pre-save hook isn't triggered by insertMany, 
    // but we use create() loop which triggers hooks.
    const createdUsers = [];
    for (const userData of usersToCreate) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log('Users seeded.');

    // --- CHATBOTS ---
    await seedChatbotUsers();
    console.log('Chatbot users seeded.');

    // Create initial conversation with Chatbot for each user
    for (const user of createdUsers) {
        const chatbot = getChatbotForLanguage(user.language || 'en');
        if (chatbot) {
            const welcomeMessage = {
                en: `Hello ${user.full_name}, welcome to SwapX! I'm ${chatbot.name}, your personal assistant.`,
                he: `שלום ${user.full_name}, ברוך הבא ל-SwapX! אני ${chatbot.name}, העוזרת האישית שלך.`,
            };
            const msgContent = welcomeMessage[user.language] || welcomeMessage.en;

            const conversation = await Conversation.create({
                participants: [user.email, chatbot.email],
                last_message: msgContent,
                last_message_at: Date.now(),
                unread_count: { [user.email]: 1, [chatbot.email]: 0 }
            });

            await Message.create({
                conversation_id: conversation._id.toString(),
                sender_email: chatbot.email,
                content: msgContent,
                read: false
            });
        }
    }
    console.log('Chatbot conversations created.');

    // --- ITEMS ---
    const allItems = [];
    const allServices = [];
    
    // Distribute items among ALL users
    for (const category of createdCategories) {
      // If category is services, seed Services model instead
      if (category.name === 'services') {
          for (let i = 0; i < 15; i++) {
            const randomUserIndex = Math.floor(Math.random() * createdUsers.length);
            const owner = createdUsers[randomUserIndex];
            const serviceData = await generateRandomItem(category, owner, i, createdCategories);
            
            allServices.push({
                title: serviceData.title,
                description: serviceData.description,
                category: 'Professional Services',
                hourly_rate: serviceData.estimated_value, // Map estimated value to hourly rate
                availability: '09:00 - 17:00',
                location: serviceData.location,
                images: serviceData.images,
                provider: owner._id,
                provider_name: owner.full_name,
                provider_avatar: owner.avatar
            });
          }
          continue; // Skip adding to allItems
      }

      for (let i = 0; i < 15; i++) {
        // Randomly assign this item to one of the users
        const randomUserIndex = Math.floor(Math.random() * createdUsers.length);
        const owner = createdUsers[randomUserIndex];
        
        const newItem = await generateRandomItem(category, owner, i, createdCategories);
        allItems.push(newItem);
      }
    }
    const createdItems = await Item.insertMany(allItems);
    const createdServices = await Service.insertMany(allServices);
    console.log(`Seeded ${createdItems.length} items and ${createdServices.length} services.`);

    console.log('Database seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Item.deleteMany(),
      Trade.deleteMany(),
      Conversation.deleteMany(),
      Message.deleteMany(),
    ]);
    console.log('Data destroyed successfully.');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '--destroy') {
  destroyData();
} else {
  seedData();
}

module.exports = { seedData, destroyData };
