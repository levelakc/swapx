import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50 shadow-inner w-24">
      <div className="relative flex items-center w-full h-7">
        {/* Animated Background Highlighting Active */}
        <motion.div
          className="absolute top-0 bottom-0 bg-background rounded-full shadow-sm"
          initial={false}
          animate={{
            left: language === 'en' ? '0%' : '50%',
          }}
          style={{ width: '50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        
        <button
          onClick={() => setLanguage('en')}
          className={`relative z-10 flex-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            language === 'en' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          EN
        </button>
        
        <button
          onClick={() => setLanguage('he')}
          className={`relative z-10 flex-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            language === 'he' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          HE
        </button>
      </div>
    </div>
  );
}
