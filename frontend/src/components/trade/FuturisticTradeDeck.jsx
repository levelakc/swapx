
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const FuturisticTradeDeck = ({ isOpen, onClose, children }) => {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed top-0 right-0 h-full w-full max-w-2xl bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg shadow-2xl z-50 flex flex-col"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">{t('makeOffer')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X />
            </button>
          </div>
          <div className="flex-grow p-6 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FuturisticTradeDeck;
