const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { getIO } = require('../socket');

const CHATBOTS = {
  en: { name: 'Sona', email: 'sona_en@swapx.com' },
  he: { name: 'Rona', email: 'rona_he@swapx.com' },
  ar: { name: 'Sona', email: 'sona_ar@swapx.com' },
  ru: { name: 'Sona', email: 'sona_ru@swapx.com' },
};

const CHATBOT_USERS = Object.values(CHATBOTS).map(bot => bot.email);

const getChatbotForLanguage = (language) => {
  return CHATBOTS[language] || CHATBOTS.en;
};

const handleIncomingMessage = async (message) => {
  const io = getIO();
  // Ensure we query with string ID if needed, but findById takes ID/String.
  const conversation = await Conversation.findById(message.conversation_id);

  if (!conversation) return;

  const recipientEmail = conversation.participants.find(email => CHATBOT_USERS.includes(email));

  if (!recipientEmail) {
    return;
  }

  const senderUser = await User.findOne({ email: message.sender_email });

  if (!senderUser) {
    console.error('Sender user not found for chatbot interaction:', message.sender_email);
    return;
  }

  const chatbot = getChatbotForLanguage(senderUser.language);
  let responseContent = '';

  const lowerCaseContent = message.content.toLowerCase();
  const lang = senderUser.language || 'en';

  // --- Logic ---
  const isHebrew = lang === 'he';

  if (lowerCaseContent.includes('admin') || lowerCaseContent.includes('support') || lowerCaseContent.includes('human') || lowerCaseContent.includes('מנהל') || lowerCaseContent.includes('תמיכה') || lowerCaseContent.includes('נציג') || lowerCaseContent.includes('contact')) {
      responseContent = isHebrew
          ? "רשמתי לפניי שאתה זקוק לעזרה אנושית. מנהל עודכן ויבדוק את השיחה בקרוב. ניתן גם לשלוח מייל ל-support@swapx.com."
          : "I have noted that you need human assistance. An admin has been notified and will review your conversation shortly. You can also email us at support@swapx.com.";
  } else if (lowerCaseContent.includes('how') || lowerCaseContent.includes('work') || lowerCaseContent.includes('start') || lowerCaseContent.includes('איך') || lowerCaseContent.includes('עובד') || lowerCaseContent.includes('להתחיל')) {
      responseContent = isHebrew
          ? "SwapX זה פשוט! 1. פרסם פריט משלך (לחץ על 'הוסף פריט'). 2. דפדף ומצא פריטים מעניינים. 3. הצע החלפה (עם או בלי תוספת מזומן). כשהצד השני מסכים - מחליפים!"
          : "SwapX is easy! 1. List your own item (click 'List Item'). 2. Browse for items you like. 3. Click 'Make Offer' to propose a trade (you can add cash too!). Once accepted, you swap!";
  } else if (lowerCaseContent.includes('hello') || lowerCaseContent.includes('hi') || lowerCaseContent.includes('hey') || lowerCaseContent.includes('shalom') || lowerCaseContent.includes('שלום')) {
      responseContent = isHebrew
          ? `שלום, אני ${chatbot.name}. איך אוכל לעזור לך היום? נסה לשאול 'איך זה עובד' או בקש 'תמיכה'.`
          : `Hello, I'm ${chatbot.name}. How can I help you? Try asking 'how it works' or say 'admin' for support.`;
  } else if (lowerCaseContent.includes('safe') || lowerCaseContent.includes('scam') || lowerCaseContent.includes('money') || lowerCaseContent.includes('בטוח') || lowerCaseContent.includes('כסף')) {
      responseContent = isHebrew
          ? "בטיחות היא מעל הכל. לעולם אל תעביר כסף מחוץ לאתר. כל השיחות והעסקאות מתועדות כאן להגנתך."
          : "Safety is key. Never transfer money outside the platform. All chats and trades are recorded here for your protection.";
  } else {
      // Default Fallback
      responseContent = isHebrew
          ? `אני עדיין לומדת. נסה לשאול על 'איך זה עובד', 'בטיחות', או בקש 'מנהל' אם אתה צריך עזרה.`
          : `I'm still learning. Try asking about 'how it works', 'safety', or ask for an 'admin' if you need help.`;
  }
  
  // Simulate typing delay naturally
  setTimeout(async () => {
      await sendMessage(conversation._id, responseContent, chatbot.email, io);
  }, 1000);
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
        password: 'chatbot_password', // This will be hashed
        role: 'user',
        language: lang,
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
