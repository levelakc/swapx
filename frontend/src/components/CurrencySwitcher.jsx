import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { motion } from 'framer-motion';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50 shadow-inner w-24">
      <div className="relative flex items-center w-full h-7">
        {/* Animated Background Highlighting Active */}
        <motion.div
          className="absolute top-0 bottom-0 bg-background rounded-full shadow-sm"
          initial={false}
          animate={{
            left: currency === 'USD' ? '0%' : '50%',
          }}
          style={{ width: '50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        
        <button
          onClick={() => setCurrency('USD')}
          className={`relative z-10 flex-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            currency === 'USD' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          USD
        </button>
        
        <button
          onClick={() => setCurrency('ILS')}
          className={`relative z-10 flex-1 text-[10px] font-black transition-colors duration-200 uppercase tracking-widest ${
            currency === 'ILS' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ILS
        </button>
      </div>
    </div>
  );
}
