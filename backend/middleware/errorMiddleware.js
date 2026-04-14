const translateError = require('../utils/errorTranslator');

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  const lang = req.headers['accept-language'] || 'en';

  res.status(statusCode);

  res.json({
    message: translateError(err.message, lang),
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  errorHandler,
};