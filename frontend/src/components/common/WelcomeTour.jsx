import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, ChevronRight, ChevronLeft, Sparkles, Compass, Briefcase, Search, MessageSquare, User, Coins } from 'lucide-react';

const PencilArrow = ({ className, rotation = 0 }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={`w-32 h-32 fill-none stroke-primary stroke-[3] stroke-linecap-round stroke-linejoin-round drop-shadow-lg origin-center ${className}`}
    style={{ transform: `rotate(${rotation}deg)` }}
  >
    {/* A more curved arrow pointing to top-right corner of the SVG box */}
    <path 
        d="M20,90 Q30,40 85,15" 
        className="animate-[dash_2s_ease-in-out_infinite]"
        strokeDasharray="200"
        strokeDashoffset="200"
    />
    <path 
        d="M70,15 L85,15 L85,30" 
        className="animate-[dash_2s_ease-in-out_infinite]"
        strokeDasharray="100"
        strokeDashoffset="100"
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
  const [arrowStyles, setArrowStyles] = useState({});

  useEffect(() => {
    const hideTour = localStorage.getItem('hideTourV3');
    if (!hideTour) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps = [
    {
      title: language === 'he' ? 'היי! ברוכים הבאים ל-AHLAFOT 👋' : 'Hey! Welcome to AHLAFOT 👋',
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
      target: "tour-explore",
      rotation: -140 // Pointing UP towards the navbar
    },
    {
      title: language === 'he' ? 'צריכים עזרה מקצועית? 🛠️' : 'Need Professional Help? 🛠️',
      description: language === 'he'
        ? 'תחת כפתור ה-Services תמצאו מומחים שיעזרו לכם - מעיצוב גרפי ועד תיקונים. הכל בשיטת הטרייד!'
        : "Under the Services button, you'll find experts to help you - from graphic design to repairs. All via trade!",
      icon: <Briefcase className="w-8 h-8 text-blue-500" />,
      target: "tour-services",
      rotation: -140
    },
    {
        title: language === 'he' ? 'מטבעות AHLAFOT 💰' : 'AHLAFOT Coins 💰',
        description: language === 'he'
          ? 'השתמשו במטבעות כדי להקפיץ את הפריטים שלכם לראש הרשימה ולקבל יותר חשיפה!'
          : "Use coins to boost your items to the top of the list and get more visibility!",
        icon: <Coins className="w-8 h-8 text-yellow-500" />,
        target: "tour-coins",
        rotation: -140
      },
    {
      title: language === 'he' ? 'הצעות ומשא ומתן 🤝' : 'Offers & Negotiation 🤝',
      description: language === 'he'
        ? 'כאן קורה הקסם! ב-Offers תוכלו לנהל את כל הטריידים שלכם, לדבר עם אנשים ולסגור עסקאות.'
        : "This is where the magic happens! In Offers, you can manage all your trades, talk to people, and close deals.",
      icon: <MessageSquare className="w-8 h-8 text-emerald-500" />,
      target: "tour-offers",
      rotation: -140
    },
    {
      title: language === 'he' ? 'הפרופיל שלכם 👤' : 'Your Profile 👤',
      description: language === 'he'
        ? 'כאן תוכלו לערוך את הפרטים שלכם, לראות את הפריטים שהעליתם ולנהל את החשבון.'
        : "Here you can edit your details, see the items you've uploaded, and manage your account.",
      icon: <User className="w-8 h-8 text-purple-500" />,
      target: "tour-profile",
      rotation: 20 // Profile is usually inside the burger menu or sidebar, pointing slightly different
    }
  ];

  useEffect(() => {
    if (isOpen && steps[currentStep].target) {
      const updatePosition = () => {
        const element = document.getElementById(steps[currentStep].target);
        if (element) {
          const rect = element.getBoundingClientRect();
          const isNavbarItem = steps[currentStep].target.startsWith('tour-');
          
          if (steps[currentStep].target === 'tour-profile') {
              // Profile is in burger menu, we point from LEFT to RIGHT or so
              setArrowStyles({
                top: rect.top + (rect.height / 2) - 64,
                left: rect.left - 100,
                position: 'fixed'
              });
          } else {
              // Navbar items - Pointing UP from below
              setArrowStyles({
                top: rect.bottom + 10,
                left: rect.left + (rect.width / 2) - 80, // Point tip is at ~90% width of 128px
                position: 'fixed'
              });
          }
        }
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    } else {
      setArrowStyles({});
    }
  }, [isOpen, currentStep]);

  const closeTour = (e) => {
    if (e) e.stopPropagation();
    localStorage.setItem('hideTourV3', 'true');
    setIsOpen(false);
  };

  const nextStep = (e) => {
    if (e) e.stopPropagation();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTour();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px] cursor-pointer"
          onClick={nextStep}
        >
          
          {/* Dynamic Arrow */}
          {steps[currentStep].target && (
            <motion.div 
              key={`arrow-${currentStep}`}
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="z-[610] pointer-events-none"
              style={arrowStyles}
            >
              <PencilArrow rotation={steps[currentStep].rotation} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-primary/20 m-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 md:p-16">
              <div className="flex justify-between items-start mb-8">
                <div className={`p-6 rounded-3xl ${steps[currentStep].target ? 'bg-primary/10' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
                    {steps[currentStep].icon ? 
                        <div className="scale-[2] text-primary">{steps[currentStep].icon}</div> : 
                        <span className="text-6xl">{steps[currentStep].emoji}</span>
                    }
                </div>
                <button 
                  onClick={closeTour} 
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
                >
                  <X size={32} className="text-slate-400 group-hover:text-primary transition-colors" />
                </button>
              </div>

              <h2 className="text-4xl md:text-5xl font-black mb-6 dark:text-white leading-tight">
                {steps[currentStep].title}
              </h2>

              <p className="text-slate-600 dark:text-slate-400 text-xl md:text-2xl leading-relaxed mb-12">
                {steps[currentStep].description}
              </p>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex gap-3">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-3 rounded-full transition-all duration-300 ${i === currentStep ? 'w-12 bg-primary' : 'w-3 bg-slate-200 dark:bg-slate-700'}`} 
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="w-full md:w-auto px-10 py-5 bg-primary text-white text-xl font-black rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/30 flex items-center justify-center gap-3 group"
                >
                  {currentStep === steps.length - 1 
                    ? (language === 'he' ? 'יאללה לדרך!' : "Let's Go!") 
                    : (language === 'he' ? 'הבנתי, הלאה' : 'Got it, next')
                  }
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Scribble Effect Bottom */}
            <div className="h-2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
