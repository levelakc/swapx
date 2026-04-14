import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItem, getCategories, getMe, getItems, createConversation } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Loader2, Tag, MapPin, Repeat, CircleDollarSign, Sparkles, ChevronLeft, ArrowRight, Share2, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import TradeDeck from '../components/trade/TradeDeck';
import ItemCard from '../components/items/ItemCard';
import { toast } from 'sonner';
import { showToast } from '../Layout';
import ImageWithFallback from '../components/common/ImageWithFallback';
import AuthModal from '../components/common/AuthModal';
import ImageGallery from '../components/common/ImageGallery';
import SEO from '../components/common/SEO';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language, dir } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const [isTradeDeckOpen, setIsTradeDeckOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  const conversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (data) => {
        navigate('/messages', { state: { openChatId: data._id } });
    },
    onError: (err) => {
        const msg = err.message === 'Other participant not found' ? t('participantNotFound') : (t(err.message) || t('authFailed'));
        showToast(msg, 'error');
    }
  });

  const handleChat = () => {
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    
    // Prevent self-chat
    const itemOwnerId = item.created_by?._id || item.user?._id || item.user;
    if (user._id === itemOwnerId) {
        showToast(t('cannotChatSelf'), 'error');
        return;
    }

    const itemOwnerEmail = item.created_by?.email || item.seller_email; // Seller email might be needed
    if (!itemOwnerEmail) {
        showToast(t('participantNotFound'), 'error');
        return;
    }

    conversationMutation.mutate({
        participant_email: itemOwnerEmail,
        related_item_id: item._id
    });
  };

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
    setIsTradeDeckOpen(false);
  }

  const displayValue = currency === 'ILS' ? convertCurrency(item?.estimated_value || 0, 'USD', 'ILS') : item?.estimated_value || 0;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  const displayTitle = item?.title_translations?.[language] || item?.title;
  const displayDescription = item?.description_translations?.[language] || item?.description;

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-20">Error: {error.message}</div>;
  }

  if (!item) {
    return <div className="text-center py-20">Item not found</div>;
  }

  const jsonLd = item ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": displayTitle,
    "image": item.images,
    "description": displayDescription,
    "brand": {
      "@type": "Brand",
      "name": "Ahlafot"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": currency === 'ILS' ? 'ILS' : 'USD',
      "price": displayValue,
      "itemCondition": `https://schema.org/${item.condition === 'new' ? 'NewCondition' : 'UsedCondition'}`,
      "availability": "https://schema.org/InStock"
    }
  } : null;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <SEO 
        title={displayTitle}
        description={displayDescription?.substring(0, 160)}
        ogImage={item.images?.[0]}
        ogType="product"
        jsonLd={jsonLd}
      />
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
          {/* Image Gallery Slider */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-white/10 aspect-video">
            <ImageGallery images={item.images} title={displayTitle} />
          </div>

          {/* Description Section */}
          <div className="bg-card rounded-3xl shadow-xl p-8 border border-white/10">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
               <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
               {t('description', 'Description')}
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{displayDescription}</p>
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
                
                <h1 className="text-4xl font-black mb-2 text-foreground">{displayTitle}</h1>
                
                {item.brand && (
                    <div className="mb-4">
                         <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs font-black uppercase tracking-widest border border-white/5">
                            {item.brand}
                         </span>
                    </div>
                )}

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

                <div className="grid grid-cols-1 gap-3 mt-8">
                    <button 
                        onClick={() => {
                            if (!user) {
                                setIsAuthModalOpen(true);
                                return;
                            }
                            
                            const itemOwnerId = item.created_by?._id || item.user?._id || item.user;
                            if (user._id === itemOwnerId) {
                                toast.error(t('cannotOfferToSelf', 'You cannot make an offer on your own item!'));
                                return;
                            }
                            
                            setIsTradeDeckOpen(true);
                        }}
                        className="w-full bg-primary text-primary-content font-black py-4 rounded-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
                    >
                        {t('makeOffer')}
                    </button>
                    
                    <button 
                        onClick={handleChat}
                        disabled={conversationMutation.isLoading}
                        className="w-full bg-secondary text-secondary-foreground font-black py-4 rounded-2xl hover:bg-secondary/80 transition-all active:scale-95 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {conversationMutation.isLoading ? <Loader2 className="animate-spin" /> : <MessageCircle size={22} />}
                        {t('chatWithUser', 'Chat with Owner')}
                    </button>
                </div>
            </div>
          </div>
          
          {/* User Info / Owner Card */}
          <Link 
            to={`/profile/${item.created_by?._id || item.user?._id || item.user}`}
            className="bg-card rounded-3xl shadow-xl p-6 border border-white/10 flex items-center gap-4 hover:border-primary/30 transition-all group"
          >
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-black group-hover:scale-105 transition-transform">
                {item.created_by?.avatar ? (
                    <ImageWithFallback src={item.created_by.avatar} alt="A" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                    (item.seller_full_name?.[0] || item.user?.name?.[0] || 'U')
                )}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t('owner', 'Owner')}</p>
                <h3 className="text-xl font-black text-foreground truncate group-hover:text-primary transition-colors">{item.seller_full_name || item.created_by?.full_name || item.user?.name || 'User'}</h3>
                <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{t('viewProfile', 'View Profile')}</p>
             </div>
             <ArrowRight size={20} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
          </Link>

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

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
            queryClient.invalidateQueries(['user', 'me']);
            // Check which action was intended? For now just handle chat if that was last clicked
            // or just let them click again.
        }}
      />
    </div>
  );
}
