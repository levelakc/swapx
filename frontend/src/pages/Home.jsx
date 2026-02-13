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

  const { data: featuredItems, isLoading: isLoadingFeatured, error: errorFeatured } = useQuery({
    queryKey: ['items', 'featured'],
    queryFn: () => getItems({ status: 'active', limit: 8, featured: true })
  });

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
      className="space-y-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <HeroSection />
      </motion.div>
      
      {(isLoadingFeatured || isLoadingPopular || isLoadingPopularServices) && (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {featuredItems && featuredItems.items && (
        <motion.div variants={itemVariants}>
          <FeaturedItems items={featuredItems.items} />
        </motion.div>
      )}

      <div className="space-y-24">
        {/* Popular Items Section */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <PopularItems items={popularItems?.items || []} />
          </div>
          <div className="max-w-xl">
             <form onSubmit={handleItemSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input 
                  type="text" 
                  placeholder={t('searchItems', 'Search items to swap...')} 
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full bg-secondary/20 border border-secondary/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg shadow-sm"
                />
             </form>
             <SuggestedSearch type="item" />
          </div>
        </motion.div>

        {/* Popular Services Section */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <PopularServices services={popularServices?.services || []} />
          </div>
          <div className="max-w-xl">
             <form onSubmit={handleServiceSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input 
                  type="text" 
                  placeholder={t('searchServices', 'Search services...')} 
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full bg-secondary/20 border border-secondary/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg shadow-sm"
                />
             </form>
             <SuggestedSearch type="service" />
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <HowItWorks />
      </motion.div>
      
    </motion.div>
  );
}
