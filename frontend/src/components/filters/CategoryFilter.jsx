import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, LayoutGrid, Search, ChevronLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState, useMemo } from 'react';

const Icon = ({ name, className }) => {
  // Convert kebab-case (e.g. "shopping-bag") to PascalCase (e.g. "ShoppingBag") for Lucide
  const iconName = name ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') : 'LayoutGrid';
  const LucideIcon = LucideIcons[iconName] || LucideIcons[name] || LayoutGrid;
  return <LucideIcon className={className} />;
};

export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMainCategory, setActiveMainCategory] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { mainCats, subCats } = useMemo(() => {
    const main = categories.filter(c => !c.parent && c.name !== 'services_main');
    const sub = categories.filter(c => c.parent);
    return { mainCats: main, subCats: sub };
  }, [categories]);

  // Handle Search Mode (Flattened list)
  if (searchTerm) {
      const filtered = categories.filter(cat => {
          const label = cat[`label_${language}`] || cat.label_en;
          return label?.toLowerCase().includes(searchTerm.toLowerCase());
      });

      return (
        <div className="mb-6">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <input 
                    type="text" 
                    placeholder={t('searchCategories', 'Search categories...')} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-muted/50 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                />
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Clear</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {filtered.map(cat => (
                    <button
                        key={cat._id}
                        onClick={() => { onSelectCategory(cat._id); setSearchTerm(''); }}
                        className="flex items-center space-x-2 px-4 py-2 bg-card border rounded-xl text-sm font-medium hover:bg-muted"
                    >
                        <Icon name={cat.icon} className="w-4 h-4"/>
                        <span>{cat[`label_${language}`] || cat.label_en}</span>
                    </button>
                ))}
                {filtered.length === 0 && <p className="text-sm text-muted-foreground p-2">No categories found.</p>}
            </div>
        </div>
      );
  }

  // Drill-Down UI
  const currentLevelCats = activeMainCategory 
      ? subCats.filter(c => c.parent === activeMainCategory)
      : mainCats;

  const handleCategoryClick = (cat) => {
      if (!activeMainCategory) {
          // If we are in Main View
          const hasChildren = subCats.some(sub => sub.parent === cat._id);
          if (hasChildren) {
              setActiveMainCategory(cat._id);
          } else {
              // It's a leaf node main category (rare in new structure, but possible)
              onSelectCategory(cat._id);
          }
      } else {
          // If we are in Sub View, select the category
          onSelectCategory(cat._id);
      }
  };

  const handleBack = () => {
      setActiveMainCategory(null);
  };

  const resetAll = () => {
      setActiveMainCategory(null);
      onSelectCategory('all');
  };

  if (isLoading) return <div className="h-12 flex items-center justify-center"><Loader2 className="animate-spin"/></div>

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-4 items-center">
        {activeMainCategory && (
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-muted bg-card border shadow-sm">
                <ChevronLeft className="w-5 h-5" />
            </button>
        )}
        
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input 
                type="text" 
                placeholder={t('searchCategories', 'Search categories...')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-muted/50 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
        </div>
      </div>
      
      {/* Breadcrumb / Title */}
      <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-lg">
              {activeMainCategory 
                ? (categories.find(c => c._id === activeMainCategory)?.[`label_${language}`] || 'Subcategories') 
                : t('categories', 'Categories')}
          </h3>
          {selectedCategory !== 'all' && (
              <button onClick={resetAll} className="text-xs text-primary hover:underline">
                  {t('viewAll', 'View All')}
              </button>
          )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* 'All' Tile - Only on Main View */}
        {!activeMainCategory && (
            <button
                onClick={resetAll}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all h-24 ${
                selectedCategory === 'all'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card hover:bg-muted/50 hover:border-primary/30'
                }`}
            >
                <LayoutGrid className="w-8 h-8 mb-2 opacity-70"/>
                <span className="text-xs font-semibold text-center leading-tight">{t('viewAll')}</span>
            </button>
        )}

        {currentLevelCats.map(cat => (
          <button
            key={cat._id}
            onClick={() => handleCategoryClick(cat)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all h-24 ${
              selectedCategory === cat._id
                ? 'bg-primary text-primary-content shadow-lg scale-105'
                : 'bg-card hover:bg-muted/50 hover:border-primary/30'
            }`}
          >
            <Icon name={cat.icon} className={`w-8 h-8 mb-2 ${selectedCategory === cat._id ? 'opacity-100' : 'opacity-70 text-primary'}`}/>
            <span className="text-xs font-semibold text-center leading-tight line-clamp-2">
                {cat[`label_${language}`] || cat.label_en}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
