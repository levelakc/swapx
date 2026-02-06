const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Item = require('../models/Item');
const Trade = require('../models/Trade');
const { getIO } = require('../socket');

const CHATBOTS = {
  en: { name: 'Sona', email: 'sona_en@swapx.com', greeting: "Hello! I'm Sona, your SwapX assistant. I'm here to help you trade safely and efficiently." },
  he: { name: 'Rona', email: 'rona_he@swapx.com', greeting: "שלום! אני רונה, העוזרת האישית שלך ב-SwapX. אני כאן כדי לעזור לך לסחור בצורה בטוחה ויעילה." },
  ar: { name: 'Sona', email: 'sona_ar@swapx.com', greeting: "مرحباً! أنا سونا، مساعدتك في SwapX. أنا هنا لمساعدتك في التداول بأمان وكفاءة." },
  ru: { name: 'Sona', email: 'sona_ru@swapx.com', greeting: "Привет! Я Сона, ваш помощник в SwapX. Я здесь, чтобы помочь вам торговать безопасно и эффективно." },
};

const CHATBOT_USERS = Object.values(CHATBOTS).map(bot => bot.email);

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

  const text = message.content.toLowerCase();
  const lang = senderUser.language || 'en';
  const isHebrew = lang === 'he';

  // --- Interactive Problem Solving Logic ---

  if (text.includes('coin') || text.includes('money') || text.includes('balance') || text.includes('מטבע') || text.includes('כסף') || text.includes('יתרה')) {
      const balance = senderUser.coins || 0;
      responseContent = isHebrew
          ? `היתרה הנוכחית שלך היא ${balance} מטבעות SwapX. ניתן להשתמש בהם כדי להקפיץ פריטים או כתוספת להצעות טרייד!`
          : `Your current balance is ${balance} SwapX coins. You can use them to feature your items or add them to trade offers!`;
  } 
  else if (text.includes('list') || text.includes('add') || text.includes('post') || text.includes('הוסף') || text.includes('פרסם') || text.includes('להעלות')) {
      responseContent = isHebrew
          ? "כדי להוסיף פריט חדש, לחץ על כפתור הפלוס (+) בתחתית המסך או על 'הוסף פריט' בתפריט הצד. אל תשכח להוסיף תמונות ברורות ותיאור מפורט!"
          : "To list a new item, click the (+) button at the bottom or 'List Item' in the side menu. Don't forget to add clear photos and a detailed description!";
  }
  else if (text.includes('trade') || text.includes('offer') || text.includes('status') || text.includes('טרייד') || text.includes('הצעה') || text.includes('סטטוס')) {
      const activeTrades = await Trade.countDocuments({ 
          $or: [{ sender_email: senderUser.email }, { receiver_email: senderUser.email }],
          status: 'pending' 
      });
      responseContent = isHebrew
          ? `יש לך ${activeTrades} טריידים ממתינים כרגע. ניתן לראות אותם במסך 'הטריידים שלי'. זכור: טרייד מוצלח מתחיל בשיחה טובה!`
          : `You currently have ${activeTrades} pending trades. You can view them in 'My Trades'. Remember: a good trade starts with a friendly conversation!`;
  }
  else if (text.includes('safe') || text.includes('scam') || text.includes('trust') || text.includes('בטוח') || text.includes('אמין') || text.includes('נוכל')) {
      responseContent = isHebrew
          ? "הבטיחות שלך חשובה לנו. לעולם אל תשלח כסף מחוץ לאפליקציה. בצע את ההחלפות במקומות ציבוריים וודא שהפריט תואם לתיאור לפני האישור."
          : "Your safety is our priority. Never send money outside the app. Meet in public places for swaps and verify the item matches the description before finalizing.";
  }
  else if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('שלום') || text.includes('אהלן')) {
      responseContent = isHebrew
          ? `שלום ${senderUser.full_name}! אני ${chatbot.name}. אני יכולה לעזור לך לבדוק יתרה, להבין איך להעלות פריטים או לספר לך על הטריידים שלך. מה תרצה לדעת?`
          : `Hello ${senderUser.full_name}! I'm ${chatbot.name}. I can help you check your balance, explain how to list items, or tell you about your trades. What would you like to know?`;
  }
  else if (text.includes('admin') || text.includes('support') || text.includes('human') || text.includes('תמיכה') || text.includes('נציג')) {
      responseContent = isHebrew
          ? "הבנתי, אתה זקוק לעזרה מנציג. העברתי את הבקשה למנהל המערכת והוא יחזור אליך בהקדם. בינתיים, ניתן לשלוח מייל ל-support@swapx.com."
          : "I understand you need human assistance. I've notified an admin, and they will get back to you shortly. In the meantime, you can reach us at support@swapx.com.";
  }
  else {
      responseContent = isHebrew
          ? `אני עדיין לומדת, אבל אני מכירה את SwapX מצוין! שאל אותי על 'יתרה', 'איך להוסיף פריט', 'הטריידים שלי' או 'בטיחות'.`
          : `I'm still learning, but I know SwapX very well! Ask me about 'balance', 'how to add items', 'my trades', or 'safety'.`;
  }
  
  // Simulate typing delay
  setTimeout(async () => {
      await sendMessage(conversation._id, responseContent, chatbot.email, io);
  }, 1200);
};

const sendMessage = async (conversationId, content, senderEmail, io) => {
  const message = new Message({
    conversation_id: conversationId.toString(),
    sender_email: senderEmail,
    content,
    type: 'text',
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