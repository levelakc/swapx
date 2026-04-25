const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const trackActivity = async (req, res, next) => {
  try {
    let user;
    if (req.user) {
      user = req.user;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
    }

    if (user) {
      // Log meaningful actions (non-GET or admin actions)
      if (req.method !== 'GET' || req.originalUrl.includes('/api/admin')) {
        await ActivityLog.create({
          user: user._id,
          action: `${req.method} ${req.originalUrl}`,
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
    }
  } catch (error) {
    // Silently fail logging to not disrupt the app
    console.error('Activity logging failed:', error.message);
  }
  next();
};

module.exports = { trackActivity };
