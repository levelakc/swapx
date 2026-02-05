import React, { createContext, useState, useContext, useEffect } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('ILS'); // Default currency
  const [usdToIlsRate, setUsdToIlsRate] = useState(0); // State to store USD to ILS exchange rate

  useEffect(() => {
    const fetchExchangeRate = async () => {
      // Use the backend proxy for exchange rates
      const API_URL = `/api/exchange-rate/latest/USD`; 

      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.result === 'success' && data.conversion_rates && data.conversion_rates.ILS) {
          setUsdToIlsRate(data.conversion_rates.ILS);
        } else {
          console.error('Error fetching exchange rate:', data);
          // Fallback to a default mock rate if API call fails or data is malformed
          setUsdToIlsRate(3.7); // Fallback mock rate
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to a default mock rate on network error
        setUsdToIlsRate(3.7); // Fallback mock rate
      }
    };

    fetchExchangeRate();
  }, []);

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (usdToIlsRate === 0) { // If rate not yet fetched, cannot convert
      return amount; // Or handle as an error/loading state
    }

    if (fromCurrency === toCurrency) {
      return amount;
    }

    if (fromCurrency === 'USD' && toCurrency === 'ILS') {
      return Math.round(amount * usdToIlsRate);
    }
    if (fromCurrency === 'ILS' && toCurrency === 'USD') {
      return Math.round(amount / usdToIlsRate);
    }
    // Add more conversion logic as needed
    return amount; // Return original amount if conversion not defined
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertCurrency, usdToIlsRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
