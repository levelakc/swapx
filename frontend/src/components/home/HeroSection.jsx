import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Coins, Package, Repeat, Search, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { useState } from 'react';

export default function HeroSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const floatingIcons = [
    { Icon: ArrowLeftRight, color: "text-blue-500", x: -150, y: -100, delay: 0 },
    { Icon: Coins, color: "text-yellow-500", x: 180, y: -120, delay: 1 },
    { Icon: Package, color: "text-green-500", x: -120, y: 150, delay: 2 },
    { Icon: Repeat, color: "text-purple-500", x: 150, y: 120, delay: 0.5 },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
        navigate(`/browse?keyword=${encodeURIComponent(searchValue)}`);
    }
  };

  const categories = [
    { name: t('electronics'), icon: '💻', slug: 'electronics' },
    { name: t('fashion'), icon: '👕', slug: 'fashion' },
    { name: t('gaming'), icon: '🎮', slug: 'gaming' },
    { name: t('cars'), icon: '🚗', slug: 'cars' },
    { name: t('jewelry'), icon: '💎', slug: 'jewelry' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] overflow-hidden bg-background pt-20">
      
      {/* Animated Background Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className={`absolute left-1/2 top-1/2 ${item.color} opacity-20 hidden md:block`}
            initial={{ x: item.x, y: item.y, scale: 0.8 }}
            animate={{ 
              y: [item.y - 40, item.y + 40, item.y - 40],
              rotate: [0, 25, -25, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              delay: item.delay,
              ease: "easeInOut" 
            }}
          >
            <item.Icon size={100} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 px-4 text-center w-full max-w-5xl mx-auto space-y-12">
        {/* Functional Search Bar - More Prominent */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto w-full"
        >
            <h2 className="text-xl font-bold text-muted-foreground mb-6 uppercase tracking-widest">{t('searchItems')}</h2>
            <form onSubmit={handleSearch} className="relative group">
                <input 
                    type="text" 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={t('searchItems')}
                    className="w-full h-20 pl-16 pr-40 rounded-3xl bg-card border-2 border-border focus:border-primary shadow-2xl focus:ring-8 focus:ring-primary/5 transition-all text-xl outline-none"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={28} />
                <button 
                    type="submit"
                    className="absolute right-3 top-3 bottom-3 px-8 rounded-2xl bg-primary text-primary-content font-black hover:bg-primary/90 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                    <Search size={20} />
                    <span>{t('search').split(' ')[0]} / חיפוש</span>
                </button>
            </form>
        </motion.div>

        {/* Quick Categories with improved look */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
        >
            {categories.map((cat, i) => (
                <Link 
                    key={i}
                    to={`/browse?category=${cat.slug}`}
                    className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-card hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all min-w-[100px] group shadow-sm hover:shadow-md"
                >
                    <span className="text-3xl group-hover:scale-125 transition-transform">{cat.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{cat.name}</span>
                </Link>
            ))}
        </motion.div>

        {/* Trust Badges - Horizontal Divider */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-12 border-t border-border/50 text-muted-foreground"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10"><ShieldCheck size={20} className="text-green-500" /></div>
                <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">Secure</p>
                    <p className="text-xs font-bold text-foreground">Secure Trading</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10"><TrendingUp size={20} className="text-blue-500" /></div>
                <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">Active</p>
                    <p className="text-xs font-bold text-foreground">Active Community</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10"><Repeat size={20} className="text-purple-500" /></div>
                <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">Fast</p>
                    <p className="text-xs font-bold text-foreground">Fast Swapping</p>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}