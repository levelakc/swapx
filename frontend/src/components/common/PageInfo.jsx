import React, { useState } from 'react';
import { Info, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PageInfo({ infoKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const info = t(infoKey);

  if (!info) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-muted transition-colors text-primary flex flex-col items-center gap-0.5"
        title={t('pageInfo')}
      >
        <div className="relative">
            <HelpCircle size={22} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-primary"></span>
            </span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-tighter">{t('howToUse')}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-primary/30 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                    <Info size={32} />
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                  >
                    <X size={24} />
                  </button>
                </div>

                <h2 className="text-3xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white">
                  {info.title}
                </h2>

                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                  {info.description}
                </p>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 bg-primary text-primary-content font-black rounded-2xl hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-primary/20"
                >
                  {t('back')}
                </button>
              </div>
              <div className="h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
