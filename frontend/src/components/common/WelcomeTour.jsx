import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, ChevronRight, ChevronLeft, Rocket, Shield, Users, Zap, Search, Repeat, Coins, Sparkles } from 'lucide-react';

export default function WelcomeTour() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  useEffect(() => {
    const hideTour = localStorage.getItem('hideTourV2');
    
    // Show tour if user hasn't checked "do not show again"
    if (!hideTour) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTour = () => {
    if (doNotShowAgain) {
      localStorage.setItem('hideTourV2', 'true');
    }
    setIsOpen(false);
  };

  const steps = [
    {
      title: language === 'he' ? 'ברוכים הבאים ל-Ahlafot!' : 'Welcome to Ahlafot!',
      description: language === 'he' ? 'הגרסה החדשה והמשופרת כאן! הנה מה שאתם יכולים לעשות:' : 'The new and improved version is here! Here is what you can do:',
      icon: <Rocket className="w-12 h-12 text-primary" />,
      color: 'bg-primary/10',
      gradient: 'from-primary/20 to-purple-500/20'
    },
    {
      title: language === 'he' ? 'חיפוש חכם / Smart Search' : 'Smart Search',
      description: language === 'he' ? 'חפשו פריטים ושירותים בקלות. הוספנו תתי-טקסט בשתי השפות כדי שיהיה לכם קל לנווט!' : 'Search for items and services with ease. We added bilingual labels to help you navigate!',
      icon: <Search className="w-12 h-12 text-blue-500" />,
      color: 'bg-blue-500/10',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      title: language === 'he' ? 'החלפות מהירות / Fast Swaps' : 'Fast Swaps',
      description: language === 'he' ? 'מצאו מישהו שרוצה את מה שיש לכם והציעו טרייד בשניות. אפשר להוסיף כסף כדי לאזן את העסקה!' : 'Find someone who wants what you have and offer a trade in seconds. You can add cash to balance the deal!',
      icon: <Repeat className="w-12 h-12 text-emerald-500" />,
      color: 'bg-emerald-500/10',
      gradient: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      title: language === 'he' ? 'העוזרת האישית / AI Assistant' : 'AI Assistant',
      description: language === 'he' ? 'הצ\'אט בוט שלנו שודרג! הוא יענה לכם על שאלות, ייתן לכם כפתורי פעולה מהירים ויוביל אתכם לתמיכה אם תצטרכו.' : 'Our chatbot is upgraded! It will answer your questions, give you quick action buttons, and lead you to support if needed.',
      icon: <Zap className="w-12 h-12 text-yellow-500" />,
      color: 'bg-yellow-500/10',
      gradient: 'from-yellow-500/20 to-orange-500/20'
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative bg-background w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10"
          >
            {/* Background Gradient Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[80px] opacity-30 bg-gradient-to-br ${steps[currentStep].gradient}`} />
                <div className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-30 bg-gradient-to-br ${steps[currentStep].gradient}`} />
            </div>

            <button 
              onClick={closeTour}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors z-20 text-muted-foreground"
            >
              <X size={24} />
            </button>

            <div className="p-10 flex flex-col items-center text-center">
              <motion.div
                key={`icon-${currentStep}`}
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                className={`p-8 rounded-[2rem] ${steps[currentStep].color} mb-8 shadow-inner border border-white/5 relative`}
              >
                {steps[currentStep].icon}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 text-primary"
                >
                    <Sparkles size={20} />
                </motion.div>
              </motion.div>

              <motion.h2
                key={`title-${currentStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black mb-4 tracking-tight"
              >
                {steps[currentStep].title}
              </motion.h2>

              <motion.p
                key={`desc-${currentStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground text-xl leading-relaxed mb-10 font-medium px-4"
              >
                {steps[currentStep].description}
              </motion.p>

              <div className="flex items-center justify-between w-full mt-auto">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 font-black text-sm transition-all ${currentStep === 0 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 hover:text-primary'}`}
                >
                  <ChevronLeft size={20} /> {language === 'he' ? 'הקודם' : 'Back'}
                </button>

                <div className="flex gap-2">
                  {steps.map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`h-2 rounded-full transition-all duration-500 ${i === currentStep ? 'w-10 bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'w-2 bg-muted hover:bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 font-black text-sm text-primary hover:opacity-80 group"
                >
                  {currentStep === steps.length - 1 
                    ? (language === 'he' ? 'סיום' : 'Finish') 
                    : (language === 'he' ? 'הבא' : 'Next')
                  }
                  {currentStep !== steps.length - 1 && (
                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <ChevronRight size={20} />
                    </motion.div>
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
                {currentStep === steps.length - 1 && (
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    className="bg-primary/5 p-8 flex flex-col gap-6 border-t border-white/5 backdrop-blur-sm"
                >
                    <label className="flex items-center justify-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={doNotShowAgain}
                                onChange={(e) => setDoNotShowAgain(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-muted rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all" />
                            <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{t('doNotShowAgain')}</span>
                    </label>
                    <button 
                    onClick={closeTour}
                    className="w-full py-5 bg-primary text-primary-content font-black rounded-2xl shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.5)] hover:shadow-[0_25px_50px_-12px_rgba(var(--primary-rgb),0.6)] hover:scale-[1.02] transition-all active:scale-[0.98] text-lg uppercase tracking-wider"
                    >
                    {language === 'he' ? 'בואו נתחיל!' : "Let's Get Started!"}
                    </button>
                </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
