import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { motion } from 'framer-motion';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50 shadow-inner">
      <div className="relative flex items-center">
        {/* Animated Background Highlighting Active */}
        <motion.div
          className="absolute h-full bg-background rounded-full shadow-sm"
          initial={false}
          animate={{
            x: currency === 'USD' ? 0 : '100%',
            width: '50%'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        <button
          onClick={() => setCurrency('USD')}
          className={`relative z-10 px-3 py-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            currency === 'USD' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          USD
        </button>
        
        <button
          onClick={() => setCurrency('ILS')}
          className={`relative z-10 px-3 py-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            currency === 'ILS' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ILS
        </button>
      </div>
    </div>
  );
}
