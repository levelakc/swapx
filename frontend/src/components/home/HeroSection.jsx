import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, TrendingUp, Repeat, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

export default function HeroSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
        navigate(`/browse?keyword=${encodeURIComponent(searchValue)}`);
    }
  };

  const categories = [
    { name: t('viewAll'), icon: <LayoutGrid size={24} />, slug: 'all' },
    { name: t('electronics'), icon: '💻', slug: 'electronics' },
    { name: t('vehicles', 'Vehicles'), icon: '🚗', slug: 'vehicles' },
    { name: t('fashion'), icon: '👕', slug: 'fashion_main' },
    { name: t('home', 'Home & Garden'), icon: '🏡', slug: 'home' },
    { name: t('realEstate', 'Real Estate'), icon: '🏢', slug: 'real_estate_main' },
    { name: t('lifestyle', 'Leisure'), icon: '🎨', slug: 'lifestyle' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[50vh] bg-transparent pt-20">
      
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
                    className="w-full h-20 ps-16 pe-44 md:pe-52 rounded-3xl bg-card border-2 border-border focus:border-primary shadow-2xl focus:ring-8 focus:ring-primary/5 transition-all text-xl outline-none"
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
                    to={cat.slug === 'all' ? '/browse' : `/browse?category=${cat.slug}`}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-card hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all min-w-[110px] group shadow-sm hover:shadow-md"
                >
                    <span className="text-3xl group-hover:scale-125 transition-transform">{cat.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-center line-clamp-1">{cat.name}</span>
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