export const CATEGORY_ATTRIBUTES = {
    vehicles: {
        fields: [
            { name: 'brand', type: 'select', label_en: 'Brand', label_he: 'מותג', options: ['Toyota', 'Tesla', 'Porsche', 'BMW', 'Mercedes', 'Audi', 'Honda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Volkswagen', 'Subaru', 'Mazda', 'Nissan', 'Lexus', 'Volvo', 'Jeep', 'Land Rover', 'Mitsubishi', 'Peugeot', 'Renault', 'Skoda', 'Seat', 'Ferrari', 'Lamborghini', 'Maserati', 'Other'] },
            { name: 'model', type: 'text', label_en: 'Model', label_he: 'דגם' },
            { name: 'year', type: 'number', label_en: 'Year', label_he: 'שנה', min: 1950, max: new Date().getFullYear() + 1 },
            { name: 'mileage', type: 'number', label_en: 'Mileage (km)', label_he: 'קילומטראז׳' },
            { name: 'transmission', type: 'select', label_en: 'Transmission', label_he: 'תיבת הילוכים', options: ['Automatic', 'Manual', 'Other'] },
            { name: 'engine_type', type: 'select', label_en: 'Engine Type', label_he: 'סוג מנוע', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other'] },
        ]
    },
    real_estate: {
        fields: [
            { name: 'property_type', type: 'select', label_en: 'Property Type', label_he: 'סוג נכס', options: ['Apartment', 'House', 'Office', 'Land', 'Warehouse', 'Other'] },
            { name: 'sqm', type: 'number', label_en: 'Square Meters', label_he: 'מ״ר' },
            { name: 'rooms', type: 'number', label_en: 'Rooms', label_he: 'חדרים' },
            { name: 'floor', type: 'number', label_en: 'Floor', label_he: 'קומה' },
            { name: 'elevator', type: 'boolean', label_en: 'Elevator', label_he: 'מעלית' },
            { name: 'parking', type: 'boolean', label_en: 'Parking', label_he: 'חניה' },
            { name: 'garden', type: 'boolean', label_en: 'Garden', label_he: 'גינה' },
        ]
    },
    watches: {
        fields: [
            { name: 'brand', type: 'select', label_en: 'Brand', label_he: 'מותג', options: ['Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet', 'Seiko', 'Cartier', 'Tag Heuer', 'Breitling', 'Hublot', 'IWC', 'Panerai', 'Tudor', 'Casio', 'Citizen', 'Other'] },
            { name: 'model', type: 'text', label_en: 'Model', label_he: 'דגם' },
            { name: 'year', type: 'number', label_en: 'Year', label_he: 'שנה', min: 1900, max: new Date().getFullYear() },
            { name: 'case_size', type: 'text', label_en: 'Case Size', label_he: 'גודל שעון' },
            { name: 'movement', type: 'select', label_en: 'Movement', label_he: 'מנגנון', options: ['Automatic', 'Manual', 'Quartz', 'Other'] },
        ]
    },
    phones: {
        fields: [
            { name: 'brand', type: 'select', label_en: 'Brand', label_he: 'מותג', options: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Sony', 'Other'] },
            { name: 'model', type: 'text', label_en: 'Model', label_he: 'דגם' },
            { name: 'storage', type: 'select', label_en: 'Storage', label_he: 'נפח אחסון', options: ['64GB', '128GB', '256GB', '512GB', '1TB', 'Other'] },
            { name: 'color', type: 'text', label_en: 'Color', label_he: 'צבע' },
        ]
    },
    computers: {
        fields: [
            { name: 'brand', type: 'select', label_en: 'Brand', label_he: 'מותג', options: ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Microsoft', 'Other'] },
            { name: 'model', type: 'text', label_en: 'Model', label_he: 'דגם' },
            { name: 'processor', type: 'text', label_en: 'Processor', label_he: 'מעבד' },
            { name: 'ram', type: 'select', label_en: 'RAM', label_he: 'זיכרון RAM', options: ['8GB', '16GB', '32GB', '64GB', '128GB', 'Other'] },
            { name: 'storage', type: 'text', label_en: 'Storage', label_he: 'אחסון' },
        ]
    },
    electronics: {
        fields: [
            { name: 'brand', type: 'text', label_en: 'Brand', label_he: 'מותג' },
            { name: 'model', type: 'text', label_en: 'Model', label_he: 'דגם' },
            { name: 'year', type: 'number', label_en: 'Year', label_he: 'שנה' },
        ]
    },
    fashion: {
        fields: [
            { name: 'brand', type: 'text', label_en: 'Brand', label_he: 'מותג' },
            { name: 'size', type: 'text', label_en: 'Size', label_he: 'מידה' },
            { name: 'gender', type: 'select', label_en: 'Gender', label_he: 'מגדר', options: ['Men', 'Women', 'Unisex', 'Kids'] },
        ]
    }
};

// Helper to map category IDs or names to the attribute keys
export const getCategoryAttrKey = (categoryName) => {
    if (!categoryName) return null;
    const name = categoryName.toLowerCase();
    if (name.includes('car') || name.includes('motorcycle') || name.includes('boat') || name.includes('vehicle')) return 'vehicles';
    if (name.includes('estate') || name.includes('real') || name.includes('apartment') || name.includes('house')) return 'real_estate';
    if (name.includes('watch')) return 'watches';
    if (name.includes('phone') || name.includes('mobile')) return 'phones';
    if (name.includes('computer') || name.includes('laptop')) return 'computers';
    if (name.includes('electronic') || name.includes('tv') || name.includes('camera')) return 'electronics';
    if (name.includes('clothing') || name.includes('fashion') || name.includes('sneaker') || name.includes('shoe')) return 'fashion';
    return null;
};
