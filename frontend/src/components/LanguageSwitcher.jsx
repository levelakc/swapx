import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50 shadow-inner">
      <div className="relative flex items-center">
        {/* Animated Background Highlighting Active */}
        <motion.div
          className="absolute h-full bg-background rounded-full shadow-sm"
          initial={false}
          animate={{
            x: language === 'en' ? 0 : '100%',
            width: '50%'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        <button
          onClick={() => setLanguage('en')}
          className={`relative z-10 px-3 py-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            language === 'en' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          EN
        </button>
        
        <button
          onClick={() => setLanguage('he')}
          className={`relative z-10 px-3 py-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            language === 'he' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          HE
        </button>
      </div>
    </div>
  );
}
