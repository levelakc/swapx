import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getItems, getPopularItems, getPopularServices } from '../api/api';
import HeroSection from '../components/home/HeroSection';
import FeaturedItems from '../components/home/FeaturedItems';
import PopularItems from '../components/home/PopularItems';
import PopularServices from '../components/home/PopularServices';
import SuggestedSearch from '../components/home/SuggestedSearch';
import HowItWorks from '../components/home/HowItWorks';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

import { Loader2, Search } from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [itemSearch, setItemSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const { data: popularItems, isLoading: isLoadingPopular, error: errorPopular } = useQuery({
    queryKey: ['items', 'popular'],
    queryFn: () => getPopularItems(8)
  });

  const { data: popularServices, isLoading: isLoadingPopularServices, error: errorPopularServices } = useQuery({
    queryKey: ['services', 'popular'],
    queryFn: () => getPopularServices(8)
  });

  const handleItemSearch = (e) => {
    e.preventDefault();
    if (itemSearch.trim()) {
      navigate(`/browse?keyword=${encodeURIComponent(itemSearch)}`);
    }
  };

  const handleServiceSearch = (e) => {
    e.preventDefault();
    if (serviceSearch.trim()) {
      navigate(`/browse-services?keyword=${encodeURIComponent(serviceSearch)}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div 
      className="space-y-24 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <HeroSection />
      </motion.div>
      
      {(isLoadingPopular || isLoadingPopularServices) && (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      <div className="space-y-32">
        {/* Popular Items Section */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6">
            <div className="flex-1">
                <PopularItems items={popularItems?.items || []} />
            </div>
            <div className="w-full md:w-96">
                <form onSubmit={handleItemSearch} className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                    <input 
                    type="text" 
                    placeholder={t('searchItems', 'Search items to swap...')} 
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base shadow-sm"
                    />
                </form>
                <SuggestedSearch type="item" />
            </div>
          </div>
        </motion.div>

        {/* Popular Services Section */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6">
            <div className="flex-1">
                <PopularServices services={popularServices?.services || []} />
            </div>
            <div className="w-full md:w-96">
                <form onSubmit={handleServiceSearch} className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                    <input 
                    type="text" 
                    placeholder={t('searchServices', 'Search services...')} 
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base shadow-sm"
                    />
                </form>
                <SuggestedSearch type="service" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <HowItWorks />
      </motion.div>
      
    </motion.div>
  );
}
