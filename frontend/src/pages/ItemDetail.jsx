import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getItem, getCategories, getMe } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext'; // Updated import path
import { useCurrency } from '../contexts/CurrencyContext';
import { Loader2, Tag, MapPin, Repeat, CircleDollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import TradeDeck from '../components/trade/TradeDeck';
import { toast } from 'sonner';


export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const [isTradeDeckOpen, setIsTradeDeckOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id),
  });

  useEffect(() => {
    if (item && item.category) {
      document.cookie = `last_category_search=${item.category}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
  }, [item]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  if (!item) {
    return <div className="text-center">Item not found</div>;
  }

  const getCategoryName = (catId) => {
      const cat = categories.find(c => c._id === catId);
      if (cat) {
          return cat[`label_${language}`] || cat.label_en;
      }
      return t(catId); // Fallback if category not found or it's a legacy string
  };

  const onTradeSubmit = (tradeData) => {
    // This should be a mutation
    console.log('Trade Submitted', tradeData);
    toast.success('Trade offer sent successfully!');
    setIsTradeDeckOpen(false);
    // navigate to messages page maybe?
  }

  const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Image Carousel */}
          <div className="bg-background rounded-lg shadow-lg overflow-hidden">
            <img src={item.images?.[0] || 'https://via.placeholder.com/600x400'} alt={item.title} className="w-full h-auto object-cover" />
          </div>
        </div>
        <div>
          {/* Item Info */}
          <div className="bg-background rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
            <p className="text-2xl font-bold text-primary mb-4">{currencySymbol}{displayValue.toLocaleString()}</p>
            <p className="text-muted-foreground mb-6">{item.description}</p>
            
            <div className="space-y-3 text-sm">
                <div className="flex items-center"><Tag className="w-4 h-4 mr-2 text-muted-foreground"/><strong>{t('condition')}:</strong><span className="ml-2 capitalize">{t(item.condition)}</span></div>
                <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-muted-foreground"/><strong>{t('location')}:</strong><span className="ml-2">{item.location}</span></div>
                <div className="flex items-center"><Repeat className="w-4 h-4 mr-2 text-muted-foreground"/><strong>{t('lookingFor')}:</strong><span className="ml-2">{item.looking_for?.length > 0 ? item.looking_for.map(val => getCategoryName(val)).join(', ') : t('Anything')}</span></div>
                <div className="flex items-center"><CircleDollarSign className="w-4 h-4 mr-2 text-muted-foreground"/><strong>{t('cashFlexibility')}:</strong><span className="ml-2">{t(item.cash_flexibility)}</span></div>
            </div>

            <button 
              onClick={() => {
                if (!user) {
                    toast.error(t('loginToTrade', 'Please log in to make a trade offer.'));
                    navigate('/login');
                    return;
                }
                setIsTradeDeckOpen(true);
              }}
              className="mt-6 w-full bg-primary text-primary-content font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('makeOffer')}
            </button>
          </div>
        </div>
      </div>
      <TradeDeck isOpen={isTradeDeckOpen} onClose={() => setIsTradeDeckOpen(false)} targetItem={item} onSubmit={onTradeSubmit} />
    </div>
  );
}
