const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getChatbotForLanguage } = require('../services/chatbotService');
const dotenv = require('dotenv');

dotenv.config();

const initChatbot = async (user) => {
    const chatbot = getChatbotForLanguage(user.language || 'en');
    const welcomeMessage = {
      en: `Hello ${user.full_name}, welcome to SwapX! I'm ${chatbot.name}, your personal assistant.`,
      he: `שלום ${user.full_name}, ברוך הבא ל-SwapX! אני ${chatbot.name}, העוזרת האישית שלך.`,
    };
    const content = welcomeMessage[user.language] || welcomeMessage.en;

    const conversation = await Conversation.create({
      participants: [user.email, chatbot.email],
      last_message: content,
      last_message_at: Date.now(),
    });

    await Message.create({
      conversation_id: conversation._id,
      sender_email: chatbot.email,
      content: content,
    });
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_SECRET',
      callbackURL: `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        }

        user = await User.create({
          full_name: profile.displayName,
          email: profile.emails[0].value,
          password: Date.now() + 'google',
          avatar: profile.photos[0].value,
          verification_status: 'verified',
        });

        await initChatbot(user);

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || 'PLACEHOLDER_ID',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'PLACEHOLDER_SECRET',
      callbackURL: `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'photos', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails ? profile.emails[0].value : `facebook_${profile.id}@swapx.com`;
        let user = await User.findOne({ email });

        if (user) {
          return done(null, user);
        }

        user = await User.create({
          full_name: profile.displayName,
          email: email,
          password: Date.now() + 'facebook',
          avatar: profile.photos ? profile.photos[0].value : `https://avatar.vercel.sh/${profile.displayName}.svg`,
          verification_status: 'verified',
        });

        await initChatbot(user);

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

module.exports = passport;
