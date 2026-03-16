import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getItems } from '../api/api';
import ItemCard from '../components/items/ItemCard';
import CategoryFilter from '../components/filters/CategoryFilter';
import FilterSidebar from '../components/filters/FilterSidebar';
import { Loader2, LayoutGrid, List, Filter, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Browse({ listingType = 'item' }) {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  
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
    keyword: searchParams.get('keyword') || '',
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

  const setCategoryCookie = (category) => {
    if (category && category !== 'all') {
      document.cookie = `last_category_search=${category}; path=/; max-age=${60 * 60 * 24 * 7}`; // 1 week
    }
  };

  useEffect(() => {
    if (selectedCategory !== 'all') {
      setCategoryCookie(selectedCategory);
    }
  }, [selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (keyword) {
        newParams.set('keyword', keyword);
    } else {
        newParams.delete('keyword');
    }
    setSearchParams(newParams);
  };

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
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-card p-6 rounded-xl shadow-sm border">
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {t('browseItems')}
                </h1>
                <p className="text-muted-foreground mt-1">{t('browseItemsSubtitle', 'Discover unique items to trade')}</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto items-center">
                <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input 
                        type="text" 
                        placeholder={t('searchItems')} 
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