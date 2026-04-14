const errorTranslations = {
  en: {
    'Invalid email or password': 'Invalid email or password',
    'User already exists': 'User already exists',
    'Invalid user data': 'Invalid user data',
    'Invalid credentials': 'Invalid credentials',
    'User not found': 'User not found',
    'Not authorized': 'Not authorized',
    'Token failed': 'Token failed',
    'Email can only be changed once every 24 hours': 'Email can only be changed once every 24 hours',
    'Password can only be changed once every 24 hours': 'Password can only be changed once every 24 hours',
    'Email already in use': 'Email already in use',
    'Item not found': 'Item not found',
    'Service not found': 'Service not found',
    'Trade not found': 'Trade not found',
    'Not enough coins': 'Not enough coins',
    'Receiver not found': 'Receiver not found',
    'Cannot initiate a trade with yourself': 'Cannot initiate a trade with yourself',
    'One or more items not found': 'One or more items not found',
    'One or more items are already traded': 'One or more items are already traded',
    'You can only offer your own items': 'You can only offer your own items',
    'One or more requested items do not belong to the receiver': 'One or more requested items do not belong to the receiver',
  },
  he: {
    'Invalid email or password': 'אימייל או סיסמה שגויים',
    'User already exists': 'המשתמש כבר קיים במערכת',
    'Invalid user data': 'נתוני משתמש לא תקינים',
    'Invalid credentials': 'פרטי התחברות שגויים',
    'User not found': 'משתמש לא נמצא',
    'Not authorized': 'אין הרשאה מתאימה',
    'Token failed': 'פג תוקף ההתחברות',
    'Email can only be changed once every 24 hours': 'ניתן לשנות אימייל רק פעם ב-24 שעות',
    'Password can only be changed once every 24 hours': 'ניתן לשנות סיסמה רק פעם ב-24 שעות',
    'Email already in use': 'כתובת האימייל כבר בשימוש',
    'Item not found': 'הפריט לא נמצא',
    'Service not found': 'השירות לא נמצא',
    'Trade not found': 'ההצעה לא נמצאה',
    'Not enough coins': 'אין מספיק מטבעות',
    'Receiver not found': 'מקבל ההצעה לא נמצא',
    'Cannot initiate a trade with yourself': 'לא ניתן לבצע טרייד עם עצמך',
    'One or more items not found': 'אחד או יותר מהפריטים לא נמצאו',
    'One or more items are already traded': 'אחד או יותר מהפריטים כבר הוחלפו',
    'You can only offer your own items': 'ניתן להציע רק פריטים שבבעלותך',
    'One or more requested items do not belong to the receiver': 'אחד או יותר מהפריטים המבוקשים אינם שייכים לצד השני',
    'Invalid trade status provided': 'סטטוס הצעה לא תקין',
    'Only the receiver can accept an offer': 'רק מקבל ההצעה יכול לאשר אותה',
    'Only the receiver can reject an offer': 'רק מקבל ההצעה יכול לדחות אותה',
    'Trade must be accepted before it can be completed': 'ההצעה חייבת להיות מאושרת לפני שניתן להשלים אותה',
    'Counter offers require a message detailing the new terms': 'הצעה נגדית דורשת הודעה עם הפרטים החדשים',
    'Message content is required': 'תוכן ההודעה חסר',
    'Could not send email': 'שגיאה בשליחת אימייל',
  }
};

const translateError = (message, lang = 'en') => {
  if (!message) return message;
  const language = lang.startsWith('he') ? 'he' : 'en';
  const lowerMessage = message.toLowerCase();
  
  // Try exact match (case insensitive check against keys)
  for (const key in errorTranslations[language]) {
    if (key.toLowerCase() === lowerMessage) {
      return errorTranslations[language][key];
    }
  }

  // Try partial match for dynamic messages
  for (const key in errorTranslations[language]) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return errorTranslations[language][key];
    }
  }

  return message;
};

module.exports = translateError;
