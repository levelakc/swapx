import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  return (
    <div className="currency-switcher">
      <select onChange={handleCurrencyChange} value={currency} className="bg-transparent text-lg appearance-none cursor-pointer focus:outline-none">
        <option value="ILS">₪ ILS</option>
        <option value="USD">$ USD</option>
      </select>
    </div>
  );
}

export default CurrencySwitcher;
