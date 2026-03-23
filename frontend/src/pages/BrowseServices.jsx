import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getServices } from '../api/api';
import ServiceCard from '../components/services/ServiceCard';
import ServiceFilterSidebar from '../components/filters/ServiceFilterSidebar';
import { Loader2, Search, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PageInfo from '../components/common/PageInfo';

export default function BrowseServices() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 500
    ],
    location: searchParams.get('location') || ''
  });

  // Sync filters to URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    if (filters.priceRange[0] > 0) newParams.set('minPrice', filters.priceRange[0]);
    else newParams.delete('minPrice');
    
    if (filters.priceRange[1] < 500) newParams.set('maxPrice', filters.priceRange[1]);
    else newParams.delete('maxPrice');
    
    if (filters.location) newParams.set('location', filters.location);
    else newParams.delete('location');

    setSearchParams(newParams, { replace: true });
  }, [filters]);

  const queryFilters = {
    keyword: searchParams.get('keyword') || '',
    location: filters.location,
    minPrice: filters.priceRange[0],
    maxPrice: filters.priceRange[1],
  };

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services', queryFilters],
    queryFn: () => getServices(queryFilters),
  });

  const handleSearch = (e) => {
      e.preventDefault();
      const newParams = new URLSearchParams(searchParams);
      if (keyword) {
          newParams.set('keyword', keyword);
          document.cookie = `last_service_search=${encodeURIComponent(keyword)}; path=/; max-age=604800`;
      } else {
          newParams.delete('keyword');
      }
      setSearchParams(newParams);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar */}
      <ServiceFilterSidebar 
        filters={filters} 
        onFilterChange={setFilters} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-card p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {t('browseServices')}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t('browseServicesSubtitle', 'Find professionals for your needs')}</p>
                </div>
                <PageInfo infoKey="servicesInfo" />
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto items-center">
                <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input 
                        type="text" 
                        placeholder={t('searchServices', 'Search services...')} 
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full bg-muted/50 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>
                <button 
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-content rounded-full text-sm font-bold hover:shadow-lg transition-all active:scale-95"
                >
                    {t('navSearch', 'Search')}
                </button>
            </form>
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center mb-6 bg-card p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-content rounded-lg font-medium hover:bg-secondary/90 transition-colors"
             >
                <Filter size={18} />
                {t('filters', 'Filters')}
             </button>
             <p className="text-sm font-medium text-muted-foreground hidden sm:block">
                {isLoading ? '...' : services.length} {t('itemsFoundSuffix', 'items found')}
             </p>
          </div>
        </div>

        {isLoading && <div className="flex justify-center mt-20"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}
        {error && <p className="text-red-500 text-center mt-20">{t('errorLoadingItems', 'Error loading services')}</p>}
        
        {!isLoading && !error && services.length === 0 && (
            <div className="text-center mt-20 text-muted-foreground">
                <p>{t('noServicesFound', 'No services found.')}</p>
            </div>
        )}

        <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {services.map(service => (
            <motion.div key={service._id} variants={itemVariants}>
                <ServiceCard service={service} />
            </motion.div>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
