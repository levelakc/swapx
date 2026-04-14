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
  tablets: { min: 100, max: 1200 },
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
  bitcoin: { min: 100, max: 100000 },
  alt: { min: 50, max: 50000 },
  meme: { min: 10, max: 100000 },
};

// MASSIVELY EXPANDED IMAGES LIST (+49 new items)
const CATEGORY_IMAGES = {
  phones: [
    { url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800&auto=format&fit=crop', title: 'iPhone 15 Pro', title_he: 'אייפון 15 פרו', min_price: 900, max_price: 1200 },
    { url: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=800&auto=format&fit=crop', title: 'Samsung Galaxy S23', title_he: 'סמסונג גלקסי S23', min_price: 700, max_price: 900 },
    { url: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=800&auto=format&fit=crop', title: 'Google Pixel 8', title_he: 'גוגל פיקסל 8', min_price: 600, max_price: 800 },
    { url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba3f9e?q=80&w=800&auto=format&fit=crop', title: 'iPhone 13 Mini', title_he: 'אייפון 13 מיני', min_price: 400, max_price: 550 },
    { url: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800&auto=format&fit=crop', title: 'Xiaomi 13 Ultra', title_he: 'שיאומי 13 אולטרה', min_price: 500, max_price: 750 },
    // NEW PHONES
    { url: 'https://images.unsplash.com/photo-1598327105666-5b89351cb31b?q=80&w=800&auto=format&fit=crop', title: 'OnePlus 11 5G', title_he: 'וואן פלוס 11 5G', min_price: 550, max_price: 750 },
    { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop', title: 'Samsung Galaxy Z Fold 5', title_he: 'סמסונג גלקסי Z Fold 5', min_price: 1100, max_price: 1500 },
    { url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop', title: 'iPhone 14 Pro Max', title_he: 'אייפון 14 פרו מקס', min_price: 800, max_price: 1050 }
  ],
  tablets: [
    { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop', title: 'iPad Pro 12.9', title_he: 'אייפד פרו 12.9', min_price: 800, max_price: 1300 },
    { url: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?q=80&w=800&auto=format&fit=crop', title: 'Samsung Galaxy Tab S9', title_he: 'סמסונג גלקסי טאב S9', min_price: 400, max_price: 800 },
    { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=800&auto=format&fit=crop', title: 'iPad Air M1', title_he: 'אייפד אייר M1', min_price: 500, max_price: 700 },
    // NEW TABLETS
    { url: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=800&auto=format&fit=crop', title: 'iPad Mini 6', title_he: 'אייפד מיני 6', min_price: 350, max_price: 500 },
    { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?q=80&w=800&auto=format&fit=crop', title: 'Microsoft Surface Pro 9', title_he: 'מייקרוסופט סרפס פרו 9', min_price: 800, max_price: 1200 },
    { url: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?q=80&w=800&auto=format&fit=crop', title: 'Lenovo Yoga Tab 13', title_he: 'לנובו יוגה טאב 13', min_price: 400, max_price: 600 }
  ],
  computers: [
    { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop', title: 'MacBook Air M2', title_he: 'מקבוק אייר M2', min_price: 1000, max_price: 1300 },
    { url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=800&auto=format&fit=crop', title: 'Dell XPS 15', title_he: 'דל XPS 15', min_price: 1500, max_price: 2200 },
    { url: 'https://images.unsplash.com/photo-1517336712461-7e9024b7ad33?q=80&w=800&auto=format&fit=crop', title: 'MacBook Pro 14"', title_he: 'מקבוק פרו 14 אינץ׳', min_price: 1800, max_price: 2500 },
    // NEW COMPUTERS
    { url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=800&auto=format&fit=crop', title: 'Custom Gaming PC RTX 4080', title_he: 'מחשב גיימינג מותאם אישית', min_price: 1500, max_price: 3000 },
    { url: 'https://images.unsplash.com/photo-1605810730816-1f6b8b056193?q=80&w=800&auto=format&fit=crop', title: 'Apple iMac 24" M1', title_he: 'איימק 24 אינץ׳ M1', min_price: 900, max_price: 1400 },
    { url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=800&auto=format&fit=crop', title: 'Mac Studio M2 Max', title_he: 'מק סטודיו M2 מקס', min_price: 1800, max_price: 2600 },
    { url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=800&auto=format&fit=crop', title: 'HP Spectre x360', title_he: 'מחשב נייד HP Spectre', min_price: 900, max_price: 1500 }
  ],
  cars: [
    { url: 'https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=800&auto=format&fit=crop', title: 'Porsche 911 Carrera', title_he: 'פורשה 911 קאררה', min_price: 120000, max_price: 250000 },
    { url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800&auto=format&fit=crop', title: 'Tesla Model S Plaid', title_he: 'טסלה מודל S פלייד', min_price: 90000, max_price: 130000 },
    { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800&auto=format&fit=crop', title: 'Range Rover Sport', title_he: 'ריינג׳ רובר ספורט', min_price: 60000, max_price: 130000 },
    { url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop', title: 'Ford Focus ST', title_he: 'פורד פוקוס ST', min_price: 15000, max_price: 25000 },
    { url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop', title: 'Toyota Corolla Hybrid', title_he: 'טויוטה קורולה היברידית', min_price: 18000, max_price: 28000 },
    // NEW CARS
    { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800&auto=format&fit=crop', title: 'BMW M4 Competition', title_he: 'ב.מ.וו M4 קומפטישן', min_price: 75000, max_price: 110000 },
    { url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=800&auto=format&fit=crop', title: 'Audi RS6 Avant', title_he: 'אאודי RS6 אוואנט', min_price: 100000, max_price: 140000 },
    { url: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?q=80&w=800&auto=format&fit=crop', title: 'Mercedes-Benz G-Class', title_he: 'מרצדס ג׳י קלאס', min_price: 130000, max_price: 200000 },
    { url: 'https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?q=80&w=800&auto=format&fit=crop', title: 'Jeep Wrangler Rubicon', title_he: 'ג׳יפ רנגלר רוביקון', min_price: 40000, max_price: 70000 },
    { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop', title: 'Chevrolet Corvette C8', title_he: 'שברולט קורבט C8', min_price: 65000, max_price: 95000 }
  ],
  motorcycles: [
    { url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop', title: 'Harley Davidson Iron 883', title_he: 'הארלי דייוידסון 883', min_price: 8000, max_price: 12000 },
    { url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop', title: 'Ducati Panigale V4', title_he: 'דוקאטי פניגאלה V4', min_price: 22000, max_price: 35000 },
    // NEW MOTORCYCLES
    { url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=800&auto=format&fit=crop', title: 'Yamaha YZF-R1', title_he: 'ימאהה R1', min_price: 15000, max_price: 22000 },
    { url: 'https://images.unsplash.com/photo-1599819811279-d5064ce6f059?q=80&w=800&auto=format&fit=crop', title: 'Triumph Bonneville T120', title_he: 'טריומף בונוויל T120', min_price: 10000, max_price: 14000 },
    { url: 'https://images.unsplash.com/photo-1560159846-9b50b73c2db7?q=80&w=800&auto=format&fit=crop', title: 'Kawasaki Ninja ZX-10R', title_he: 'קוואסקי נינג׳ה ZX-10R', min_price: 14000, max_price: 19000 }
  ],
  boats: [
    { url: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=800&auto=format&fit=crop', title: 'Luxury Yacht 40ft', title_he: 'יאכטה יוקרתית 40 רגל', min_price: 250000, max_price: 750000 },
    // NEW BOATS
    { url: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=800&auto=format&fit=crop', title: 'Sea Ray Sundancer', title_he: 'סירת מנוע Sea Ray', min_price: 80000, max_price: 150000 },
    { url: 'https://images.unsplash.com/photo-1621277224630-81a7ee92dc17?q=80&w=800&auto=format&fit=crop', title: 'Yamaha WaveRunner', title_he: 'אופנוע ים ימאהה', min_price: 8000, max_price: 15000 }
  ],
  scooters: [
    { url: 'https://images.unsplash.com/photo-1558981852-426c6c22a060?q=80&w=800&auto=format&fit=crop', title: 'Xiaomi Pro 2 Scooter', title_he: 'קורקינט שיאומי פרו 2', min_price: 350, max_price: 550 },
    { url: 'https://images.unsplash.com/photo-1565158630607-35313941296c?q=80&w=800&auto=format&fit=crop', title: 'Vespa Primavera 125', title_he: 'וספה פרימוורה 125', min_price: 3500, max_price: 5500 },
    // NEW SCOOTERS
    { url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=800&auto=format&fit=crop', title: 'Segway Ninebot Max G30', title_he: 'סגווי ניינבוט מקס', min_price: 600, max_price: 900 },
    { url: 'https://images.unsplash.com/photo-1624888506144-8395ea2e6de6?q=80&w=800&auto=format&fit=crop', title: 'Dualtron Thunder', title_he: 'דואלטרון ת׳אנדר אקסטרים', min_price: 2500, max_price: 4000 }
  ],
  bicycles: [
    { url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800&auto=format&fit=crop', title: 'Specialized Stumpjumper MTB', title_he: 'אופני הרים Specialized', min_price: 1500, max_price: 4000 },
    // NEW BICYCLES
    { url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=800&auto=format&fit=crop', title: 'Trek Madone SLR 9', title_he: 'אופני כביש טרק', min_price: 5000, max_price: 12000 },
    { url: 'https://images.unsplash.com/photo-1576435728678-68ce0b622602?q=80&w=800&auto=format&fit=crop', title: 'Brompton C Line Folding Bike', title_he: 'אופניים מתקפלים ברומפטון', min_price: 1200, max_price: 2500 },
    { url: 'https://images.unsplash.com/photo-1528629297340-d1d466945dc5?q=80&w=800&auto=format&fit=crop', title: 'Specialized Turbo Levo E-Bike', title_he: 'אופניים חשמליים ספשילייזד', min_price: 3000, max_price: 8000 }
  ],
  watches: [
    { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop', title: 'Rolex Submariner Date', title_he: 'רולקס סאבמרינר', min_price: 12000, max_price: 28000 },
    { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop', title: 'Apple Watch Ultra 2', title_he: 'אפל ווטש אולטרה 2', min_price: 750, max_price: 950 },
    // NEW WATCHES
    { url: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=800&auto=format&fit=crop', title: 'Omega Speedmaster Professional', title_he: 'אומגה ספידמאסטר', min_price: 4500, max_price: 8000 },
    { url: 'https://images.unsplash.com/photo-1587836374828-cb4387d0f98e?q=80&w=800&auto=format&fit=crop', title: 'Cartier Santos', title_he: 'קרטייה סנטוס', min_price: 6000, max_price: 11000 },
    { url: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800&auto=format&fit=crop', title: 'Seiko Prospex Diver', title_he: 'שעון צלילה סייקו', min_price: 400, max_price: 1200 }
  ],
  gaming: [
    { url: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=800&auto=format&fit=crop', title: 'PlayStation 5 Digital Edition', title_he: 'פלייסטיישן 5 דיגיטלי', min_price: 400, max_price: 550 },
    { url: 'https://images.unsplash.com/photo-1621259182903-06dc1c460599?q=80&w=800&auto=format&fit=crop', title: 'Xbox Series X 1TB', title_he: 'אקסבוקס Series X', min_price: 450, max_price: 550 },
    // NEW GAMING
    { url: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?q=80&w=800&auto=format&fit=crop', title: 'Nintendo Switch OLED', title_he: 'נינטנדו סוויץ׳ OLED', min_price: 250, max_price: 350 },
    { url: 'https://images.unsplash.com/photo-1669213872221-aee4b11f67f2?q=80&w=800&auto=format&fit=crop', title: 'Valve Steam Deck 512GB', title_he: 'קונסולת Steam Deck', min_price: 400, max_price: 650 },
    { url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=800&auto=format&fit=crop', title: 'Meta Quest 3 VR Headset', title_he: 'משקפי מציאות מדומה Meta Quest 3', min_price: 450, max_price: 600 }
  ],
  cameras: [
    { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop', title: 'Sony A7 IV Body', title_he: 'סוני A7 IV', min_price: 2100, max_price: 2600 },
    { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&auto=format&fit=crop', title: 'Fujifilm X-T5 Silver', title_he: 'פוג׳יפילם X-T5', min_price: 1500, max_price: 1900 },
    // NEW CAMERAS
    { url: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?q=80&w=800&auto=format&fit=crop', title: 'Canon EOS R5', title_he: 'קנון EOS R5', min_price: 2800, max_price: 3500 },
    { url: 'https://images.unsplash.com/photo-1589810635645-5cb2b5220c4c?q=80&w=800&auto=format&fit=crop', title: 'Nikon Z9 Flagship', title_he: 'ניקון Z9', min_price: 4000, max_price: 5500 },
    { url: 'https://images.unsplash.com/photo-1527011045974-45b13686d0ee?q=80&w=800&auto=format&fit=crop', title: 'Leica Q3 Compact', title_he: 'מצלמת לייקה Q3', min_price: 5000, max_price: 6500 }
  ],
  sneakers: [
    { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop', title: 'Nike Air Jordan 1 Lost & Found', title_he: 'אייר ג׳ורדן 1 נדיר', min_price: 250, max_price: 600 },
    { url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=80&w=800&auto=format&fit=crop', title: 'Adidas Yeezy Boost 350 V2', title_he: 'איזי בוסט 350', min_price: 200, max_price: 450 },
    // NEW SNEAKERS
    { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop', title: 'New Balance 990v6', title_he: 'ניו באלאנס 990', min_price: 150, max_price: 250 },
    { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop', title: 'Nike Dunk Low Panda', title_he: 'ניייקי דאנק לואו פנדה', min_price: 100, max_price: 200 }
  ],
  bitcoin: [
    { url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=800&auto=format&fit=crop', title: '1.0 Bitcoin (BTC)', title_he: '1.0 ביטקוין', min_price: 60000, max_price: 70000 },
    { url: 'https://images.unsplash.com/photo-1621416848440-236914c7447d?q=80&w=800&auto=format&fit=crop', title: '5.0 Ethereum (ETH)', title_he: '5.0 אתריום', min_price: 15000, max_price: 20000 },
    { url: 'https://images.unsplash.com/photo-1622790694515-6d629f3cb427?q=80&w=800&auto=format&fit=crop', title: '100 Solana (SOL)', title_he: '100 סולאנה', min_price: 10000, max_price: 15000 }
  ],
  alt: [
    { url: 'https://images.unsplash.com/photo-1622790694515-6d629f3cb427?q=80&w=800&auto=format&fit=crop', title: 'Cardano (ADA) Bundle', title_he: 'חבילת קרדאנו', min_price: 500, max_price: 2000 },
    { url: 'https://images.unsplash.com/photo-1621416848440-236914c7447d?q=80&w=800&auto=format&fit=crop', title: 'Polkadot (DOT) Stack', title_he: 'ערימת פולקדות', min_price: 400, max_price: 1500 }
  ],
  meme: [
    { url: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=800&auto=format&fit=crop', title: '1M Dogecoin (DOGE)', title_he: 'מיליון דוגקוין', min_price: 80000, max_price: 150000 },
    { url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop', title: 'Shiba Inu (SHIB) Collection', title_he: 'אוסף שיבא אינו', min_price: 1000, max_price: 5000 },
    { url: 'https://images.unsplash.com/photo-1605792657660-596af903772c?q=80&w=800&auto=format&fit=crop', title: 'Pepe Coin Assets', title_he: 'נכסי פפה קוין', min_price: 500, max_price: 3000 }
  ],
  jewelry: [
    { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop', title: '18k White Gold Engagement Ring', title_he: 'טבעת יהלום 18 קראט', min_price: 2500, max_price: 8000 },
    // NEW JEWELRY
    { url: 'https://images.unsplash.com/photo-1599643478524-fb66f481c4c8?q=80&w=800&auto=format&fit=crop', title: '14k Gold Cuban Link Chain', title_he: 'שרשרת זהב קובנית 14 קראט', min_price: 800, max_price: 2500 },
    { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop', title: 'Diamond Stud Earrings', title_he: 'עגילי יהלום צמודים', min_price: 1000, max_price: 5000 }
  ],
  fashion: [
    { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', title: 'Levi\'s Vintage Denim Jacket', title_he: 'ז׳קט ג׳ינס ליוויס', min_price: 60, max_price: 180 },
    // NEW FASHION
    { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop', title: 'Burberry Classic Trench Coat', title_he: 'מעיל טרנץ׳ ברברי מקורי', min_price: 400, max_price: 1200 },
    { url: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop', title: 'Vintage Schott Leather Jacket', title_he: 'מעיל עור וינטג׳', min_price: 250, max_price: 600 }
  ],
  handbags: [
    { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop', title: 'Prada Leather Shoulder Bag', title_he: 'תיק פראדה מקורי', min_price: 1200, max_price: 2800 },
    // NEW HANDBAGS
    { url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800&auto=format&fit=crop', title: 'Chanel Classic Flap Bag', title_he: 'תיק צ׳אנל קלאסי', min_price: 4000, max_price: 9000 },
    { url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop', title: 'Hermès Birkin 30', title_he: 'הרמס בירקין 30 נדיר', min_price: 15000, max_price: 25000 }
  ],
  furniture: [
    { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop', title: 'Modern Italian Velvet Sofa', title_he: 'ספת קטיפה איטלקית', min_price: 1200, max_price: 3500 },
    // NEW FURNITURE
    { url: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=800&auto=format&fit=crop', title: 'Herman Miller Aeron Chair', title_he: 'כיסא עבודה הרמן מילר ארון', min_price: 600, max_price: 1200 },
    { url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?q=80&w=800&auto=format&fit=crop', title: 'Solid Oak Dining Table', title_he: 'שולחן אוכל עץ אלון מלא', min_price: 800, max_price: 2500 },
    { url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=800&auto=format&fit=crop', title: 'Mid-Century Modern Credenza', title_he: 'שידת וינטג׳ אמצע המאה', min_price: 500, max_price: 1800 }
  ],
  real_estate: [
    { url: 'https://images.unsplash.com/photo-1580587771525-78b9bed22ad9?q=80&w=800&auto=format&fit=crop', title: '6-Bedroom Modern Villa with Pool', title_he: 'וילה מודרנית 6 חדרים', min_price: 2500000, max_price: 5500000 },
    // NEW REAL ESTATE
    { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop', title: 'City Center Luxury Penthouse', title_he: 'פנטהאוז יוקרתי במרכז העיר', min_price: 3500000, max_price: 8000000 },
    { url: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop', title: 'Rustic Cabin Getaway', title_he: 'בקתת עץ כפרית בטבע', min_price: 450000, max_price: 900000 }
  ],
  pets: [
    { url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop', title: 'Purebred Golden Retriever Puppy', title_he: 'גור גולדן רטריבר גזעי', min_price: 1500, max_price: 3000 },
    // NEW PETS
    { url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=800&auto=format&fit=crop', title: 'British Shorthair Kitten', title_he: 'חתלתול בריטי קצר שיער', min_price: 1000, max_price: 2000 },
    { url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop', title: 'French Bulldog Puppy', title_he: 'גור בולדוג צרפתי', min_price: 2500, max_price: 4500 }
  ],
  art: [
    { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop', title: 'Large Format Abstract Oil Painting', title_he: 'ציור שמן אבסטרקט ענק', min_price: 500, max_price: 8000 },
    // NEW ART
    { url: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=80&w=800&auto=format&fit=crop', title: 'Contemporary Metal Sculpture', title_he: 'פסל מתכת מודרני', min_price: 1500, max_price: 5000 },
    { url: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=800&auto=format&fit=crop', title: 'Pop Art Canvas Original', title_he: 'קנבס פופ ארט מקורי', min_price: 300, max_price: 2500 }
  ],
  tools: [
    { url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=800&auto=format&fit=crop', title: 'DeWalt 20V Cordless Drill Set', title_he: 'סט מברגות דיוולט', min_price: 180, max_price: 350 },
    // NEW TOOLS
    { url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop', title: 'Makita Table Saw', title_he: 'מסור שולחני מקיטה', min_price: 400, max_price: 850 },
    { url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?q=80&w=800&auto=format&fit=crop', title: 'Professional Mechanic Tool Chest', title_he: 'עגלת כלי עבודה מקצועית', min_price: 600, max_price: 1500 }
  ],
  kitchen: [
    { url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop', title: 'Breville Barista Pro Espresso', title_he: 'מכונת אספרסו ברוויל', min_price: 600, max_price: 950 },
    // NEW KITCHEN
    { url: 'https://images.unsplash.com/photo-1594246848130-9b6d61f1816f?q=80&w=800&auto=format&fit=crop', title: 'KitchenAid Artisan Stand Mixer', title_he: 'מיקסר קיטשן אייד ארטיזן', min_price: 300, max_price: 550 },
    { url: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=800&auto=format&fit=crop', title: 'Vitamix Professional Blender', title_he: 'בלנדר ויטמיקס מקצועי', min_price: 400, max_price: 700 }
  ],
  garden: [
    { url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=800&auto=format&fit=crop', title: 'Rattan Outdoor Lounge Suite', title_he: 'סט ראטן יוקרתי לגינה', min_price: 80, max_price: 250 },
    // NEW GARDEN
    { url: 'https://images.unsplash.com/photo-1558904541-efa843a96f0a?q=80&w=800&auto=format&fit=crop', title: 'Weber Genesis Gas Grill', title_he: 'גריל גז וובר', min_price: 600, max_price: 1200 },
    { url: 'https://images.unsplash.com/photo-1585072045512-1f7d730a84f5?q=80&w=800&auto=format&fit=crop', title: 'Husqvarna Riding Mower', title_he: 'טרקטורון כיסוח דשא', min_price: 1500, max_price: 3500 }
  ],
  drones: [
    { url: 'https://images.unsplash.com/photo-1473968512647-3e44a224fe8f?q=80&w=800&auto=format&fit=crop', title: 'DJI Mavic 3 Pro Cine', title_he: 'רחפן DJI Mavic 3 Pro', min_price: 1500, max_price: 3500 },
    // NEW DRONES
    { url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop', title: 'DJI Mini 4 Pro', title_he: 'רחפן DJI Mini 4 Pro', min_price: 750, max_price: 1100 },
    { url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=800&auto=format&fit=crop', title: 'FPV Racing Drone Bundle', title_he: 'ערכת רחפן מרוצים FPV', min_price: 400, max_price: 900 }
  ],
  audio: [
    { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop', title: 'Sony WH-1000XM5 ANC Headphones', title_he: 'אוזניות סוני XM5', min_price: 300, max_price: 450 },
    // NEW AUDIO
    { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop', title: 'AirPods Max', title_he: 'איירפודס מקס', min_price: 400, max_price: 550 },
    { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop', title: 'Sonos Arc Soundbar', title_he: 'מקרן קול סונוס', min_price: 700, max_price: 950 }
  ],
  tv: [
    { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop', title: '75" LG C3 OLED 4K TV', title_he: 'טלוויזיה LG OLED 75 אינץ׳', min_price: 1500, max_price: 3500 },
    // NEW TV
    { url: 'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?q=80&w=800&auto=format&fit=crop', title: 'Samsung 65" Neo QLED', title_he: 'טלוויזיה סמסונג QLED', min_price: 1000, max_price: 2200 },
    { url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=800&auto=format&fit=crop', title: 'Epson 4K Home Cinema Projector', title_he: 'מקרן קולנוע ביתי 4K', min_price: 1200, max_price: 3000 }
  ],
  books: [
    { url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop', title: 'Rare 1st Edition Classic Novel', title_he: 'מהדורה ראשונה נדירה', min_price: 100, max_price: 2000 },
    // NEW BOOKS
    { url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop', title: 'Complete Encyclopedia Set', title_he: 'סט אנציקלופדיה שלם', min_price: 50, max_price: 300 },
    { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop', title: 'Vintage Comic Book Collection', title_he: 'אוסף קומיקס וינטג׳', min_price: 200, max_price: 1500 }
  ],
  music: [
    { url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop', title: 'Fender Stratocaster American Pro', title_he: 'גיטרה פנדר אמריקאית', min_price: 1200, max_price: 2500 },
    // NEW MUSIC
    { url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=800&auto=format&fit=crop', title: 'Roland Digital Piano', title_he: 'פסנתר חשמלי רולנד', min_price: 800, max_price: 2000 },
    { url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=800&auto=format&fit=crop', title: 'Yamaha Acoustic Drum Kit', title_he: 'מערכת תופים ימאהה', min_price: 500, max_price: 1500 }
  ],
  services: [
    { url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6954?q=80&w=800&auto=format&fit=crop', title: 'Full Home Deep Cleaning Service', title_he: 'ניקוי יסודי לבית', min_price: 80, max_price: 250 },
    { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop', title: 'Fullstack Web App Development', title_he: 'פיתוח אפליקציות ווב', min_price: 150, max_price: 1000 },
    { url: 'https://images.unsplash.com/photo-1548690312-e3b507d17a12?q=80&w=800&auto=format&fit=crop', title: 'Elite Personal Training Program', title_he: 'אימון כושר אישי עילית', min_price: 50, max_price: 150 },
    // NEW SERVICES
    { url: 'https://images.unsplash.com/photo-1542621323-2287f3b8908f?q=80&w=800&auto=format&fit=crop', title: 'Professional Photography Session', title_he: 'צילומי חוץ מקצועיים', min_price: 100, max_price: 500 },
    { url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=800&auto=format&fit=crop', title: 'Business Consulting & Strategy', title_he: 'ייעוץ עסקי ואסטרטגיה', min_price: 200, max_price: 800 },
    { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop', title: 'Interior Design Consultation', title_he: 'ייעוץ עיצוב פנים', min_price: 150, max_price: 600 }
  ],
};



const CATEGORY_BRANDS = {
  electronics: ["Apple", "Samsung", "Sony", "Dell", "HP", "LG", "Logitech", "Asus", "Xiaomi", "Bose", "Sennheiser", "Microsoft", "Intel", "NVIDIA"],
  vehicles: ["Toyota", "Tesla", "Honda", "BMW", "Mercedes", "Yamaha", "Ford", "Mazda", "Audi", "Volkswagen", "Hyundai", "Kia", "Kawasaki", "Ducati"],
  fashion_main: ["Nike", "Adidas", "Zara", "Gucci", "Prada", "Levis", "H&M", "Puma", "Uniqlo", "Channel", "Louis Vuitton", "Hermes", "Burberry", "Ralph Lauren"],
  watches: ["Rolex", "Casio", "Seiko", "Omega", "Tag Heuer", "Tissot", "Apple Watch", "Garmin", "Patek Philippe", "Audemars Piguet", "Hublot", "IWC"],
  gaming: ["Nintendo", "Sony PlayStation", "Microsoft Xbox", "Razer", "MSI", "Alienware", "Logitech G", "SteelSeries", "Corsair", "HyperX", "ASUS ROG"],
  cameras: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro", "Panasonic", "DJI", "Leica", "Olympus", "Sigma", "Tamron"],
  jewelry: ["Pandora", "Tiffany & Co.", "Cartier", "Swarovski", "Bvlgari", "Graff", "Harry Winston", "Chopard", "Van Cleef & Arpels"],
  phones: ["Apple iPhone", "Samsung Galaxy", "Google Pixel", "OnePlus", "Xiaomi", "Nothing", "Motorola", "Sony Xperia", "Huawei", "Oppo"],
  computers: ["Apple MacBook", "Dell XPS", "Lenovo ThinkPad", "HP Spectre", "ASUS ROG", "Microsoft Surface", "Razer Blade", "Acer Predator"],
};

async function generateRandomItem(category, user, itemIndex, allCategories) {
  const conditions = ['new', 'like_new', 'excellent', 'good', 'fair'];
  const cashFlexibilities = ['can_add', 'can_receive', 'can_add_or_receive', 'prefer_exchange'];
  
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const randomCashFlexibility = cashFlexibilities[Math.floor(Math.random() * cashFlexibilities.length)];

  const brandList = CATEGORY_BRANDS[category.name] || [];
  // 70% chance to have a brand, 30% unbranded
  const randomBrand = Math.random() > 0.1 && brandList.length > 0 
    ? brandList[Math.floor(Math.random() * brandList.length)] 
    : "";


  // We are guaranteed to have categoryAssets because of the check in the main loop
  const categoryAssets = CATEGORY_IMAGES[category.name]; 
  const assetIndex = itemIndex % categoryAssets.length;
  const randomAsset = categoryAssets[assetIndex];
  
  // Pick 1-3 images from the category pool for more variety
  const numImages = Math.floor(Math.random() * 3) + 1;
  const itemImages = [];
  for(let j=0; j < numImages; j++) {
      const imgIdx = (assetIndex + j) % categoryAssets.length;
      itemImages.push(categoryAssets[imgIdx].url);
  }

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
      `מצב חדש לגמרי, היה בשימוש פעמים ספורות בלבד.`,
      `גמיש מעט במחיר לרציניים, פתוח להצעות החלפה מעניינות.`,
      `נמכר עקב מעבר דירה, חייב להימכר מהר!`,
      `איכות ללא פשרות, כל הקודם זוכה.`,
      `פריט נדיר במצב מצוין, קשה למצוא כאלה היום.`
  ];

  const englishDescriptions = [
      `${itemTypeEn} in excellent condition, barely used.`,
      `I kept this ${itemTypeEn} in great shape. Open to trades.`,
      `Opportunity to get a high-quality ${itemTypeEn} at a fair price.`,
      `Very well maintained, comes with all original accessories.`,
      `Looking to upgrade my ${itemTypeEn} to something newer.`,
      `Brand new condition, used only a few times.`,
      `Slightly flexible on price for serious buyers, open to interesting trade offers.`,
      `Selling due to moving, must go fast!`,
      `Uncompromising quality, first come first served.`,
      `Rare item in excellent condition, hard to find these days.`
  ];
  
  const descIndex = (itemIndex + Math.floor(Math.random() * hebrewDescriptions.length)) % hebrewDescriptions.length;
  description = hebrewDescriptions[descIndex];
  description_en = englishDescriptions[descIndex];

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
    brand: randomBrand,
    
    estimated_value: estimated_value,
    condition: randomCondition,
    images: itemImages,
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
      { name: 'crypto_main', label_en: 'Crypto', label_he: 'קריפטו', icon: 'bitcoin' },
      ];
    const mainCategories = {};
    const createdCategories = [];

    for (const cat of mainCategoriesData) {
        const newCat = await Category.create({ ...cat, parent: null });
        mainCategories[cat.name] = newCat;
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

        // Crypto
        { name: 'bitcoin', parent: 'crypto_main', label_en: 'Bitcoin', icon: 'bitcoin', label_he: 'ביטקוין' },
        { name: 'alt', parent: 'crypto_main', label_en: 'Alt Coins', icon: 'coins', label_he: 'מטבעות אלטרנטיביים' },
        { name: 'meme', parent: 'crypto_main', label_en: 'Meme Coins', icon: 'zap', label_he: 'מטבעות מים' },
        // Fashion
        { name: 'fashion', parent: 'fashion_main', label_en: 'Clothing', icon: 'shirt', label_he: 'ביגוד' },
        { name: 'sneakers', parent: 'fashion_main', label_en: 'Sneakers', icon: 'footprints', label_he: 'נעליים' },
        { name: 'watches', parent: 'fashion_main', label_en: 'Watch', icon: 'watch', label_he: 'שעונים' },
        { name: 'jewelry', parent: 'fashion_main', label_en: 'Jewelry', icon: 'diamond', label_he: 'תכשיטים' },
        { name: 'handbags', parent: 'fashion_main', label_en: 'Handbags', icon: 'shopping-bag', label_he: 'תיקים' },

        // Home
        { name: 'furniture', parent: 'home', label_en: 'Furniture', icon: 'sofa', label_he: 'רהיטים' },
        { name: 'kitchen', parent: 'home', label_en: 'Kitchen', icon: 'coffee', label_he: 'מטבח' },
        { name: 'garden', parent: 'home', label_en: 'Garden', icon: 'flower', label_he: 'גינה' },
        { name: 'tools', parent: 'home', label_en: 'Tools', icon: 'tool', label_he: 'כלי עבודה' },

        // Real Estate
        { name: 'real_estate', parent: 'real_estate_main', label_en: 'Properties', icon: 'home', label_he: 'נכסים' },
        { name: 'lands', parent: 'real_estate_main', label_en: 'Lands', icon: 'map', label_he: 'קרקעות' },

        // Lifestyle
        { name: 'art', parent: 'lifestyle', label_en: 'Art', icon: 'palette', label_he: 'אמנות' },
        { name: 'pets', parent: 'lifestyle', label_en: 'Pets', icon: 'dog', label_he: 'חיות מחמד' },
        { name: 'books', parent: 'lifestyle', label_en: 'Books', icon: 'book', label_he: 'ספרים' },
        { name: 'music', parent: 'lifestyle', label_en: 'Musical Instruments', icon: 'music', label_he: 'כלי נגינה' },

        // Services
        { name: 'services', parent: 'services_main', label_en: 'General Services', icon: 'briefcase', label_he: 'שירותים כלליים' },
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
        email: 'admin@ahlafot.com',
        password: 'AhlaX_Admin_99!_Safe_#2026', 
        role: 'admin',
        bio: 'מנהל המערכת הראשי של Ahlafot.',
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
                en: `Hello ${user.full_name}, welcome to Ahlafot! I'm ${chatbot.name}, your personal assistant.`,
                he: `שלום ${user.full_name}, ברוך הבא ל-Ahlafot! אני ${chatbot.name}, העוזרת האישית שלך.`,
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
    // --- ITEMS ---
    const allItems = [];
    const allServices = [];
    
    for (const category of createdCategories) {
      const categoryAssets = CATEGORY_IMAGES[category.name];
      
      if (!categoryAssets || categoryAssets.length === 0) continue;

      if (category.name === "services") {
          for (let i = 0; i < categoryAssets.length; i++) {
            const randomUserIndex = Math.floor(Math.random() * (createdUsers.length - 1)) + 1;
            const owner = createdUsers[randomUserIndex];
            const asset = categoryAssets[i];
            const hourly_rate = Math.floor(Math.random() * (asset.max_price - asset.min_price + 1)) + asset.min_price;

            allServices.push({
                title: asset.title_he || asset.title,
                description: `שירות ${asset.title_he || asset.title} מקצועי ואיכותי ברמה הגבוהה ביותר. מעל 10 שנות ניסיון בתחום, הקפדה על לוחות זמנים ותוצאה מושלמת.`,
                description_translations: {
                    en: `Top-tier ${asset.title} services provided by a certified professional with extensive experience.`,
                    he: `שירות ${asset.title_he || asset.title} מקצועי ואיכותי ברמה הגבוהה ביותר.`
                },
                category: category.name,
                hourly_rate: hourly_rate,
                availability: "09:00 - 17:00",
                location: owner.location || "Tel Aviv",
                images: [asset.url],
                provider: owner._id,
                provider_name: owner.full_name,
                provider_avatar: owner.avatar,
                provider_email: owner.email
            });
          }
      } else {
          // Multiply items per category (run loop 3 times for ~250 items total)
          for (let k = 0; k < 3; k++) {
            for (let i = 0; i < categoryAssets.length; i++) {
              const randomUserIndex = Math.floor(Math.random() * (createdUsers.length - 1)) + 1;
              const owner = createdUsers[randomUserIndex];
              const newItem = await generateRandomItem(category, owner, i + (k * 100), createdCategories);
              allItems.push(newItem);
            }
          }
      }
    }

    const createdItems = await Item.insertMany(allItems);
    const createdServices = await Service.insertMany(allServices);
    console.log(`Seeded ${createdItems.length} items and ${createdServices.length} services.`);

    console.log("Database seeding completed successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding database:", error);
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