import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  const toggleCurrency = () => {
    setCurrency(currency === 'USD' ? 'ILS' : 'USD');
  };

  return (
    <button 
        onClick={toggleCurrency}
        className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all group"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
            <motion.div
                key={currency}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="font-black text-sm text-primary flex items-center justify-center"
            >
                {currency === 'USD' ? '$' : '₪'}
            </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
        {currency}
      </span>
    </button>
  );
}
