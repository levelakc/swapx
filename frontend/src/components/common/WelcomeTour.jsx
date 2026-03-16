import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, ChevronRight, ChevronLeft, Rocket, Shield, Users, Zap, Search, Repeat, Coins } from 'lucide-react';

export default function WelcomeTour() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTourV2');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTour = () => {
    localStorage.setItem('hasSeenTourV2', 'true');
    setIsOpen(false);
  };

  const steps = [
    {
      title: language === 'he' ? 'ברוכים הבאים ל-SwapX!' : 'Welcome to SwapX!',
      description: language === 'he' ? 'הגרסה החדשה והמשופרת כאן! הנה מה שאתם יכולים לעשות:' : 'The new and improved version is here! Here is what you can do:',
      icon: <Rocket className="w-12 h-12 text-primary" />,
      color: 'bg-primary/10'
    },
    {
      title: language === 'he' ? 'חיפוש חכם / Smart Search' : 'Smart Search',
      description: language === 'he' ? 'חפשו פריטים ושירותים בקלות. הוספנו תתי-טקסט בשתי השפות כדי שיהיה לכם קל לנווט!' : 'Search for items and services with ease. We added bilingual labels to help you navigate!',
      icon: <Search className="w-12 h-12 text-blue-500" />,
      color: 'bg-blue-500/10'
    },
    {
      title: language === 'he' ? 'החלפות מהירות / Fast Swaps' : 'Fast Swaps',
      description: language === 'he' ? 'מצאו מישהו שרוצה את מה שיש לכם והציעו טרייד בשניות. אפשר להוסיף כסף כדי לאזן את העסקה!' : 'Find someone who wants what you have and offer a trade in seconds. You can add cash to balance the deal!',
      icon: <Repeat className="w-12 h-12 text-purple-500" />,
      color: 'bg-purple-500/10'
    },
    {
      title: language === 'he' ? 'העוזרת האישית / AI Assistant' : 'AI Assistant',
      description: language === 'he' ? 'הצ\'אט בוט שלנו שודרג! הוא יענה לכם על שאלות, ייתן לכם כפתורי פעולה מהירים ויוביל אתכם לתמיכה אם תצטרכו.' : 'Our chatbot is upgraded! It will answer your questions, give you quick action buttons, and lead you to support if needed.',
      icon: <Zap className="w-12 h-12 text-yellow-500" />,
      color: 'bg-yellow-500/10'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-background w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <button 
              onClick={closeTour}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 flex flex-col items-center text-center">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-full ${steps[currentStep].color} mb-6`}
              >
                {steps[currentStep].icon}
              </motion.div>

              <motion.h2
                key={`title-${currentStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-black mb-4"
              >
                {steps[currentStep].title}
              </motion.h2>

              <motion.p
                key={`desc-${currentStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground text-lg leading-relaxed mb-8"
              >
                {steps[currentStep].description}
              </motion.p>

              <div className="flex items-center justify-between w-full mt-auto">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 font-bold text-sm transition-opacity ${currentStep === 0 ? 'opacity-0' : 'opacity-100'}`}
                >
                  <ChevronLeft size={18} /> {language === 'he' ? 'הקודם' : 'Previous'}
                </button>

                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-1 font-bold text-sm text-primary hover:opacity-80"
                >
                  {currentStep === steps.length - 1 
                    ? (language === 'he' ? 'סיום' : 'Finish') 
                    : (language === 'he' ? 'הבא' : 'Next')
                  }
                  {currentStep !== steps.length - 1 && <ChevronRight size={18} />}
                </button>
              </div>
            </div>

            {currentStep === steps.length - 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-primary/5 p-4 text-center border-t border-primary/10"
              >
                <button 
                  onClick={closeTour}
                  className="w-full py-3 bg-primary text-primary-content font-black rounded-xl shadow-lg hover:shadow-primary/30 transition-all"
                >
                  {language === 'he' ? 'בואו נתחיל!' : "Let's Get Started!"}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
