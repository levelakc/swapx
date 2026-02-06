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
  cars: { min: 8000, max: 65000 },
  motorcycles: { min: 3000, max: 22000 },
  boats: { min: 5000, max: 80000 },
  real_estate: { min: 150000, max: 1500000 },
  phones: { min: 150, max: 1600 },
  computers: { min: 400, max: 4000 },
  gaming: { min: 150, max: 2000 },
  cameras: { min: 300, max: 7000 },
  watches: { min: 150, max: 25000 },
  jewelry: { min: 100, max: 15000 },
  handbags: { min: 50, max: 2000 },
  sneakers: { min: 50, max: 800 },
  fashion: { min: 30, max: 500 },
  furniture: { min: 100, max: 4000 },
  art: { min: 50, max: 20000 },
  pets: { min: 20, max: 800 },
  services: { min: 50, max: 3000 },
  other: { min: 20, max: 500 },
  // New Categories
  tablets: { min: 100, max: 1500 },
  drones: { min: 200, max: 3000 },
  audio: { min: 50, max: 5000 },
  tv: { min: 200, max: 4000 },
  scooters: { min: 300, max: 2000 },
  bicycles: { min: 100, max: 5000 },
  camping: { min: 20, max: 1000 },
  books: { min: 5, max: 100 },
  music: { min: 10, max: 500 },
  tools: { min: 20, max: 2000 },
  garden: { min: 20, max: 1500 },
  kitchen: { min: 30, max: 2000 },
};

