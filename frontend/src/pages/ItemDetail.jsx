import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getItem, getCategories, getMe, getItems } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Loader2, Tag, MapPin, Repeat, CircleDollarSign, Sparkles, ChevronLeft, ArrowRight, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import TradeDeck from '../components/trade/TradeDeck';
import ItemCard from '../components/items/ItemCard';
import { toast } from 'sonner';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const [isTradeDeckOpen, setIsTradeDeckOpen] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('linkCopied', 'Link copied to clipboard!'));
    }
  };

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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: similarItemsResult } = useQuery({
    queryKey: ['items', 'similar', item?.category, id],
    queryFn: () => getItems({ category: item?.category, limit: 4, status: 'active' }),
    enabled: !!item?.category,
  });

  const similarItems = similarItemsResult?.items?.filter(i => i._id !== id) || [];

  const getCategoryName = (catId) => {
      const cat = categories.find(c => c._id === catId);
      if (cat) {
          return cat[`label_${language}`] || cat.label_en;
      }
      return t(catId);
  };

  const onTradeSubmit = (tradeData) => {
    console.log('Trade Submitted', tradeData);
    toast.success('Trade offer sent successfully!');
    setIsTradeDeckOpen(false);
  }

  const displayValue = currency === 'ILS' ? convertCurrency(item?.estimated_value || 0, 'USD', 'ILS') : item?.estimated_value || 0;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-20">Error: {error.message}</div>;
  }

  if (!item) {
    return <div className="text-center py-20">Item not found</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Navigation & Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border hover:bg-muted transition-all text-sm font-bold shadow-sm"
        >
          {dir === 'rtl' ? <ArrowRight size={18} /> : <ChevronLeft size={18} />}
          {t('back', 'Back')}
        </button>

        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border hover:bg-muted transition-all text-sm font-bold shadow-sm"
        >
          <Share2 size={18} className="text-primary" />
          {t('share', 'Share')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-white/10">
            <img src={item.images?.[0] || 'https://via.placeholder.com/600x400'} alt={item.title} className="w-full h-auto object-cover max-h-[600px]" />
          </div>

          {/* Description Section */}
          <div className="bg-card rounded-3xl shadow-xl p-8 border border-white/10">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
               <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
               {t('description', 'Description')}
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Item Info Card */}
          <div className="bg-card rounded-3xl shadow-xl p-8 border border-white/10 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16"></div>
            
            <div className="relative">
                {item.open_to_other_offers && (
                    <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-black animate-pulse mb-4 border border-primary/20">
                        <Sparkles size={14} /> {t('openToOtherOffers')}
                    </div>
                )}
                
                <h1 className="text-4xl font-black mb-2 text-foreground">{item.title}</h1>
                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black text-primary">{currencySymbol}{displayValue.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('estimatedValue')}</span>
                </div>
                
                <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-2xl">
                        <div className="flex items-center text-sm font-bold text-muted-foreground uppercase tracking-tighter">
                            <Tag className="w-4 h-4 mr-2" /> {t('condition')}
                        </div>
                        <span className="text-sm font-black capitalize text-foreground">{t(item.condition)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-2xl">
                        <div className="flex items-center text-sm font-bold text-muted-foreground uppercase tracking-tighter">
                            <MapPin className="w-4 h-4 mr-2" /> {t('location')}
                        </div>
                        <span className="text-sm font-black text-foreground">{item.location}</span>
                    </div>

                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <div className="flex items-center text-xs font-black text-blue-400 uppercase tracking-widest mb-2">
                            <Repeat className="w-3 h-3 mr-1" /> {t('lookingFor')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {item.looking_for?.length > 0 
                                ? item.looking_for.map(val => (
                                    <span key={val} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold">
                                        {getCategoryName(val)}
                                    </span>
                                  )) 
                                : <span className="text-blue-300 text-sm font-bold">{t('Anything')}</span>
                            }
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <div className="flex items-center text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">
                            <CircleDollarSign className="w-3 h-3 mr-1" /> {t('cashFlexibility')}
                        </div>
                        <span className="text-sm font-black text-emerald-300">{t(item.cash_flexibility)}</span>
                    </div>
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
                    className="mt-8 w-full bg-primary text-primary-content font-black py-4 rounded-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 text-lg"
                >
                    {t('makeOffer')}
                </button>
            </div>
          </div>
          
          {/* User Info Placeholder/Preview */}
          <div className="bg-card rounded-3xl shadow-xl p-6 border border-white/10 flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-black">
                {(item.seller_full_name?.[0] || item.user?.name?.[0] || 'U')}
             </div>
             <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t('owner', 'Owner')}</p>
                <h3 className="text-xl font-black text-foreground">{item.seller_full_name || item.user?.name || 'User'}</h3>
             </div>
          </div>

        </div>
      </div>

      {/* Similar Items Section */}
      {similarItems.length > 0 && (
        <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {t('similarItems', 'Similar Items')}
                    </h2>
                    <p className="text-muted-foreground">{t('moreInThisCategory', 'More in this category')}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {similarItems.map(similarItem => (
                    <ItemCard key={similarItem._id} item={similarItem} />
                ))}
            </div>
        </div>
      )}

      <TradeDeck 
        isOpen={isTradeDeckOpen} 
        onClose={() => setIsTradeDeckOpen(false)} 
        targetItem={{
            ...item,
            receiver_email: item.created_by?.email
        }} 
        onSubmit={onTradeSubmit} 
      />
    </div>
  );
}
