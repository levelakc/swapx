const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Item = require('../models/Item');
const Trade = require('../models/Trade');
const { getIO } = require('../socket');

const CHATBOTS = {
  en: { name: 'Sona', email: 'sona_en@ahlafot.co.il', greeting: "Hello! I'm Sona, your Ahlafot assistant. I'm here to help you trade safely and efficiently." },
  he: { name: 'Rona', email: 'rona_he@ahlafot.co.il', greeting: "שלום! אני רונה, העוזרת האישית שלך ב-Ahlafot. אני כאן כדי לעזור לך לסחור בצורה בטובה ויעילה." },
  ar: { name: 'Sona', email: 'sona_ar@ahlafot.co.il', greeting: "מرحباً! أنا سونا، مساعدتك في Ahlafot. أنا هنا למסאעדתך פי אלתדאול באמאן וכפאעה." },
  ru: { name: 'Sona', email: 'sona_ru@ahlafot.co.il', greeting: "Привет! Я Сона, ваш помощник в Ahlafot. Я здесь, чтобы помочь вам торговать безопасно и эффективно." },
};

const CHATBOT_USERS = Object.values(CHATBOTS).map(bot => bot.email);

// Simple session storage in-memory for "not understood" count
const conversationSessions = new Map(); // conversationId -> { count: number }

const getChatbotForLanguage = (language) => {
  return CHATBOTS[language] || CHATBOTS.en;
};

