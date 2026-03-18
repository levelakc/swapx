import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  return (
    <button 
        onClick={toggleLanguage}
        className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all group"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
            <motion.span
                key={language}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-lg leading-none"
            >
                {language === 'en' ? '🇺🇸' : '🇮🇱'}
            </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
        {language === 'en' ? 'EN' : 'HE'}
      </span>
    </button>
  );
}
