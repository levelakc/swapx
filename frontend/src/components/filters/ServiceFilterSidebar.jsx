import { useLanguage } from '../../contexts/LanguageContext';
import { X } from 'lucide-react';

export default function ServiceFilterSidebar({ filters, onFilterChange, isOpen, onClose }) {
  const { t } = useLanguage();

  const handleSliderChange = (e) => {
    onFilterChange({ ...filters, priceRange: [filters.priceRange[0], parseInt(e.target.value)] });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-background border-r p-6 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-0 lg:h-[calc(100vh-6rem)] lg:sticky lg:top-24 lg:border-r
        overflow-y-auto
      `}>
        <div className="flex justify-between items-center lg:hidden mb-4">
          <h3 className="text-lg font-semibold">{t('filters')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">{t('hourlyRate')}</h4>
          <input 
            type="range" 
            min="0" 
            max="500" 
            step="10"
            value={filters.priceRange[1]} 
            onChange={handleSliderChange}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground mt-1">{t('upTo')} ${filters.priceRange[1]} / hr</div>
        </div>

        <div>
           <h4 className="font-semibold mb-2">{t('location')}</h4>
           <input 
              type="text"
              placeholder={t('locationPlaceholder')}
              value={filters.location}
              onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
              className="w-full bg-input p-2 rounded-md"
            />
        </div>

        <button 
          onClick={() => onFilterChange({ priceRange: [0, 500], location: '' })}
          className="w-full py-2 bg-secondary text-secondary-content rounded-md"
        >
          {t('clearAll')}
        </button>
      </div>
    </aside>
    </>
  );
}
