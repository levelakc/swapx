import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Coins, Package, Repeat } from 'lucide-react';

export default function HeroSection() {
  const { t } = useLanguage();

  const floatingIcons = [
    { Icon: ArrowLeftRight, color: "text-blue-500", x: -100, y: -50, delay: 0 },
    { Icon: Coins, color: "text-yellow-500", x: 120, y: -80, delay: 1 },
    { Icon: Package, color: "text-green-500", x: -80, y: 100, delay: 2 },
    { Icon: Repeat, color: "text-purple-500", x: 100, y: 80, delay: 0.5 },
  ];

  return (
    <div className="relative flex items-center justify-center min-h-[80vh] overflow-hidden bg-gradient-to-b from-background to-background/50">
      
      {/* Animated Background Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className={`absolute left-1/2 top-1/2 ${item.color} opacity-20`}
            initial={{ x: item.x, y: item.y, scale: 0.8 }}
            animate={{ 
              y: [item.y - 20, item.y + 20, item.y - 20],
              rotate: [0, 10, -10, 0],
              scale: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              delay: item.delay,
              ease: "easeInOut" 
            }}
          >
            <item.Icon size={64} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 px-4 text-center max-w-4xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                {t('heroTitle')}
            </span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-muted-foreground leading-relaxed">
            {t('heroSubtitle')}
            </p>
        </motion.div>

        <motion.div 
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link
            to="/browse"
            className="px-8 py-4 text-lg font-bold rounded-full shadow-lg bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-content transition-all transform hover:scale-105"
          >
            {t('explore')}
          </Link>
          <Link
            to="/create"
            className="px-8 py-4 text-lg font-bold rounded-full shadow-lg bg-primary text-primary-content hover:bg-primary/90 transition-all transform hover:scale-105"
          >
            {t('listYourItem')}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}