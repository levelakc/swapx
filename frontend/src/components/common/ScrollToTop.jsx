import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={scrollToTop}
          className="fixed bottom-6 inset-x-0 mx-auto z-[60] text-primary hover:text-primary/70 transition-colors focus:outline-none outline-none tap-highlight-transparent flex items-center justify-center w-12 h-12 bg-background/20 backdrop-blur-sm rounded-full border border-primary/10"
          aria-label="Scroll to top"
        >
          <ChevronUp size={32} strokeWidth={3} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
