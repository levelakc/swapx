const { translate } = require('@vitalets/google-translate-api');

/**
 * Translates text to the target language.
 * @param {string} text - The text to translate.
 * @param {string} to - The target language code (e.g., 'en', 'he').
 * @returns {Promise<string>} - The translated text.
 */
const translateText = async (text, to) => {
  try {
    if (!text) return '';
    const res = await translate(text, { to });
    return res.text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on failure
  }
};

module.exports = { translateText };