// --- 1. REAL IMAGE DICTIONARY ---
const CATEGORY_IMAGES = {
  cars: [
    { url: 'https://images.unsplash.com/photo-1494905992931-131494053d02?auto=format&fit=crop&w=800&q=80', title: 'Red Sports Car', title_he: 'מכונית ספורט אדומה' },
    { url: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=800&q=80', title: 'Luxury Sedan', title_he: 'רכב מנהלים יוקרתי' },
    { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80', title: 'Off-Road SUV', title_he: 'ג\'יפ שטח עוצמתי' },
    { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', title: 'Classic Blue Coupe', title_he: 'רכב אספנות כחול' },
    { url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80', title: 'Silver Sports Car', title_he: 'מכונית ספורט כסופה' }
  ],
  motorcycles: [
    { url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80', title: 'Cruiser Motorcycle', title_he: 'אופנוע קרוזר כבד' },
    { url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80', title: 'Red Sport Bike', title_he: 'אופנוע ספורט אדום' },
    { url: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=800&q=80', title: 'Custom Cafe Racer', title_he: 'קפה רייסר מעוצב' },
    { url: 'https://images.unsplash.com/photo-1609630856954-5e380f9ae111?auto=format&fit=crop&w=800&q=80', title: 'City Scooter', title_he: 'קטנוע עירוני חדש' }
  ],
  boats: [
    { url: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80', title: 'Luxury Yacht', title_he: 'יאכטה מפוארת' },
    { url: 'https://images.unsplash.com/photo-1544169562-b9a67a07f30e?auto=format&fit=crop&w=800&q=80', title: 'Fishing Boat', title_he: 'סירת דיג מקצועית' }
  ],
  real_estate: [
    { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', title: 'Modern Villa', title_he: 'וילה מודרנית עם בריכה' },
    { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', title: 'City Apartment', title_he: 'דירה במרכז העיר' },
    { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', title: 'Suburban House', title_he: 'בית פרטי בפרברים' }
  ],
  phones: [
    { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', title: 'Smartphone with Dual Camera', title_he: 'סמארטפון מתקדם' },
    { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', title: 'Modern Smartphone', title_he: 'טלפון חכם דור חדש' },
    { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80', title: 'Premium Phone', title_he: 'מכשיר פרימיום שמור' }
  ],
  computers: [
    { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', title: 'Pro Laptop', title_he: 'מחשב נייד מקצועי' },
    { url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80', title: 'Workstation Laptop', title_he: 'תחנת עבודה ניידת' },
    { url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80', title: 'Desktop Setup', title_he: 'מחשב נייח גיימינג' }
  ],
  gaming: [
    { url: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80', title: 'Gaming Console', title_he: 'קונסולת משחק חדשה' },
    { url: 'https://images.unsplash.com/photo-1621259182903-06dc1c460599?auto=format&fit=crop&w=800&q=80', title: 'Next-Gen Console', title_he: 'קונסולה דור הבא' },
    { url: 'https://images.unsplash.com/photo-1592840496011-a38a97d1819f?auto=format&fit=crop&w=800&q=80', title: 'RGB Keyboard', title_he: 'מקלדת גיימינג RGB' }
  ],
  cameras: [
    { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', title: 'DSLR Camera', title_he: 'מצלמת רפלקס מקצועית' },
    { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80', title: 'Vintage Camera', title_he: 'מצלמת וינטג\' נדירה' },
    { url: 'https://images.unsplash.com/photo-1624138784181-dc7f5b759b2d?auto=format&fit=crop&w=800&q=80', title: 'Mirrorless Camera', title_he: 'מצלמת מירורלס' }
  ],
  watches: [
    { url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80', title: 'Gold Watch', title_he: 'שעון זהב יוקרתי' },
    { url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80', title: 'Diver Watch', title_he: 'שעון צלילה ספורטיבי' },
    { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80', title: 'Smart Watch', title_he: 'שעון חכם מתקדם' }
  ],
  jewelry: [
    { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80', title: 'Gold Necklace', title_he: 'שרשרת זהב עדינה' },
    { url: 'https://images.unsplash.com/photo-1605100804763-eb2fc9f2c0a9?auto=format&fit=crop&w=800&q=80', title: 'Diamond Ring', title_he: 'טבעת יהלום' },
    { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80', title: 'Pearl Earrings', title_he: 'עגילי פנינה' }
  ],
  handbags: [
    { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', title: 'Leather Tote', title_he: 'תיק צד מעור' },
    { url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80', title: 'Designer Clutch', title_he: 'תיק ערב מעצבים' },
    { url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80', title: 'Crossbody Bag', title_he: 'תיק כתף אופנתי' }
  ],
  sneakers: [
    { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80', title: 'High-Top Sneakers', title_he: 'נעלי סניקרס גבוהות' },
    { url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80', title: 'Running Shoes', title_he: 'נעלי ריצה מקצועיות' },
    { url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80', title: 'Classic Canvas', title_he: 'נעלי בד קלאסיות' }
  ],
  fashion: [
    { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80', title: 'Denim Jacket', title_he: 'ג\'קט ג\'ינס' },
    { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80', title: 'Graphic Tee', title_he: 'חולצת טי מודפסת' }
  ],
  furniture: [
    { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', title: 'Velvet Sofa', title_he: 'ספת קטיפה יוקרתית' },
    { url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80', title: 'Wooden Chair', title_he: 'כסא עץ מעוצב' }
  ],
  art: [
    { url: 'https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?auto=format&fit=crop&w=800&q=80', title: 'Abstract Painting', title_he: 'ציור אבסטרקטי' },
    { url: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=800&q=80', title: 'Modern Sculpture', title_he: 'פסל מודרני' }
  ],
  pets: [
    { url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80', title: 'Golden Retriever', title_he: 'גולדן רטריבר גזעי' },
    { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', title: 'Persian Cat', title_he: 'חתול פרסי' }
  ],
  services: [
    { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80', title: 'Plumbing Service', title_he: 'שירותי אינסטלציה' },
    { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', title: 'Web Design', title_he: 'עיצוב ובניית אתרים' }
  ],
  other: [
    { url: 'https://images.unsplash.com/photo-1512418490979-92798cec1380?auto=format&fit=crop&w=800&q=80', title: 'Rare Books', title_he: 'ספרים נדירים' },
    { url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80', title: 'Classic Guitar', title_he: 'גיטרה קלאסית' }
  ],
  tablets: [
      { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80', title: 'iPad Pro', title_he: 'אייפד פרו' },
      { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=800&q=80', title: 'Android Tablet', title_he: 'טאבלט אנדרואיד' }
  ],
  drones: [
      { url: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&w=800&q=80', title: 'Camera Drone', title_he: 'רחפן צילום' },
      { url: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80', title: 'FPV Drone', title_he: 'רחפן מירוץ' }
  ],
  audio: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', title: 'Headphones', title_he: 'אוזניות סטודיו' },
      { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', title: 'Speaker', title_he: 'רמקול בלוטות\'' }
  ],
  tv: [
      { url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80', title: 'Smart TV', title_he: 'טלוויזיה חכמה' }
  ],
  scooters: [
      { url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80', title: 'Electric Scooter', title_he: 'קורקינט חשמלי' }
  ],
  bicycles: [
      { url: 'https://images.unsplash.com/photo-1485965120184-e224f723d621?auto=format&fit=crop&w=800&q=80', title: 'Mountain Bike', title_he: 'אופני הרים' },
      { url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80', title: 'Road Bike', title_he: 'אופני כביש' }
  ],
  tools: [
      { url: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80', title: 'Power Drill', title_he: 'מקדחה נטענת' }
  ],
  garden: [
      { url: 'https://images.unsplash.com/photo-1416879741262-12854f213d69?auto=format&fit=crop&w=800&q=80', title: 'Garden Plants', title_he: 'צמחי גינה' }
  ],
  kitchen: [
      { url: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=800&q=80', title: 'Coffee Machine', title_he: 'מכונת קפה' },
      { url: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80', title: 'Mixer', title_he: 'מיקסר מקצועי' }
  ]
};


async function generateRandomItem(category, user, itemIndex, allCategories) {
  const conditions = ['new', 'like_new', 'excellent', 'good', 'fair'];
  const cashFlexibilities = ['willing_to_add', 'willing_to_receive', 'both', 'trade_only'];
  
  // Weights for condition: more likely to be excellent/good than fair
  const conditionWeights = [0.1, 0.3, 0.3, 0.2, 0.1];
  const randomCondition = conditions[
      conditionWeights.reduce((acc, weight, i) => {
          const r = Math.random();
          return r < weight + (acc.sum || 0) && !acc.found ? { sum: acc.sum + weight, found: true, index: i } : { sum: acc.sum + weight, found: acc.found, index: acc.index };
      }, { sum: 0, found: false, index: 0 }).index
  ];
  
  const randomCashFlexibility = cashFlexibilities[Math.floor(Math.random() * cashFlexibilities.length)];

  // Select a real image and title
  const categoryAssets = CATEGORY_IMAGES[category.name] || CATEGORY_IMAGES['other'];
  const randomAsset = categoryAssets[Math.floor(Math.random() * categoryAssets.length)];

  let title;
  // Always favor Hebrew title if user is in Israel (for main title field)
  if (randomAsset.title_he) {
    title = randomAsset.title_he;
  } else {
    title = randomAsset.title;
  }

  // Adding the user name to description to help identify ownership easily in UI
  let description;
  let description_en;
  const itemType = category.label_he || category.label_en;
  const itemTypeEn = category.label_en || category.label_he;
  
  const hebrewDescriptions = [
      `פריט ${itemType} במצב מעולה, נמכר עקב מעבר דירה.`, 
      `שמרתי על ה${itemType} הזה בקנאות. מוכן להחלפה על משהו מעניין.`, 
      `הזדמנות חד פעמית להשיג ${itemType} איכותי מבית טוב.`, 
      `מוצר כמעט חדש לחלוטין, בקושי היה בשימוש. גמיש במחיר לרציניים.`, 
      `מחפש להחליף את ה${itemType} הזה בציוד ספורט או אלקטרוניקה.`, 
  ];

  const englishDescriptions = [
      `${itemTypeEn} item in excellent condition, sold due to moving.`,
      `I kept this ${itemTypeEn} in great shape. Ready to trade for something interesting.`,
      `One-time opportunity to get a high-quality ${itemTypeEn} from a good home.`,
      `Almost completely new product, barely used. Flexible on price for serious buyers.`,
      `Looking to swap this ${itemTypeEn} for sports equipment or electronics.`
  ];
  
  const descIndex = Math.floor(Math.random() * hebrewDescriptions.length);
  description = hebrewDescriptions[descIndex];
  description_en = englishDescriptions[descIndex];

  const priceRange = CATEGORY_PRICE_RANGES_USD[category.name] || { min: 30, max: 300 };
  const estimated_value = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;

  // Realistic looking for
  const numLookingFor = Math.floor(Math.random() * 3) + 1; // 1 to 3 categories
  const lookingFor = [];
  if (allCategories && allCategories.length > 0) {
    for (let i = 0; i < numLookingFor; i++) {
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
      if (!lookingFor.includes(randomCategory._id)) {
        lookingFor.push(randomCategory._id);
      }
    }
  }

  return {
    title: title,
    title_translations: { en: randomAsset.title, he: randomAsset.title_he || title },
    description: description,
    description_translations: { en: description_en, he: description },
    category: category._id,
    listing_type: category.name === 'services' ? 'service' : 'item',
    estimated_value: estimated_value,
    condition: randomCondition,
    images: [randomAsset.url],
    location: user.location,
    attributes: {}, 
    looking_for: lookingFor, 
    cash_flexibility: randomCashFlexibility,
    created_by: user._id, 
    seller_full_name: user.full_name,
    seller_avatar: user.avatar,
    seller_bio: user.bio,
    seller_location: user.location
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
