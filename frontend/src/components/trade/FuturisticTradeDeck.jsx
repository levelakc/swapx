
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEffect } from 'react';

const FuturisticTradeDeck = ({ isOpen, onClose, children }) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[700]"
          />
          
          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-xl bg-background shadow-2xl z-[701] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-foreground">{t('makeOffer')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FuturisticTradeDeck;
