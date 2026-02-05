import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, LayoutGrid, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';

const Icon = ({ name, ...props }) => {
  const LucideIcon = LucideIcons[name] || LayoutGrid;
  return <LucideIcon {...props} />;
};

export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const allCategories = [
    { _id: 'all', name: 'all', icon: 'LayoutGrid', label_en: t('viewAll') },
    ...categories
  ];

  const filteredCategories = allCategories.filter(cat => {
      const label = cat[`label_${language}`] || cat.label_en;
      return label?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) return <div className="h-12 flex items-center justify-center"><Loader2 className="animate-spin"/></div>

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
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filteredCategories.map(cat => (
          <button
            key={cat._id}
            onClick={() => onSelectCategory(cat._id === 'all' ? 'all' : cat._id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === (cat._id === 'all' ? 'all' : cat._id)
                ? 'bg-primary text-primary-content shadow-md'
                : 'bg-card border hover:border-primary/50 hover:bg-muted'
            }`}
          >
            <Icon name={cat.icon || 'Package'} className="w-4 h-4"/>
            <span>{cat[`label_${language}`] || cat.label_en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
