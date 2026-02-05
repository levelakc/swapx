import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getItems, getPopularItems } from '../api/api';
import HeroSection from '../components/home/HeroSection';
import FeaturedItems from '../components/home/FeaturedItems';
import PopularItems from '../components/home/PopularItems'; // Import PopularItems
import HowItWorks from '../components/home/HowItWorks';

import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: featuredItems, isLoading: isLoadingFeatured, error: errorFeatured } = useQuery({
    queryKey: ['items', 'featured'],
    queryFn: () => getItems({ status: 'active', limit: 8, featured: true })
  });

  const { data: popularItems, isLoading: isLoadingPopular, error: errorPopular } = useQuery({
    queryKey: ['items', 'popular'],
    queryFn: () => getPopularItems(8)
  });

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
      
      {(isLoadingFeatured || isLoadingPopular) && (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      {errorFeatured && <p className="text-center text-red-500">Error loading featured items.</p>}
      {featuredItems && featuredItems.items && (
        <motion.div variants={itemVariants}>
          <FeaturedItems items={featuredItems.items} />
        </motion.div>
      )}

      {errorPopular && <p className="text-center text-red-500">Error loading popular items.</p>}
      {popularItems && popularItems.items && (
        <motion.div variants={itemVariants}>
          <PopularItems items={popularItems.items} />
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <HowItWorks />
      </motion.div>
      
    </motion.div>
  );
}
