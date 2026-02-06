import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getItems } from '../api/api';
import ItemCard from '../components/items/ItemCard';
import CategoryFilter from '../components/filters/CategoryFilter';
import FilterSidebar from '../components/filters/FilterSidebar';
import { Loader2, LayoutGrid, List, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Browse({ listingType = 'item' }) {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000000],
    conditions: [],
    cashOptions: [],
    location: ''
  });
  const [viewMode, setViewMode] = useState('grid');

  const queryFilters = {
    status: 'active',
    limit: 50,
    minPrice: filters.priceRange[0],
    maxPrice: filters.priceRange[1],
    conditions: filters.conditions.join(','),
    location: filters.location,
    keyword: keyword,
    listing_type: listingType,
  };

  if (selectedCategory !== 'all') {
    queryFilters.category = selectedCategory;
  }

  const { data: queryResult, isLoading, error } = useQuery({
    queryKey: ['items', 'browse', queryFilters, selectedCategory],
    queryFn: () => getItems(queryFilters),
  });
  const items = queryResult?.items || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar */}
      <FilterSidebar 
        filters={filters} 
        onFilterChange={setFilters} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 w-full min-w-0">
        <div className="mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {t('browseItems')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('browseItemsSubtitle', 'Discover unique items to trade')}</p>
        </div>

        <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6 bg-card p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-content rounded-lg font-medium hover:bg-secondary/90 transition-colors"
             >
                <Filter size={18} />
                {t('filters', 'Filters')}
             </button>
             <p className="text-sm font-medium text-muted-foreground hidden sm:block">{items.length} {t('itemsFoundSuffix', 'items found')}</p>
          </div>

          <div className="flex items-center bg-muted/50 p-1 rounded-lg">
            <button 
                onClick={() => setViewMode('grid')} 
                title={t('gridView', 'Grid View')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
                onClick={() => setViewMode('list')} 
                title={t('listView', 'List View')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {isLoading && <div className="flex justify-center mt-20"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}
        {error && <p className="text-red-500 text-center mt-20">{t('errorLoadingItems', 'Error loading items')}: {error.message}</p>}
        {!isLoading && !error && items.length === 0 && (
            <div className="text-center mt-20 text-muted-foreground">
                <p>{t('noItemsFoundMatching', 'No items found matching your criteria.')}</p>
            </div>
        )}

        <motion.div 
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6" 
            : "space-y-4"}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map(item => (
            <motion.div key={item.id} variants={itemVariants}>
              <ItemCard item={item} viewMode={viewMode} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}