import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getPopularItems, getSuggestedItems, getPopularServices, getSuggestedServices } from '../api/api';
import HeroSection from '../components/home/HeroSection';
import PopularItems from '../components/home/PopularItems';
import PopularServices from '../components/home/PopularServices';
import { useLanguage } from '../contexts/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const lastCategory = getCookie('last_category_search');

  const { 
    data: popularItems, 
    isLoading: isLoadingPopular, 
    refetch: refreshPopular 
  } = useQuery({
    queryKey: ['items', 'popular'],
    queryFn: () => getPopularItems(8),
    staleTime: 0,
  });

  const { 
    data: suggestedItems, 
    isLoading: isLoadingSuggested, 
    refetch: refreshSuggested 
  } = useQuery({
    queryKey: ['items', 'suggested', lastCategory],
    queryFn: () => getSuggestedItems(8, lastCategory),
    staleTime: 0,
  });

  const {
    data: popularServices,
    isLoading: isLoadingServices,
    refetch: refreshServices
  } = useQuery({
    queryKey: ['services', 'popular'],
    queryFn: () => getPopularServices(8),
    staleTime: 0,
  });

  const {
    data: suggestedServices,
    isLoading: isLoadingSuggestedServices,
    refetch: refreshSuggestedServices
  } = useQuery({
    queryKey: ['services', 'suggested', lastCategory],
    queryFn: () => getSuggestedServices(8, lastCategory),
    staleTime: 0,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
        ease: "easeOut"
      },
    },
  };

  return (
    <motion.div 
      className="space-y-16 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <HeroSection />
      </motion.div>
      
      <div className="container mx-auto px-4 space-y-24">
        {/* Popular Items Section */}
        <motion.div variants={itemVariants}>
          <PopularItems 
              items={popularItems?.items || []} 
              title={t('popularItems')}
              onRefresh={() => refreshPopular()}
              isLoading={isLoadingPopular}
          />
        </motion.div>

        {/* Suggested Items Section */}
        <motion.div variants={itemVariants}>
          <PopularItems 
              items={suggestedItems?.items || []} 
              title={t('suggestedItems')}
              onRefresh={() => refreshSuggested()}
              isLoading={isLoadingSuggested}
          />
        </motion.div>

        {/* Popular Services Section */}
        <motion.div variants={itemVariants}>
          <PopularServices 
              services={popularServices?.services || []} 
              title={t('popularServices')}
              onRefresh={() => refreshServices()}
              isLoading={isLoadingServices}
          />
        </motion.div>

        {/* Suggested Services Section */}
        <motion.div variants={itemVariants}>
          <PopularServices 
              services={suggestedServices?.services || []} 
              title={t('suggestedServices')}
              onRefresh={() => refreshSuggestedServices()}
              isLoading={isLoadingSuggestedServices}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
