// Mock Base44 client for frontend development

const LOCAL_STORAGE_KEY = 'base44_user';

// --- MOCK DATABASE ---
let mockDb = {
  users: [
    { id: '1', email: 'admin@swapx.com', full_name: 'Admin User', role: 'admin', avatar: '/uploads/avatars/default-admin.png' },
    { id: '2', email: 'adam.c@example.com', full_name: 'Adam Cohen', role: 'user', avatar: '/uploads/avatars/adam-cohen.png' },
    { id: '3', email: 'fatima.as@example.com', full_name: 'Fatima Al-Sayed', role: 'user', avatar: '/uploads/avatars/fatima-alsayed.png' },
    { id: '4', email: 'sergei.i@example.com', full_name: 'Sergei Ivanov', role: 'user', avatar: '/uploads/avatars/sergei-ivanov.png' },
  ],
  categories: [
    { id: '1', name: 'cars', label_en: 'Cars', icon: 'car-icon', label_he: 'מכוניות', label_ar: 'سيارات', label_ru: 'Машины' },
    { id: '2', name: 'motorcycles', label_en: 'Motorcycles', icon: 'motorcycle-icon', label_he: 'אופנועים', label_ar: 'دراجات نارية', label_ru: 'Мотоциклы' },
    { id: '3', name: 'boats', label_en: 'Boats', icon: 'boat-icon', label_he: 'סירות', label_ar: 'قوارب', label_ru: 'Лодки' },
    { id: '4', name: 'real_estate', label_en: 'Real Estate', icon: 'building-icon', label_he: 'נדל"ן', label_ar: 'عقارات', label_ru: 'Недвижимость' },
    { id: '5', name: 'phones', label_en: 'Phones', icon: 'phone-icon', label_he: 'טלפונים', label_ar: 'هواتف', label_ru: 'Телефоны' },
    { id: '6', name: 'computers', label_en: 'Computers', icon: 'computer-icon', label_he: 'מחשבים', label_ar: 'أجهزة كمبيوتر', label_ru: 'Компьютеры' },
    { id: '7', name: 'gaming', label_en: 'Gaming', icon: 'gamepad-icon', label_he: 'גיימינג', label_ar: 'ألعاب', label_ru: 'Игры' },
    { id: '8', name: 'cameras', label_en: 'Cameras', icon: 'camera-icon', label_he: 'מצלמות', label_ar: 'كاميرات', label_ru: 'Камеры' },
    { id: '9', name: 'watches', label_en: 'Watches', icon: 'watch-icon', label_he: 'שעונים', label_ar: 'ساعات', label_ru: 'Часы' },
    { id: '10', name: 'jewelry', label_en: 'Jewelry', icon: 'gem-icon', label_he: 'תכשיטים', label_ar: 'مجوهرات', label_ru: 'Ювелирные изделия' },
    { id: '11', name: 'handbags', label_en: 'Handbags', icon: 'handbag-icon', label_he: 'תיקים', label_ar: 'حقائب يد', label_ru: 'Сумки' },
    { id: '12', name: 'sneakers', label_en: 'Sneakers', icon: 'shoe-icon', label_he: 'נעלי ספורט', label_ar: 'أحذية رياضية', label_ru: 'Кроссовки' },
    { id: '13', name: 'fashion', label_en: 'Fashion', icon: 'tshirt-icon', label_he: 'אופנה', label_ar: 'أزياء', label_ru: 'Мода' },
    { id: '14', name: 'furniture', label_en: 'Furniture', icon: 'couch-icon', label_he: 'רהיטים', label_ar: 'أثاث', label_ru: 'Мебель' },
    { id: '15', name: 'art', label_en: 'Art', icon: 'palette-icon', label_he: 'אמנות', label_ar: 'فن', label_ru: 'Искусство' },
    { id: '16', name: 'pets', label_en: 'Pets', icon: 'paw-icon', label_he: 'חיות מחמד', label_ar: 'حيوانات أليفة', label_ru: 'Домашние животные' },
    { id: '17', name: 'services', label_en: 'Services', icon: 'tools-icon', label_he: 'שירותים', label_ar: 'خدمات', label_ru: 'Услуги' },
    { id: '18', name: 'other', label_en: 'Other', icon: 'ellipsis-icon', label_he: 'אחר', label_ar: 'أخرى', label_ru: 'Другое' },
  ],
  items: [
    { id: '1', title: 'Classic Leica M6 Camera', created_by: 'adam.c@example.com', status: 'active', estimated_value: 3500, condition: 'excellent', images: ['/uploads/items/leica-m6-1.jpg'], category: 'cameras' },
    { id: '2', title: 'Apple MacBook Pro 14"', created_by: 'adam.c@example.com', status: 'active', estimated_value: 2200, condition: 'like_new', images: ['/uploads/items/macbook-pro-1.jpg'], category: 'computers' },
    { id: '3', title: 'Rare Hermès Birkin 30', created_by: 'fatima.as@example.com', status: 'active', estimated_value: 25000, condition: 'new', images: ['/uploads/items/birkin-1.jpg'], category: 'handbags' },
  ],
  conversations: [],
  messages: [],
  trades: [],
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getLoggedInUser = () => {
    try {
        const user = localStorage.getItem(LOCAL_STORAGE_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

const entityApi = (entityName) => ({
  list: async (sort, limit) => {
    await delay(300);
    console.log(`[Base44 Mock] Listing ${entityName} with sort=${sort} limit=${limit}`);
    return mockDb[entityName] || [];
  },
  filter: async (filters, sort, limit) => {
    await delay(300);
    console.log(`[Base44 Mock] Filtering ${entityName} with`, { filters, sort, limit });
    let results = mockDb[entityName] || [];
    Object.keys(filters).forEach(key => {
        if (key === '$or') {
            results = results.filter(item => filters[key].some(cond => Object.keys(cond).every(k => item[k] === cond[k])));
        } else {
            results = results.filter(item => item[key] === filters[key]);
        }
    });
    return results;
  },
  get: async (id) => {
    await delay(300);
    console.log(`[Base44 Mock] Getting ${entityName} with id=${id}`);
    const result = mockDb[entityName]?.find(e => e.id === id);
    if (!result) throw new Error(`${entityName} not found`);
    return result;
  },
  create: async (data) => {
    await delay(300);
    const newId = (Math.random() * 100000).toFixed(0).toString();
    const newData = { ...data, id: newId, created_date: new Date().toISOString() };
    mockDb[entityName].push(newData);
    console.log(`[Base44 Mock] Creating ${entityName}`, newData);
    return newData;
  },
  update: async (id, data) => {
    await delay(300);
    const index = mockDb[entityName].findIndex(e => e.id === id);
    if (index === -1) throw new Error(`${entityName} not found`);
    mockDb[entityName][index] = { ...mockDb[entityName][index], ...data };
    console.log(`[Base44 Mock] Updating ${entityName} ${id}`, mockDb[entityName][index]);
    return mockDb[entityName][index];
  },
  delete: async (id) => {
    await delay(300);
    const index = mockDb[entityName].findIndex(e => e.id === id);
    if (index === -1) throw new Error(`${entityName} not found`);
    mockDb[entityName].splice(index, 1);
    console.log(`[Base44 Mock] Deleting ${entityName} ${id}`);
    return { message: 'Deleted successfully' };
  }
});


export const base44 = {
  entities: {
    Item: entityApi('items'),
    Category: entityApi('categories'),
    Trade: entityApi('trades'),
    Conversation: entityApi('conversations'),
    Message: entityApi('messages'),
    User: entityApi('users'),
  },
  auth: {
    me: async () => {
      await delay(100);
      const user = getLoggedInUser();
      console.log('[Base44 Mock] Getting current user', user);
      if (!user) throw new Error('Not authenticated');
      // Return a more complete user object from our mock DB
      return mockDb.users.find(u => u.id === user.id);
    },
    updateMe: async (data) => {
        await delay(300);
        const currentUser = getLoggedInUser();
        if (!currentUser) throw new Error('Not authenticated');
        const dbUserIndex = mockDb.users.findIndex(u => u.id === currentUser.id);
        if (dbUserIndex > -1) {
            mockDb.users[dbUserIndex] = { ...mockDb.users[dbUserIndex], ...data };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockDb.users[dbUserIndex]));
            console.log('[Base44 Mock] Updating current user', mockDb.users[dbUserIndex]);
            return mockDb.users[dbUserIndex];
        }
        throw new Error('User not found');
    },
    login: async ({ email, password }) => {
        await delay(500);
        const user = mockDb.users.find(u => u.email === email);
        if (user) { // In a real app, you'd check password
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
            console.log('[Base44 Mock] Logged in as', user);
            return { token: 'mock-jwt-token', user };
        }
        throw new Error('Invalid credentials');
    },
    logout: () => {
        console.log('[Base44 Mock] Logging out');
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        await delay(1000);
        const url = `/uploads/mock/${file.name}`;
        console.log(`[Base44 Mock] Uploaded file ${file.name} to ${url}`);
        return { file_url: url };
      }
    }
  }
};
