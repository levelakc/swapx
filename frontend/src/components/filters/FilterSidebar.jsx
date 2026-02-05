import { useLanguage } from '../../contexts/LanguageContext';
import { X } from 'lucide-react';

export default function FilterSidebar({ filters, onFilterChange, isOpen, onClose }) {
  const { t } = useLanguage();

  const handleSliderChange = (e) => {
    onFilterChange({ ...filters, priceRange: [filters.priceRange[0], parseInt(e.target.value)] });
  };
  
  const handleCheckboxChange = (group, value) => {
    const currentValues = filters[group];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange({ ...filters, [group]: newValues });
  };

  const conditionOptions = ['new', 'like_new', 'excellent', 'good', 'fair'];
  const cashOptions = ['willing_to_add', 'willing_to_receive', 'both', 'trade_only'];

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
          <h3 className="text-lg font-semibold">{t('filters', 'Filters')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">{t('priceRange')}</h4>
          <input 
            type="range" 
            min="0" 
            max="1000000" 
            value={filters.priceRange[1]} 
            onChange={handleSliderChange}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground mt-1">{t('upTo')} ${filters.priceRange[1].toLocaleString()}</div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">{t('condition')}</h4>
          <div className="space-y-2">
            {conditionOptions.map(opt => (
              <label key={opt} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={filters.conditions.includes(opt)}
                  onChange={() => handleCheckboxChange('conditions', opt)}
                  className="form-checkbox h-4 w-4 text-primary rounded"
                />
                <span>{t(opt)}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">{t('cashFlexibility')}</h4>
          <div className="space-y-2">
            {cashOptions.map(opt => (
              <label key={opt} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={filters.cashOptions.includes(opt)}
                  onChange={() => handleCheckboxChange('cashOptions', opt)}
                  className="form-checkbox h-4 w-4 text-primary rounded"
                />
                <span>{t(opt)}</span>
              </label>
            ))}
          </div>
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
          onClick={() => onFilterChange({ priceRange: [0, 1000000], conditions: [], cashOptions: [], location: '' })}
          className="w-full py-2 bg-secondary text-secondary-content rounded-md"
        >
          {t('clearAll')}
        </button>
      </div>
    </aside>
    </>
  );
}
