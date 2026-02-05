import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getService, getMe, getReviews, addReview } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Loader2, MapPin, Clock, User, Briefcase, DollarSign, Globe, Instagram, Facebook, Map, Star, Send } from 'lucide-react';
import { useState } from 'react';
import TradeDeck from '../components/trade/TradeDeck';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isTradeDeckOpen, setIsTradeDeckOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => getService(id),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getReviews(id),
    enabled: !!service,
  });

  const reviewMutation = useMutation({
    mutationFn: addReview,
    onSuccess: () => {
        toast.success('Review added');
        setComment('');
        queryClient.invalidateQueries(['reviews', id]);
    },
    onError: (err) => toast.error(err.message)
  });

  const handleAddReview = (e) => {
      e.preventDefault();
      if (!user) return toast.error('Login to review');
      reviewMutation.mutate({ service_id: id, rating, comment });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  if (!service) {
    return <div className="text-center">Service not found</div>;
  }

  const onTradeSubmit = (tradeData) => {
    console.log('Trade Submitted', tradeData);
    toast.success('Service offer sent successfully!');
    setIsTradeDeckOpen(false);
  }

  const displayRate = currency === 'ILS' ? convertCurrency(service.hourly_rate, 'USD', 'ILS') : service.hourly_rate;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="bg-background rounded-2xl shadow-lg overflow-hidden border border-border">
            <img src={service.images?.[0] || 'https://via.placeholder.com/800x500'} alt={service.title} className="w-full h-[400px] object-cover" />
          </div>
          
          {/* Description */}
          <div className="bg-background rounded-2xl shadow-lg p-8 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Briefcase size={20}/> {t('description')}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{service.description}</p>
            
            {/* Social Links */}
            <div className="mt-8 flex gap-4">
                {service.website && <a href={service.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe size={18}/> Website</a>}
                {service.social_instagram && <a href={`https://instagram.com/${service.social_instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-pink-500 hover:underline"><Instagram size={18}/> Instagram</a>}
                {service.social_facebook && <a href={service.social_facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline"><Facebook size={18}/> Facebook</a>}
                {service.google_reviews_link && <a href={service.google_reviews_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-green-600 hover:underline"><Map size={18}/> Google Reviews</a>}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-background rounded-2xl shadow-lg p-8 border border-border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Star size={20}/> Reviews ({reviews.length})</h2>
            
            <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review._id} className="border-b border-border pb-4 last:border-0">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <img src={review.reviewer.avatar || `https://avatar.vercel.sh/${review.reviewer.full_name}.svg`} className="w-8 h-8 rounded-full"/>
                                <span className="font-semibold text-sm">{review.reviewer.full_name}</span>
                            </div>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}
                            </div>
                        </div>
                        <p className="mt-2 text-muted-foreground text-sm">{review.comment}</p>
                    </div>
                ))}
                {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
            </div>

            {user && (
                <form onSubmit={handleAddReview} className="mt-8 pt-6 border-t border-border">
                    <h3 className="font-bold mb-4">Write a Review</h3>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button type="button" key={star} onClick={() => setRating(star)} className={`text-yellow-400 ${rating >= star ? 'fill-current' : 'text-gray-300'}`}>
                                <Star size={24} fill={rating >= star ? "currentColor" : "none"}/>
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            value={comment} 
                            onChange={e => setComment(e.target.value)} 
                            placeholder="Share your experience..." 
                            className="flex-1 bg-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                        <button type="submit" disabled={reviewMutation.isLoading} className="bg-primary text-primary-content p-2 rounded-lg">
                            {reviewMutation.isLoading ? <Loader2 className="animate-spin"/> : <Send size={20}/>}
                        </button>
                    </div>
                </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-background rounded-2xl shadow-lg p-6 border border-border sticky top-24">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{service.title}</h1>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <User size={16} />
                        <span>{service.provider_name}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-primary">{currencySymbol}{displayRate.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t('perHour')}</p>
                </div>
            </div>

            <div className="space-y-4 py-6 border-t border-b border-border">
                <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg"><MapPin size={18}/></div>
                    <div>
                        <p className="font-medium">{t('location')}</p>
                        <p className="text-muted-foreground">{service.location}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg"><Clock size={18}/></div>
                    <div>
                        <p className="font-medium">{t('availability')}</p>
                        <p className="text-muted-foreground">{service.availability || 'Flexible'}</p>
                    </div>
                </div>
            </div>

            <button 
              onClick={() => {
                if (!user) {
                    toast.error(t('loginToTrade', 'Please log in to make an offer.'));
                    navigate('/login');
                    return;
                }
                setIsTradeDeckOpen(true);
              }}
              className="mt-6 w-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2"
            >
              <DollarSign size={20} />
              {t('makeOffer', 'Make Offer')}
            </button>
          </div>
        </div>
      </div>
      
      {/* 
         TODO: TradeDeck needs update to handle Service object. 
         Currently it expects item.estimated_value. Service has hourly_rate.
         I will pass a normalized object to TradeDeck or update TradeDeck.
      */}
      <TradeDeck 
        isOpen={isTradeDeckOpen} 
        onClose={() => setIsTradeDeckOpen(false)} 
        targetItem={{
            ...service,
            estimated_value: service.hourly_rate, // Map for compatibility
            is_service: true // Flag for TradeDeck
        }} 
        onSubmit={onTradeSubmit} 
      />
    </div>
  );
}
