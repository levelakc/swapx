import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function FloatingChatSupport() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const handleOpenSupport = () => {
    // Navigate to messages with support focus if available, 
    // or just to the messages page
    navigate('/messages');
  };

  return (
    <div className={`fixed bottom-6 ${dir === 'rtl' ? 'left-6' : 'right-6'} z-[999]`}>
      <motion.button
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenSupport}
        className="relative group w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-2xl flex items-center justify-center border border-white/20"
      >
        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
        
        <div className="relative z-10">
          <MessageCircle size={28} />
          <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5] 
            }}
            transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className="absolute -top-2 -right-2 text-yellow-300"
          >
            <Sparkles size={16} />
          </motion.div>
        </div>

        {/* Tooltip */}
        <div className={`absolute bottom-full mb-4 ${dir === 'rtl' ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
          <div className="bg-card border border-white/10 px-4 py-2 rounded-xl shadow-xl whitespace-nowrap">
            <span className="text-sm font-black uppercase tracking-tight text-foreground">
                {t('supportChat', 'Support Chat')}
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
