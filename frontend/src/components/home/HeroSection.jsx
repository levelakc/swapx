import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, TrendingUp, Repeat, LayoutGrid, Loader2, ArrowLeftRight, Coins, Package, Zap } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/api';
import * as LucideIcons from 'lucide-react';

const Icon = ({ name, className }) => {
  const iconName = name ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') : 'LayoutGrid';
  const LucideIcon = LucideIcons[iconName] || LucideIcons[name] || LayoutGrid;
  return <LucideIcon className={className} />;
};

export default function HeroSection() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const mainCategories = Array.isArray(categories) 
    ? categories.filter(c => !c.parent && c.name !== 'services_main' && c.name !== 'other_main')
    : [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
        navigate(`/browse?keyword=${encodeURIComponent(searchValue)}`);
    }
  };

  const floatingIcons = [
    { Icon: ArrowLeftRight, color: "text-blue-500", x: -150, y: -80, delay: 0, size: 60, mobileSize: 40 },
    { Icon: Coins, color: "text-yellow-500", x: 180, y: -100, delay: 1, size: 70, mobileSize: 45 },
    { Icon: Package, color: "text-green-500", x: -120, y: 120, delay: 2, size: 65, mobileSize: 40 },
    { Icon: Repeat, color: "text-purple-500", x: 150, y: 100, delay: 0.5, size: 55, mobileSize: 35 },
    { Icon: Zap, color: "text-orange-500", x: 0, y: -140, delay: 1.5, size: 45, mobileSize: 30 },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[50vh] bg-transparent pt-20">
      
      {/* Animated Background Icons Specific to Hero */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center -z-10">
        <div className="relative w-full max-w-4xl h-full">
            {floatingIcons.map((item, index) => (
            <motion.div
                key={index}
                className={`absolute left-1/2 top-1/2 ${item.color} opacity-20`}
                initial={{ x: item.x * 0.6, y: item.y * 0.6, scale: 0.8 }}
                animate={{ 
                y: [item.y - 20, item.y + 20, item.y - 20],
                rotate: [0, 20, -20, 0],
                scale: [0.8, 1.1, 0.8]
                }}
                transition={{ 
                duration: 8 + Math.random() * 4, 
                repeat: Infinity, 
                delay: item.delay,
                ease: "easeInOut" 
                }}
            >
                <div className="md:block hidden">
                    <item.Icon size={item.size} />
                </div>
                <div className="md:hidden block">
                    <item.Icon size={item.mobileSize} />
                </div>
            </motion.div>
            ))}
        </div>
      </div>

      <div className="relative z-10 px-4 text-center w-full max-w-5xl mx-auto space-y-12">
        {/* Functional Search Bar - More Prominent */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto w-full"
        >
            <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-secondary mb-4 drop-shadow-sm">
                {t('timeToUpgrade')}
            </h1>
            <h2 className="text-lg font-bold text-muted-foreground mb-8 uppercase tracking-widest">{t('searchItems')}</h2>
            
            <form onSubmit={handleSearch} className="relative group">
                <input 
                    type="text" 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={t('searchItems')}
                    className="w-full h-20 ps-16 pe-44 md:pe-52 rounded-3xl bg-card/90 backdrop-blur-md border-2 border-border focus:border-primary shadow-2xl focus:ring-8 focus:ring-primary/5 transition-all text-xl outline-none"
                />
                <Search className="absolute start-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={28} />
                <button 
                    type="submit"
                    className="absolute end-2.5 top-2.5 bottom-2.5 px-6 md:px-10 rounded-2xl bg-primary text-primary-content font-black hover:bg-primary/90 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                    <Search size={20} className="hidden sm:block" />
                    <span>{t('navSearch')}</span>
                </button>
            </form>
        </motion.div>

        {/* Dynamic Categories */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
        >
            {/* Show All */}
            <Link 
                to="/browse"
                className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-card hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all min-w-[110px] group shadow-sm hover:shadow-md"
            >
                <LayoutGrid size={32} className="group-hover:scale-125 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-wider text-center line-clamp-1">{t('viewAll')}</span>
            </Link>

            {isLoadingCategories ? <Loader2 className="animate-spin" /> : mainCategories.map((cat) => (
                <Link 
                    key={cat._id}
                    to={`/browse?category=${cat._id}`}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-card hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all min-w-[110px] group shadow-sm hover:shadow-md"
                >
                    <div className="text-3xl group-hover:scale-125 transition-transform">
                        <Icon name={cat.icon} className="w-8 h-8" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-center line-clamp-1">
                        {cat[`label_${language}`] || cat.label_en}
                    </span>
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
                <div className="text-start">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{t('secure')}</p>
                    <p className="text-xs font-bold text-foreground">{t('secureTrading')}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10"><TrendingUp size={20} className="text-blue-500" /></div>
                <div className="text-start">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{t('activeBadge')}</p>
                    <p className="text-xs font-bold text-foreground">{t('activeCommunity')}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10"><Repeat size={20} className="text-purple-500" /></div>
                <div className="text-start">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{t('fast')}</p>
                    <p className="text-xs font-bold text-foreground">{t('fastSwapping')}</p>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}