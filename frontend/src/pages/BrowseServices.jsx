import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getServices } from '../api/api';
import ServiceCard from '../components/services/ServiceCard';
import { Loader2, Search, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function BrowseServices() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [location, setLocation] = useState('');

  const queryFilters = {
    keyword,
    location,
  };

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services', queryFilters],
    queryFn: () => getServices(queryFilters),
  });

  const handleSearch = (e) => {
      e.preventDefault();
      setSearchParams({ keyword });
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
    <div className="container mx-auto p-4 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {t('browseServices')}
            </h1>
            <p className="text-muted-foreground mt-1">Find professionals for your needs</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input 
                    type="text" 
                    placeholder="Search services..." 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full bg-muted/50 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
            </div>
            <div className="relative flex-1 md:w-48">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input 
                    type="text" 
                    placeholder="Location" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-muted/50 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
            </div>
        </form>
      </div>

      {isLoading && <div className="flex justify-center mt-20"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}
      {error && <p className="text-red-500 text-center mt-20">Error loading services</p>}
      
      {!isLoading && !error && services.length === 0 && (
        <div className="text-center mt-20 text-muted-foreground">
            <p>No services found.</p>
        </div>
      )}

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
  );
}
