const asyncHandler = require('express-async-handler');
const axios = require('axios');

// @desc    Get latest exchange rates
// @route   GET /api/exchange-rate/latest/:currency
// @access  Public
const getLatestExchangeRates = asyncHandler(async (req, res) => {
  const { currency } = req.params;
  const API_KEY = process.env.EXCHANGE_RATE_API_KEY;

  if (!API_KEY) {
    res.status(500);
    throw new Error('Exchange Rate API Key not configured in environment variables');
  }

  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${currency}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching exchange rates: ${error.message}`);
    res.status(error.response ? error.response.status : 500);
    throw new Error(error.response ? error.response.data.error : 'Failed to fetch exchange rates');
  }
});

module.exports = { getLatestExchangeRates };