const handleIncomingMessage = async (message) => {
  const io = getIO();
  const conversation = await Conversation.findById(message.conversation_id);

  if (!conversation) return;

  const recipientEmail = conversation.participants.find(email => CHATBOT_USERS.includes(email));
  if (!recipientEmail) return;

  const senderUser = await User.findOne({ email: message.sender_email });
  if (!senderUser) return;

  const chatbot = getChatbotForLanguage(senderUser.language);
  let responseContent = '';
  let responseType = 'text';
  let responseButtons = [];

  const text = message.content.toLowerCase();
  const lang = senderUser.language || 'en';
  const isHebrew = lang === 'he';

  let understood = true;

  // --- Decision Logic ---

  if (text.includes('coin') || text.includes('money') || text.includes('balance') || text.includes('מטבע') || text.includes('כסף') || text.includes('יתרה')) {
      const balance = senderUser.coins || 0;
      responseContent = isHebrew
          ? `היתרה הנוכחית שלך היא ${balance} מטבעות Ahlafot. ניתן להשתמש בהם כדי להקפיץ פריטים או כתוספת להצעות טרייד!`
          : `Your current balance is ${balance} Ahlafot coins. You can use them to feature your items or add them to trade offers!`;
      
      responseType = 'buttons';
      responseButtons = isHebrew 
        ? [{ text: 'איך משיגים עוד?', payload: 'how to get more coins' }, { text: 'הפריטים שלי', payload: 'my items' }, { text: 'חזרה', payload: 'hello' }]
        : [{ text: 'How to get more?', payload: 'how to get more coins' }, { text: 'My Items', payload: 'my items' }, { text: 'Back', payload: 'hello' }];
  } 
  else if (text.includes('list') || text.includes('add') || text.includes('post') || text.includes('הוסף') || text.includes('פרסם') || text.includes('להעלות')) {
      responseContent = isHebrew
          ? "כדי להוסיף פריט חדש, לחץ על כפתור הפלוס (+) בתחתית המסך או על 'הוסף פריט' בתפריט הצד. אל תשכח להוסיף תמונות ברורות ותיאור מפורט!"
          : "To list a new item, click the (+) button at the bottom or 'List Item' in the side menu. Don't forget to add clear photos and a detailed description!";
      
      responseType = 'buttons';
      responseButtons = isHebrew
        ? [{ text: 'טיפים למכירה', payload: 'selling tips' }, { text: 'דוגמאות', payload: 'examples' }, { text: 'חזרה', payload: 'hello' }]
        : [{ text: 'Selling Tips', payload: 'selling tips' }, { text: 'Examples', payload: 'examples' }, { text: 'Back', payload: 'hello' }];
  }
  else if (text.includes('trade') || text.includes('offer') || text.includes('status') || text.includes('טרייד') || text.includes('הצעה') || text.includes('סטטוס')) {
      const activeTrades = await Trade.countDocuments({ 
          $or: [{ sender_email: senderUser.email }, { receiver_email: senderUser.email }],
          status: 'pending' 
      });
      responseContent = isHebrew
          ? `יש לך ${activeTrades} טריידים ממתינים כרגע. ניתן לראות אותם במסך 'הטריידים שלי'. זכור: טרייד מוצלח מתחיל בשיחה טובה!`
          : `You currently have ${activeTrades} pending trades. You can view them in 'My Trades'. Remember: a good trade starts with a friendly conversation!`;
      
      responseType = 'buttons';
      responseButtons = isHebrew
        ? [{ text: 'הטריידים שלי', payload: 'view trades' }, { text: 'איך מציעים?', payload: 'how to offer' }, { text: 'חזרה', payload: 'hello' }]
        : [{ text: 'My Trades', payload: 'view trades' }, { text: 'How to offer?', payload: 'how to offer' }, { text: 'Back', payload: 'hello' }];
  }
  else if (text.includes('safe') || text.includes('scam') || text.includes('trust') || text.includes('בטוח') || text.includes('אמין') || text.includes('נוכל')) {
      responseContent = isHebrew
          ? "הבטיחות שלך חשובה לנו. לעולם אל תשלח כסף מחוץ לאפליקציה. בצע את ההחלפות במקומות ציבוריים וודא שהפריט תואם לתיאור לפני האישור."
          : "Your safety is our priority. Never send money outside the app. Meet in public places for swaps and verify the item matches the description before finalizing.";
      
      responseType = 'buttons';
      responseButtons = isHebrew
        ? [{ text: 'עוד טיפים', payload: 'safety tips' }, { text: 'דיווח על משתמש', payload: 'support' }]
        : [{ text: 'More Tips', payload: 'safety tips' }, { text: 'Report User', payload: 'support' }];
  }
  else if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('שלום') || text.includes('אהלן') || text.includes('עזרה')) {
      responseContent = isHebrew
          ? `שלום ${senderUser.full_name}! אני ${chatbot.name}, העוזרת החכמה שלך. מה תרצה לעשות היום?`
          : `Hello ${senderUser.full_name}! I'm ${chatbot.name}, your smart assistant. What would you like to do today?`;
      
      responseType = 'buttons';
      responseButtons = isHebrew
        ? [
            { text: 'בדיקת יתרה 💰', payload: 'balance' }, 
            { text: 'איך מעלים פריט? 📤', payload: 'add item' }, 
            { text: 'הטריידים שלי 🤝', payload: 'view trades' },
            { text: 'תמיכה אנושית 👤', payload: 'support' }
          ]
        : [
            { text: 'Check Balance 💰', payload: 'balance' }, 
            { text: 'How to list? 📤', payload: 'add item' }, 
            { text: 'My Trades 🤝', payload: 'view trades' },
            { text: 'Talk to Human 👤', payload: 'support' }
          ];
  }
  else if (text.includes('admin') || text.includes('support') || text.includes('human') || text.includes('תמיכה') || text.includes('נציג') || text.includes('בן אדם')) {
      responseContent = isHebrew
          ? "הבנתי, אתה זקוק לעזרה מנציג. העברתי את הבקשה למנהל המערכת או לאחד המודרטורים והם יחזרו אליך בהקדם בצ'אט הזה."
          : "I understand you need human assistance. I've notified an admin or a moderator, and they will get back to you shortly right here in this chat.";
      
      // Mark conversation as needing support
      conversation.is_support_needed = true;
      await conversation.save();
  }
  else {
      understood = false;
      const session = conversationSessions.get(message.conversation_id.toString()) || { count: 0 };
      session.count++;
      conversationSessions.set(message.conversation_id.toString(), session);

      if (session.count >= 2) {
          responseContent = isHebrew
            ? "אני מצטערת, אני עדיין לא מבינה את הבקשה הזו. האם תרצה לדבר עם נציג תמיכה אנושי?"
            : "I'm sorry, I'm not understanding this request yet. Would you like to talk to a human support representative?";
          
          responseType = 'buttons';
          responseButtons = isHebrew
            ? [{ text: 'כן, נציג בבקשה', payload: 'support' }, { text: 'לא, נסה שוב', payload: 'hello' }]
            : [{ text: 'Yes, support please', payload: 'support' }, { text: 'No, try again', payload: 'hello' }];
      } else {
          responseContent = isHebrew
            ? "לא בטוחה שהבנתי... שאל אותי על 'יתרה', 'איך להוסיף פריט' או פשוט בחר מהכפתורים למטה:"
            : "Not sure I understood... Ask me about 'balance', 'how to add items' or just pick from the buttons below:";
          
          responseType = 'buttons';
          responseButtons = isHebrew
            ? [{ text: 'יתרה', payload: 'balance' }, { text: 'עזרה', payload: 'hello' }]
            : [{ text: 'Balance', payload: 'balance' }, { text: 'Help', payload: 'hello' }];
      }
  }

  if (understood) {
      conversationSessions.delete(message.conversation_id.toString());
  }
  
  // Simulate typing delay
  setTimeout(async () => {
      await sendMessage(conversation._id, responseContent, chatbot.email, io, responseType, responseButtons);
  }, 1200);
};

const sendMessage = async (conversationId, content, senderEmail, io, type = 'text', buttons = []) => {
  const message = new Message({
    conversation_id: conversationId.toString(),
    sender_email: senderEmail,
    content,
    type,
    buttons,
  });

  const createdMessage = await message.save();

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return;

  conversation.last_message = content;
  conversation.last_message_at = Date.now();

  conversation.participants.forEach(participant => {
    if (participant !== senderEmail) {
      conversation.unread_count.set(participant, (conversation.unread_count.get(participant) || 0) + 1);
    }
  });

  await conversation.save();
  io.to(conversationId.toString()).emit('newMessage', createdMessage);
};

const seedChatbotUsers = async () => {
  for (const lang in CHATBOTS) {
    const bot = CHATBOTS[lang];
    const userExists = await User.findOne({ email: bot.email });
    if (!userExists) {
      await User.create({
        full_name: bot.name,
        email: bot.email,
        password: 'chatbot_password_secure_123',
        role: 'user',
        language: lang,
        coins: 1000,
      });
      console.log(`Chatbot user ${bot.name} created.`);
    }
  }
};

module.exports = {
  handleIncomingMessage,
  seedChatbotUsers,
  getChatbotForLanguage,
};