import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Tag, MapPin, Edit, Trash2 } from 'lucide-react';
import FuturisticCard from '../futuristicCard/FuturisticCard';

export default function ItemCard({ item, showActions = false, onEdit, onDelete }) {
  const { t } = useLanguage();
  const { currency, convertCurrency } = useCurrency();

  const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  const handleEdit = (e) => {
    e.preventDefault();
    onEdit(item._id);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    onDelete(item._id);
  };

  return (
    <Link to={`/item/${item._id}`} className="block">
      <FuturisticCard className="h-full">
        <div className="relative">
          <img
            src={item.images?.[0] || `https://placehold.co/400x300/6366f1/white?text=${encodeURIComponent(item.title)}`}
            alt={t(item.title)}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 right-2 bg-background/50 text-foreground px-2 py-1 rounded-full text-sm font-semibold">
            {currencySymbol}{displayValue.toLocaleString()}
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold truncate text-foreground">{t(item.title)}</h3>          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <Tag className="w-4 h-4 mr-1" />
            <span className="capitalize">{t(item.condition)}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{item.location || t('notSpecified', 'Not specified')}</span>
          </div>
          {showActions && (
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={handleEdit} className="p-2 rounded-full hover:bg-muted">
                <Edit className="w-5 h-5 text-blue-400" />
              </button>
              <button onClick={handleDelete} className="p-2 rounded-full hover:bg-muted">
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </FuturisticCard>
    </Link>
  );
}
