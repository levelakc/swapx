import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, ChevronRight, ChevronLeft, Sparkles, Compass, Briefcase, Search, MessageSquare, User, Coins } from 'lucide-react';

const PencilArrow = ({ className, rotation = 0 }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={`w-24 h-24 fill-none stroke-primary stroke-[3] stroke-linecap-round stroke-linejoin-round drop-shadow-sm ${className}`}
    style={{ transform: `rotate(${rotation}deg)` }}
  >
    <path 
        d="M20,80 Q40,20 80,40 M80,40 L70,30 M80,40 L65,45" 
        className="animate-[dash_2s_ease-in-out_infinite]"
        strokeDasharray="200"
        strokeDashoffset="200"
    />
    <style>{`
      @keyframes dash {
        to { stroke-dashoffset: 0; }
      }
    `}</style>
  </svg>
);

export default function WelcomeTour() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hideTour = localStorage.getItem('hideTourV3');
    if (!hideTour) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTour = () => {
    localStorage.setItem('hideTourV3', 'true');
    setIsOpen(false);
  };

  const steps = [
    {
      title: language === 'he' ? 'היי! ברוכים הבאים ל-Ahlafot 👋' : 'Hey! Welcome to Ahlafot 👋',
      description: language === 'he' 
        ? 'אנחנו כאן כדי לעזור לכם להחליף את מה שיש לכם במה שאתם באמת רוצים. בלי כסף (או עם קצת, אם בא לכם!), רק החלפות פשוטות וכיפיות.' 
        : "We're here to help you swap what you have for what you actually want. No cash (or just a bit!), just simple and fun trading.",
      emoji: "✨",
      position: "center"
    },
    {
      title: language === 'he' ? 'גלו פריטים חדשים 🔍' : 'Discover New Items 🔍',
      description: language === 'he'
        ? 'כפתור ה-Explore למעלה הוא השער שלכם לעולם של פריטים. מכוניות, שעונים, או אפילו קלפים - הכל נמצא שם!'
        : "The Explore button at the top is your gateway to a world of items. Cars, watches, or even cards - it's all there!",
      icon: <Compass className="w-8 h-8 text-primary" />,
      arrowPos: "top-left",
      target: "explore"
    },
    {
      title: language === 'he' ? 'צריכים עזרה מקצועית? 🛠️' : 'Need Professional Help? 🛠️',
      description: language === 'he'
        ? 'תחת כפתור ה-Services תמצאו מומחים שיעזרו לכם - מעיצוב גרפי ועד תיקונים. הכל בשיטת הטרייד!'
        : "Under the Services button, you'll find experts to help you - from graphic design to repairs. All via trade!",
      icon: <Briefcase className="w-8 h-8 text-blue-500" />,
      arrowPos: "top-left",
      target: "services"
    },
    {
      title: language === 'he' ? 'הצעות ומשא ומתן 🤝' : 'Offers & Negotiation 🤝',
      description: language === 'he'
        ? 'כאן קורה הקסם! ב-Offers תוכלו לנהל את כל הטריידים שלכם, לדבר עם אנשים ולסגור עסקאות.'
        : "This is where the magic happens! In Offers, you can manage all your trades, talk to people, and close deals.",
      icon: <MessageSquare className="w-8 h-8 text-emerald-500" />,
      arrowPos: "top-right",
      target: "offers"
    },
    {
        title: language === 'he' ? 'מטבעות Ahlafot 💰' : 'Ahlafot Coins 💰',
        description: language === 'he'
          ? 'השתמשו במטבעות כדי להקפיץ את הפריטים שלכם לראש הרשימה ולקבל יותר חשיפה!'
          : "Use coins to boost your items to the top of the list and get more visibility!",
        icon: <Coins className="w-8 h-8 text-yellow-500" />,
        arrowPos: "top-right",
        target: "coins"
      },
    {
      title: language === 'he' ? 'הפרופיל שלכם 👤' : 'Your Profile 👤',
      description: language === 'he'
        ? 'כאן תוכלו לערוך את הפרטים שלכם, לראות את הפריטים שהעליתם ולנהל את החשבון.'
        : "Here you can edit your details, see the items you've uploaded, and manage your account.",
      icon: <User className="w-8 h-8 text-purple-500" />,
      arrowPos: "top-right",
      target: "profile"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTour();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
          
          {/* Arrow Logic */}
          {steps[currentStep].arrowPos === "top-left" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-20 left-[20%] z-50 pointer-events-none"
            >
              <PencilArrow rotation={-140} />
            </motion.div>
          )}

          {steps[currentStep].arrowPos === "top-right" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-20 right-[25%] z-50 pointer-events-none"
            >
              <PencilArrow rotation={-40} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 m-4"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${steps[currentStep].target ? 'bg-primary/10' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
                    {steps[currentStep].icon || <span className="text-3xl">{steps[currentStep].emoji}</span>}
                </div>
                <button onClick={closeTour} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <h2 className="text-2xl font-black mb-4 dark:text-white">
                {steps[currentStep].title}
              </h2>

              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                {steps[currentStep].description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} 
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-primary text-white font-black rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {currentStep === steps.length - 1 
                    ? (language === 'he' ? 'יאללה לדרך!' : "Let's Go!") 
                    : (language === 'he' ? 'הבנתי, הלאה' : 'Got it, next')
                  }
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Scribble Effect Bottom */}
            <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
