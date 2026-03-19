import React from 'react';
import { motion } from 'framer-motion';
import logoIcon from '../../imgs/1.jpg';
import { useLanguage } from '../../contexts/LanguageContext';
import ImageWithFallback from './ImageWithFallback';

const InitialLoader = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[1000] bg-background flex items-center justify-center flex-col gap-8"
    >
      <div className="relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-48 shrink-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-secondary blur-3xl rounded-full opacity-20" 
        />
        
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="relative z-10 flex items-center justify-center w-32 h-32 sm:w-44 sm:h-44 bg-background rounded-full border-4 border-primary shadow-2xl overflow-hidden"
        >
          <ImageWithFallback src={logoIcon} alt="Logo" className="w-full h-full object-cover" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-2"
      >
        <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 uppercase">
          {t('brand')}
        </h1>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InitialLoader;
