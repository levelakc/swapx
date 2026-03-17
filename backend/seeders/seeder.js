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
  lands: { min: 50000, max: 1000000 },
  phones: { min: 100, max: 1500 },
  tablets: { min: 100, max: 1200 },
  computers: { min: 300, max: 5000 },
  gaming: { min: 50, max: 1000 },
  cameras: { min: 200, max: 8000 },
  audio: { min: 50, max: 3000 },
  tv: { min: 200, max: 5000 },
  drones: { min: 300, max: 4000 },
  watches: { min: 100, max: 50000 },
  jewelry: { min: 50, max: 20000 },
  handbags: { min: 100, max: 10000 },
  sneakers: { min: 50, max: 2000 },
  fashion: { min: 20, max: 1000 },
  furniture: { min: 50, max: 5000 },
  kitchen: { min: 30, max: 2000 },
  garden: { min: 40, max: 3000 },
  tools: { min: 20, max: 1500 },
  art: { min: 100, max: 100000 },
  pets: { min: 0, max: 5000 },
  books: { min: 5, max: 500 },
  music: { min: 50, max: 10000 },
  services: { min: 20, max: 500 },
};

const CATEGORY_IMAGES = {
  phones: [
    { url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800&auto=format&fit=crop', title: 'iPhone 15 Pro Max', title_he: 'אייפון 15 פרו מקס 256GB', min_price: 1000, max_price: 1300 },
    { url: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=800&auto=format&fit=crop', title: 'Samsung Galaxy S23 Ultra', title_he: 'סמסונג גלקסי S23 אולטרה', min_price: 850, max_price: 1100 },
    { url: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=800&auto=format&fit=crop', title: 'Google Pixel 8 Pro', title_he: 'גוגל פיקסל 8 פרו', min_price: 700, max_price: 950 }
  ],
  tablets: [
    { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop', title: 'iPad Pro 12.9 M2', title_he: 'אייפד פרו 12.9 M2', min_price: 900, max_price: 1400 },
    { url: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?q=80&w=800&auto=format&fit=crop', title: 'Samsung Galaxy Tab S9 Ultra', title_he: 'סמסונג גלקסי טאב S9 אולטרה', min_price: 800, max_price: 1200 }
  ],
  computers: [
    { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop', title: 'MacBook Air M2 16GB', title_he: 'מקבוק אייר M2 16GB', min_price: 1100, max_price: 1400 },
    { url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=800&auto=format&fit=crop', title: 'Dell XPS 15 OLED', title_he: 'דל XPS 15 מסך OLED', min_price: 1600, max_price: 2400 },
    { url: 'https://images.unsplash.com/photo-1517336712461-7e9024b7ad33?q=80&w=800&auto=format&fit=crop', title: 'MacBook Pro 16" M3 Max', title_he: 'מקבוק פרו 16 M3 מקס', min_price: 3000, max_price: 4500 }
  ],
  cars: [
    { url: 'https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=800&auto=format&fit=crop', title: 'Porsche 911 Carrera S', title_he: 'פורשה 911 קאררה S', min_price: 130000, max_price: 200000 },
    { url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800&auto=format&fit=crop', title: 'Tesla Model 3 Long Range', title_he: 'טסלה מודל 3 לונג ריינג׳', min_price: 40000, max_price: 60000 },
    { url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop', title: 'Toyota RAV4 Hybrid', title_he: 'טויוטה ראב 4 היברידית', min_price: 25000, max_price: 40000 }
  ],
  motorcycles: [
    { url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop', title: 'Honda PCX 125', title_he: 'הונדה PCX 125 (מושלם לשליחויות)', min_price: 2500, max_price: 4500 },
    { url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop', title: 'Yamaha MT-07', title_he: 'ימאהה MT-07', min_price: 6000, max_price: 9000 }
  ],
  scooters: [
    { url: 'https://images.unsplash.com/photo-1558981852-426c6c22a060?q=80&w=800&auto=format&fit=crop', title: 'Segway Ninebot Max G30', title_he: 'קורקינט סגווי ניינבוט מקס', min_price: 500, max_price: 800 }
  ],
  bicycles: [
    { url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800&auto=format&fit=crop', title: 'Trek Marlin 7', title_he: 'אופני הרים טרק מרלין 7', min_price: 600, max_price: 1200 }
  ],
  watches: [
    { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop', title: 'Rolex Submariner Date', title_he: 'רולקס סאבמרינר', min_price: 12000, max_price: 25000 },
    { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop', title: 'Garmin Fenix 7X', title_he: 'שעון גרמין פניקס 7X', min_price: 600, max_price: 1000 }
  ],
  gaming: [
    { url: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=800&auto=format&fit=crop', title: 'PlayStation 5 Disc Edition', title_he: 'פלייסטיישן 5 מהדורת דיסק', min_price: 450, max_price: 600 },
    { url: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop', title: 'Custom Gaming PC RTX 4080', title_he: 'מחשב גיימינג מותאם RTX 4080', min_price: 1500, max_price: 3000 }
  ],
  cameras: [
    { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop', title: 'Sony A7 IV + 24-70mm Lens', title_he: 'סוני A7 IV עם עדשה', min_price: 2500, max_price: 3500 }
  ],
  audio: [
    { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop', title: 'Sony WH-1000XM5', title_he: 'אוזניות סוני XM5', min_price: 250, max_price: 400 },
    { url: 'https://images.unsplash.com/photo-1545127398-14699f92334b?q=80&w=800&auto=format&fit=crop', title: 'KRK Rokit 5 Studio Monitors', title_he: 'רמקולים לאולפן KRK Rokit 5', min_price: 300, max_price: 600 }
  ],
  tv: [
    { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop', title: 'LG C3 65" OLED 4K', title_he: 'טלוויזיה LG OLED 65 אינץ׳', min_price: 1200, max_price: 2200 }
  ],
  drones: [
    { url: 'https://images.unsplash.com/photo-1473968512647-3e44a224fe8f?q=80&w=800&auto=format&fit=crop', title: 'DJI Mini 3 Pro', title_he: 'רחפן DJI Mini 3 Pro', min_price: 600, max_price: 1000 }
  ],
  real_estate: [
    { url: 'https://images.unsplash.com/photo-1580587771525-78b9bed22ad9?q=80&w=800&auto=format&fit=crop', title: 'Modern 4-Bedroom Villa', title_he: 'וילה מודרנית 4 חדרים עם בריכה', min_price: 1500000, max_price: 4000000 },
    { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop', title: 'Downtown Penthouse Apartment', title_he: 'פנטהאוז יוקרתי במרכז העיר', min_price: 800000, max_price: 2500000 }
  ],
  lands: [
    { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop', title: 'Agricultural Land 5 Acres', title_he: 'קרקע חקלאית 5 דונם להשקעה', min_price: 100000, max_price: 500000 }
  ],
  tools: [
    { url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=800&auto=format&fit=crop', title: 'Makita 18V Combo Kit', title_he: 'סט כלי עבודה מקיטה 18V', min_price: 250, max_price: 600 }
  ],
  services: [
    { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop', title: 'Custom Website Development', title_he: 'פיתוח אתרים ללקוחות פרטיים', min_price: 500, max_price: 3000 },
    { url: 'https://images.unsplash.com/photo-1617469165786-8007eda3caa7?q=80&w=800&auto=format&fit=crop', title: 'Express Courier & Delivery', title_he: 'שירותי שליחויות מהירות ואקספרס', min_price: 20, max_price: 100 },
    { url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6954?q=80&w=800&auto=format&fit=crop', title: 'Deep Cleaning Service', title_he: 'שירותי ניקיון יסודי לדירות', min_price: 100, max_price: 300 }
  ]
};

async function generateRandomItem(category, user, itemIndex, allCategories) {
  const conditions = ['new', 'like_new', 'excellent', 'good', 'fair'];
  const cashFlexibilities = ['willing_to_add', 'willing_to_receive', 'both', 'trade_only'];
  
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const randomCashFlexibility = cashFlexibilities[Math.floor(Math.random() * cashFlexibilities.length)];

  // Fallback gracefully if category is missing in CATEGORY_IMAGES
  const categoryAssets = CATEGORY_IMAGES[category.name] || CATEGORY_IMAGES['phones'];
  const assetIndex = itemIndex % categoryAssets.length;
  const randomAsset = categoryAssets[assetIndex];

  let title = randomAsset.title_he || randomAsset.title;

  const itemTypeHe = category.label_he || 'פריט';
  const itemTypeEn = category.label_en || 'Item';
  
  const hebrewDescriptions = [
      `פריט ${itemTypeHe} במצב מעולה, כמעט לא היה בשימוש.`, 
      `שמרתי על ה${itemTypeHe} הזה בקנאות. מוכן להחלפה מעניינת.`, 
      `הזדמנות להשיג ${itemTypeHe} איכותי במחיר הוגן.`, 
      `מוצר שמור מאוד, מגיע עם כל האביזרים המקוריים בקופסה.`, 
      `מוכר/מחליף עקב שדרוג. עובד חלק וללא תקלות.`, 
      `מצב חדש לגמרי, היה בשימוש פעמים ספורות בלבד.`,
      `גמיש מעט במחיר לרציניים, פתוח להצעות החלפה על ציוד מקביל.`,
      `נקנה לאחרונה, נמכר עקב מעבר דירה/שינוי תחום, חייב להימכר!`,
      `איכות ללא פשרות, כל הקודם זוכה. שמור ברמת הבורג.`,
      `פריט מבוקש מאוד במצב מצוין, קשה למצוא כאלה היום בשוק.`
  ];

  const englishDescriptions = [
      `${itemTypeEn} in excellent condition, barely used.`,
      `I kept this ${itemTypeEn} in great shape. Open to interesting trades.`,
      `Opportunity to get a high-quality ${itemTypeEn} at a fair price.`,
      `Very well maintained, comes with all original accessories in the box.`,
      `Selling/trading due to an upgrade. Works flawlessly.`,
      `Brand new condition, used only a handful of times.`,
      `Slightly flexible on price for serious buyers, open to trade offers for similar gear.`,
      `Bought recently, selling due to moving/career change, must go!`,
      `Uncompromising quality, first come first served. Kept in pristine shape.`,
      `Highly sought-after item in excellent condition, hard to find these days.`
  ];
  
  const descIndex = (itemIndex + Math.floor(Math.random() * hebrewDescriptions.length)) % hebrewDescriptions.length;
  const description = hebrewDescriptions[descIndex];
  const description_en = englishDescriptions[descIndex];

  const categoryDefaults = CATEGORY_PRICE_RANGES_USD[category.name] || { min: 50, max: 500 };
  const priceRange = {
    min: randomAsset.min_price || categoryDefaults.min,
    max: randomAsset.max_price || categoryDefaults.max
  };
  const estimated_value = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;

  const numLookingFor = Math.floor(Math.random() * 2) + 1;
  const lookingFor = [];
  if (allCategories && allCategories.length > 0) {
    for (let i = 0; i < numLookingFor; i++) {
      const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
      if (!lookingFor.includes(randomCat._id.toString())) {
        lookingFor.push(randomCat._id.toString());
      }
    }
  }

  return {
    title: title,
    title_translations: { en: randomAsset.title, he: randomAsset.title_he || title },
    description: description,
    description_translations: { en: description_en, he: description },
    category: category.name, 
    subcategory: category.name,
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
    seller_location: user.location || 'Israel',
    open_to_other_offers: Math.random() > 0.5
  };
}

const seedData = async () => {
  try {
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Item.deleteMany(),
      Service.deleteMany(),
      Trade.deleteMany(),
      Conversation.deleteMany(),
      Message.deleteMany(),
    ]);
    console.log('Database cleared successfully.');

    // --- CATEGORIES ---
    const mainCategoriesData = [
      { name: 'electronics', label_en: 'Electronics', label_he: 'אלקטרוניקה', icon: 'zap' },
      { name: 'vehicles', label_en: 'Vehicles', label_he: 'רכב', icon: 'car' },
      { name: 'fashion_main', label_en: 'Fashion', label_he: 'אופנה', icon: 'shirt' },
      { name: 'home', label_en: 'Home & Garden', label_he: 'בית וגן', icon: 'home' },
      { name: 'real_estate_main', label_en: 'Real Estate', label_he: 'נדל"ן', icon: 'building' },
      { name: 'lifestyle', label_en: 'Lifestyle', label_he: 'פנאי', icon: 'smile' },
      { name: 'services_main', label_en: 'Services', label_he: 'שירותים', icon: 'briefcase' },
    ];
    
    const mainCategories = {};
    for (const cat of mainCategoriesData) {
        const newCat = await Category.create({ ...cat, parent: null });
        mainCategories[cat.name] = newCat;
    }

    const subCategoriesData = [
        { name: 'phones', parent: 'electronics', label_en: 'Cell Phones', icon: 'smartphone', label_he: 'סלולר' },
        { name: 'tablets', parent: 'electronics', label_en: 'Tablets', icon: 'tablet', label_he: 'טאבלטים' },
        { name: 'computers', parent: 'electronics', label_en: 'Computers', icon: 'monitor', label_he: 'מחשבים' },
        { name: 'gaming', parent: 'electronics', label_en: 'Gaming', icon: 'gamepad', label_he: 'גיימינג' },
        { name: 'cameras', parent: 'electronics', label_en: 'Cameras', icon: 'camera', label_he: 'מצלמות' },
        { name: 'audio', parent: 'electronics', label_en: 'Audio', icon: 'headphones', label_he: 'אודיו' },
        { name: 'tv', parent: 'electronics', label_en: 'TV & Screens', icon: 'tv', label_he: 'טלוויזיות' },
        { name: 'drones', parent: 'electronics', label_en: 'Drones', icon: 'send', label_he: 'רחפנים' },

        { name: 'cars', parent: 'vehicles', label_en: 'Cars', icon: 'car', label_he: 'מכוניות' },
        { name: 'motorcycles', parent: 'vehicles', label_en: 'Motorcycles', icon: 'bike', label_he: 'אופנועים' },
        { name: 'scooters', parent: 'vehicles', label_en: 'Scooters', icon: 'wind', label_he: 'קורקינטים' },
        { name: 'bicycles', parent: 'vehicles', label_en: 'Bicycles', icon: 'bicycle', label_he: 'אופניים' },

        { name: 'fashion', parent: 'fashion_main', label_en: 'Clothing', icon: 'shirt', label_he: 'ביגוד' },
        { name: 'sneakers', parent: 'fashion_main', label_en: 'Sneakers', icon: 'footprints', label_he: 'נעליים' },
        { name: 'watches', parent: 'fashion_main', label_en: 'Watch', icon: 'watch', label_he: 'שעונים' },
        { name: 'jewelry', parent: 'fashion_main', label_en: 'Jewelry', icon: 'diamond', label_he: 'תכשיטים' },
        { name: 'handbags', parent: 'fashion_main', label_en: 'Handbags', icon: 'shopping-bag', label_he: 'תיקים' },

        { name: 'furniture', parent: 'home', label_en: 'Furniture', icon: 'sofa', label_he: 'רהיטים' },
        { name: 'kitchen', parent: 'home', label_en: 'Kitchen', icon: 'coffee', label_he: 'מטבח' },
        { name: 'garden', parent: 'home', label_en: 'Garden', icon: 'flower', label_he: 'גינה' },
        { name: 'tools', parent: 'home', label_en: 'Tools', icon: 'tool', label_he: 'כלי עבודה' },

        { name: 'real_estate', parent: 'real_estate_main', label_en: 'Properties', icon: 'home', label_he: 'נכסים' },
        { name: 'lands', parent: 'real_estate_main', label_en: 'Lands', icon: 'map', label_he: 'קרקעות' },

        { name: 'art', parent: 'lifestyle', label_en: 'Art', icon: 'palette', label_he: 'אמנות' },
        { name: 'pets', parent: 'lifestyle', label_en: 'Pets', icon: 'dog', label_he: 'חיות מחמד' },
        { name: 'books', parent: 'lifestyle', label_en: 'Books', icon: 'book', label_he: 'ספרים' },
        { name: 'music', parent: 'lifestyle', label_en: 'Musical Instruments', icon: 'music', label_he: 'כלי נגינה' },

        { name: 'services', parent: 'services_main', label_en: 'General Services', icon: 'briefcase', label_he: 'שירותים כלליים' },
    ];

    const createdCategories = [];
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
        full_name: 'עידן שמש',
        email: 'idan@example.com',
        password: 'password123',
        role: 'user',
        bio: 'עצמאי, עושה שליחויות ומפתח אתרים ללקוחות פרטיים. מחפש להחליף ציוד עבודה ושירותים.',
        avatar: 'https://i.pravatar.cc/150?u=idan',
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
        bio: 'סטודנטית לעיצוב, מחפשת מציאות וציוד צילום.',
        avatar: 'https://i.pravatar.cc/150?u=noa',
        phone: '053-333-4444',
        location: ISRAELI_CITIES[3],
        verification_status: 'verified',
        language: 'he'
      }
    ];
    
    const createdUsers = [];
    for (const userData of usersToCreate) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log('Users seeded.');

    // --- CHATBOTS ---
    await seedChatbotUsers();
    
    for (const user of createdUsers) {
        const chatbot = getChatbotForLanguage(user.language || 'en');
        if (chatbot) {
            const msgContent = user.language === 'he' 
              ? `שלום ${user.full_name}, ברוך הבא ל-SwapX! אני ${chatbot.name}, העוזרת האישית שלך.`
              : `Hello ${user.full_name}, welcome to SwapX! I'm ${chatbot.name}, your personal assistant.`;

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

    // --- ITEMS & SERVICES ---
    const allItems = [];
    const allServices = [];
    
    for (const category of createdCategories) {
      if (category.name === 'services') {
          const serviceAssets = CATEGORY_IMAGES['services'];
          for (let i = 0; i < 15; i++) {
            // Give 'idan' priority for the web dev and courier service listings for realism
            let owner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const asset = serviceAssets[i % serviceAssets.length];
            
            if (asset.title.includes('Website') || asset.title.includes('Courier')) {
                owner = createdUsers.find(u => u.email === 'idan@example.com') || owner;
            }
            
            const hourly_rate = Math.floor(Math.random() * (asset.max_price - asset.min_price + 1)) + asset.min_price;

            allServices.push({
                title: asset.title_he || asset.title,
                description: `Offering professional ${asset.title}. Highly reliable with great reviews. Open to bartering for physical items or other professional services.`,
                category: category.name, // Matched dynamically to avoid mapping bugs
                hourly_rate: hourly_rate,
                availability: 'Flexible / 09:00 - 18:00',
                location: owner.location || ISRAELI_CITIES[Math.floor(Math.random() * ISRAELI_CITIES.length)],
                images: [asset.url],
                provider: owner._id,
                provider_name: owner.full_name,
                provider_avatar: owner.avatar
            });
          }
          continue; 
      }

      // Generate items for all non-service leaf categories
      for (let i = 0; i < 10; i++) {
        const owner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
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
      Service.deleteMany(), // Fixed: Included Service model destruction here
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