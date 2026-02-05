import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <select onChange={handleLanguageChange} value={language}>
        <option value="en">English</option>
        <option value="he">עברית</option>
      </select>
    </div>
  );
}

export default LanguageSwitcher;
