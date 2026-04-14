import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Tag, MapPin, Edit, Trash2, Repeat, CircleDollarSign, Sparkles } from 'lucide-react';
import FuturisticCard from '../futuristicCard/FuturisticCard';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/api';
import ImageWithFallback from '../common/ImageWithFallback';

export default function ItemCard({ item, showActions = false, onEdit, onDelete, viewMode = 'grid' }) {
  const { t, language } = useLanguage();
  const { currency, convertCurrency } = useCurrency();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c._id === catId);
    if (cat) {
        return cat[`label_${language}`] || cat.label_en;
    }
    return t(catId);
  };

  const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  const displayTitle = item.title_translations?.[language] || item.title || 'No Title';

  const handleEdit = (e) => {
    e.preventDefault();
    onEdit(item._id);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    onDelete(item._id);
  };

  const isList = viewMode === 'list';

  return (
    <Link to={`/item/${item._id}`} className="block h-full">
      <FuturisticCard className="h-full">
        <div className={`flex ${isList ? 'flex-row' : 'flex-col'} h-full`}>
          <div className={`relative ${isList ? 'w-48 h-48 flex-shrink-0' : 'w-full h-48'}`}>
            <ImageWithFallback
              src={item.images?.[0]}
              alt={t(item.title)}
              className="w-full h-full object-cover rounded-t-lg"
            />
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground px-2 py-1 rounded-full text-xs font-bold border border-white/10 shadow-lg">
              {currencySymbol}{displayValue.toLocaleString()}
            </div>
            {item.open_to_other_offers && (
               <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-content px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg">
                  <Sparkles size={10} /> {t('openToOtherOffers')}
               </div>
            )}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {!item.is_visible && (
                <div className="bg-red-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                  {t('hidden', 'Hidden')}
                </div>
              )}
              {!item.is_available && (
                <div className="bg-amber-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                  {t('unavailable', 'Unavailable')}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-1 min-w-0">
               <h3 className="text-lg font-bold truncate text-foreground flex-1">{displayTitle}</h3>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                    item.brand 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                    {item.brand || t('unbranded', 'Unbranded')}
                </span>
                {item.brand && (
                    <span className="w-1 h-1 rounded-full bg-border" />
                )}
                <span className="text-[10px] font-bold text-muted-foreground truncate capitalize">
                    {t(item.condition)}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-auto">
              <div className="flex items-center text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
              <div className="flex items-center text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{item.location || t('notSpecified')}</span>
              </div>
              <div className="flex items-center text-[11px] text-blue-400 font-medium">
                <Repeat className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {item.looking_for?.length > 0 
                    ? item.looking_for.map(id => getCategoryName(id)).join(', ')
                    : t('Anything')}
                </span>
              </div>
              <div className="flex items-center text-[11px] text-emerald-400 font-medium">
                <CircleDollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{t(item.cash_flexibility)}</span>
              </div>
            </div>

            {showActions && (
              <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-white/5">
                <button onClick={handleEdit} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <Edit className="w-4 h-4 text-blue-400" />
                </button>
                <button onClick={handleDelete} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </FuturisticCard>
    </Link>
  );
}
