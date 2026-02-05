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
  const conversation = await Conversation.findById(message.conversation_id);

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

  const responses = {
    en: {
      greeting: `Hello, I'm ${chatbot.name}. How can I help you today?`,
      howAreYou: `I'm a bot, so I'm always feeling great! How about you?`,
      whatIsYourName: `My name is ${chatbot.name}.`,
      default: `You said: "${message.content}". I'm still learning, so I might not understand.`,
    },
    he: {
      greeting: `שלום, אני ${chatbot.name}. איך אוכל לעזור לך היום?`,
      howAreYou: `אני בוט, אז אני תמיד מרגיש טוב! מה איתך?`,
      whatIsYourName: `שמי ${chatbot.name}.`,
      default: `אמרת: "${message.content}". אני עדיין לומדת, אז אולי לא הבנתי.`,
    },
    ar: {
      greeting: `مرحباً، أنا ${chatbot.name}. كيف يمكنني مساعدتك اليوم؟`,
      howAreYou: `أنا بوت، لذا أنا دائمًا بحالة رائعة! ماذا عنك؟`,
      whatIsYourName: `اسمي ${chatbot.name}.`,
      default: `لقد قلت: "${message.content}". ما زلت أتعلم، لذلك قد لا أفهم.`,
    },
    ru: {
      greeting: `Здравствуйте, я ${chatbot.name}. Чем я могу вам помочь сегодня?`,
      howAreYou: `Я бот, поэтому у меня всегда все отлично! А у вас?`,
      whatIsYourName: `Меня зовут ${chatbot.name}.`,
      default: `Вы сказали: "${message.content}". Я все еще учусь, поэтому могу не понять.`,
    },
  };

  const currentResponses = responses[senderUser.language] || responses.en;

  if (lowerCaseContent.includes('hello') || lowerCaseContent.includes('hi') || lowerCaseContent.includes('hey') || lowerCaseContent.includes('shalom') || lowerCaseContent.includes('שלום')) {
    responseContent = currentResponses.greeting;
  } else if (lowerCaseContent.includes('how are you') || lowerCaseContent.includes('מה שלומך')) {
    responseContent = currentResponses.howAreYou;
  } else if (lowerCaseContent.includes('name') || lowerCaseContent.includes('שם')) {
    responseContent = currentResponses.whatIsYourName;
  } else if (lowerCaseContent.includes('help') || lowerCaseContent.includes('support') || lowerCaseContent.includes('עזרה') || lowerCaseContent.includes('תמיכה')) {
      responseContent = senderUser.language === 'he' 
          ? "אני כאן כדי לעזור! ניתן לשאול אותי על 'איך סוחרים', 'בטיחות', או 'החשבון שלי'."
          : "I'm here to help! You can ask me about 'how to trade', 'safety', or 'my account'.";
  } else if (lowerCaseContent.includes('trade') || lowerCaseContent.includes('swap') || lowerCaseContent.includes('סחר') || lowerCaseContent.includes('החלפה')) {
      responseContent = senderUser.language === 'he'
          ? "כדי לבצע החלפה, הכנס לדף של פריט שאהבת ולחץ על 'הצע הצעה'. תוכל להציע פריטים משלך או להוסיף מזומן."
          : "To make a trade, go to an item's page and click 'Make Offer'. You can offer your own items or add cash.";
  } else if (lowerCaseContent.includes('scam') || lowerCaseContent.includes('safe') || lowerCaseContent.includes('בטוח') || lowerCaseContent.includes('הונאה')) {
      responseContent = senderUser.language === 'he'
          ? "הבטיחות שלך חשובה לנו. לעולם אל תעביר כסף מחוץ לפלטפורמה ואל תמסור פרטים אישיים רגישים. אם נתקלת במשהו חשוד, דווח למנהל."
          : "Your safety is important. Never transfer money outside the platform and don't share sensitive personal details. Report suspicious activity to an admin.";
  } else {
    responseContent = currentResponses.default;
  }
  
  await sendMessage(conversation._id, responseContent, chatbot.email, io);
};

const sendMessage = async (conversationId, content, senderEmail, io) => {
  const message = new Message({
    conversation_id: conversationId,
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
