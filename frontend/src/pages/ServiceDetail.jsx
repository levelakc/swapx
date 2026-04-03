import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getService, getMe, getReviews, addReview, createConversation } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Loader2, MapPin, Clock, User, Briefcase, DollarSign, Globe, Instagram, Facebook, Map, Star, Send, Calendar, ChevronLeft, ArrowRight, Share2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { showToast } from '../Layout';
import ImageWithFallback from '../components/common/ImageWithFallback';
import AuthModal from '../components/common/AuthModal';
import ImageGallery from '../components/common/ImageGallery';
import SEO from '../components/common/SEO';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleShare = async () => {
    // ... rest of handleShare
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.title,
          text: service.description,
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
    queryFn: getReviews(id),
    enabled: !!service,
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

  const handleSchedule = () => {
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    
    // Prevent self-chat
    const providerId = service.provider?._id || service.provider;
    if (user._id === providerId) {
        showToast(t('cannotChatSelf'), 'error');
        return;
    }

    const providerEmail = service.provider?.email || service.provider_email;
    if (!providerEmail) {
        showToast(t('participantNotFound'), 'error');
        return;
    }

    conversationMutation.mutate({
        participant_email: providerEmail,
        related_item_id: null // Or service info if needed, but backend expects item_id
    });
  };

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
    return <div className="text-center text-red-500 py-20">Error: {error.message}</div>;
  }

  if (!service) {
    return <div className="text-center py-20">Service not found</div>;
  }

  const displayRate = currency === 'ILS' ? convertCurrency(service.hourly_rate, 'USD', 'ILS') : service.hourly_rate;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  const displayTitle = service.title_translations?.[language] || service.title;
  const displayDescription = service.description_translations?.[language] || service.description;

  const jsonLd = service ? {
    "@context": "https://schema.org/",
    "@type": "Service",
    "serviceType": service.category,
    "provider": {
      "@type": "Person",
      "name": service.provider_name
    },
    "description": displayDescription,
    "name": displayTitle,
    "image": service.images,
    "offers": {
      "@type": "Offer",
      "priceCurrency": currency === 'ILS' ? 'ILS' : 'USD',
      "price": displayRate
    },
    "aggregateRating": reviews.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length,
      "reviewCount": reviews.length
    } : undefined
  } : null;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <SEO 
        title={service.title}
        description={service.description?.substring(0, 160)}
        ogImage={service.images?.[0]}
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
            <ImageGallery images={service.images} title={displayTitle} />
          </div>
          
          {/* Description */}
          <div className="bg-card rounded-3xl shadow-xl p-8 border border-white/10">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
               <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
               {t('description', 'Description')}
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{displayDescription}</p>
            
            {/* Social Links */}
            <div className="mt-8 flex flex-wrap gap-4">
                {service.website && <a href={service.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl text-primary hover:bg-secondary transition-all font-bold text-sm"><Globe size={18}/> {t('website', 'Website')}</a>}
                {service.social_instagram && <a href={`https://instagram.com/${service.social_instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl text-pink-500 hover:bg-secondary transition-all font-bold text-sm"><Instagram size={18}/> {t('instagram', 'Instagram')}</a>}
                {service.social_facebook && <a href={service.social_facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl text-blue-600 hover:bg-secondary transition-all font-bold text-sm"><Facebook size={18}/> {t('facebook', 'Facebook')}</a>}
                {service.google_reviews_link && <a href={service.google_reviews_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl text-green-600 hover:bg-secondary transition-all font-bold text-sm"><Map size={18}/> {t('googleReviews', 'Google Reviews')}</a>}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-card rounded-3xl shadow-xl p-8 border border-white/10">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <Star size={24} className="text-yellow-400 fill-current"/> 
                {t('reviews', 'Reviews')} ({reviews.length})
            </h2>
            
            <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review._id} className="bg-secondary/20 p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 shrink-0">
                                    <ImageWithFallback 
                                        src={review.reviewer.avatar || `https://avatar.vercel.sh/${review.reviewer.full_name}.svg`} 
                                        className="w-full h-full rounded-full border-2 border-primary/20 object-cover" 
                                        alt={review.reviewer.full_name}
                                    />
                                </div>
                                <div>
                                    <span className="font-bold block">{review.reviewer.full_name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-black">{t('verifiedClient', 'Verified Client')}</span>
                                </div>
                            </div>
                            <div className="flex text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed italic">"{review.comment}"</p>
                    </div>
                ))}
                {reviews.length === 0 && <p className="text-muted-foreground italic">{t('noReviewsYet', 'No reviews yet. Be the first to share your experience!')}</p>}
            </div>

            {user && (
                <form onSubmit={handleAddReview} className="mt-10 pt-8 border-t border-white/5">
                    <h3 className="text-lg font-black mb-4">{t('writeAReview', 'Write a Review')}</h3>
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button type="button" key={star} onClick={() => setRating(star)} className={`transition-all hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-muted-foreground/30'}`}>
                                <Star size={32} fill={rating >= star ? "currentColor" : "none"}/>
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <textarea 
                            value={comment} 
                            onChange={e => setComment(e.target.value)} 
                            placeholder={t('shareExperience', 'Share your experience...')} 
                            className="w-full bg-secondary/30 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary border-transparent text-foreground"
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={reviewMutation.isLoading} 
                            className="absolute bottom-4 right-4 bg-primary text-primary-content p-3 rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {reviewMutation.isLoading ? <Loader2 className="animate-spin"/> : <Send size={20}/>}
                        </button>
                    </div>
                </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-card rounded-3xl shadow-xl p-8 border border-white/10 sticky top-24">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground mb-2">{displayTitle}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
                            <User size={14} />
                        </div>
                        <span>{service.provider_name}</span>
                    </div>
                </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 mb-8 border border-primary/10">
                <p className="text-4xl font-black text-primary mb-1">{currencySymbol}{displayRate.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{t('hourlyRate')}</p>
            </div>

            <div className="space-y-4 py-6 border-t border-white/5">
                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-secondary/50 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-content transition-all"><MapPin size={20}/></div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">{t('location')}</p>
                        <p className="font-bold text-foreground">{service.location}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-secondary/50 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-content transition-all"><Clock size={20}/></div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">{t('availability')}</p>
                        <p className="font-bold text-foreground">{service.availability || t('flexible')}</p>
                    </div>
                </div>
            </div>

            <button 
              onClick={handleSchedule}
              disabled={conversationMutation.isLoading}
              className="mt-8 w-full bg-primary text-primary-content font-black py-4 rounded-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-95 disabled:opacity-50"
            >
              {conversationMutation.isLoading ? <Loader2 className="animate-spin" /> : <MessageCircle size={22} />}
              {t('scheduleDate')}
            </button>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
            queryClient.invalidateQueries(['user', 'me']);
            handleSchedule();
        }}
      />
    </div>
  );
}
