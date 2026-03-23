import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, MapPin, Repeat, CircleDollarSign, Sparkles, ChevronLeft, ChevronRight, Package, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/api';
import ImageWithFallback from '../common/ImageWithFallback';

const ItemDetailsModal = ({ isOpen, onClose, item }) => {
  const { t, language, dir } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !!item?.looking_for?.length
  });

  if (!item) return null;

  const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  const getCategoryLabel = (cat) => {
    if (typeof cat === 'object' && cat !== null) {
      return cat[`label_${language}`] || cat.label_en || cat.name;
    }
    // If it's an ID, find it in the categories list
    const found = categories.find(c => c._id === cat);
    if (found) {
      return found[`label_${language}`] || found.label_en || found.name;
    }
    return cat; // Fallback to ID if not found
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (item.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (item.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[750] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-slate-950 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 dark"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col lg:flex-row h-full overflow-y-auto">
              {/* Image Gallery */}
              <div className="lg:w-1/2 relative bg-black flex items-center justify-center min-h-[300px] lg:min-h-0">
                {item.images && item.images.length > 0 ? (
                  <>
                    <ImageWithFallback 
                      src={item.images[currentImageIndex]} 
                      alt={item.title} 
                      className="w-full h-full object-contain"
                    />
                    {item.images.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                          {item.images.map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-primary w-4' : 'bg-white/40'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground opacity-20">
                    <Package size={80} />
                    <p className="font-black uppercase tracking-widest mt-4">No Image</p>
                  </div>
                )}
              </div>

              {/* Details Content */}
              <div className="lg:w-1/2 p-6 md:p-8 space-y-6 flex flex-col">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                      {t('item', 'Item')}
                    </span>
                    <span className="px-3 py-1 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-full">
                      {t(item.condition)}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-tight text-foreground">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-2 text-primary font-black text-2xl">
                    <CircleDollarSign size={24} />
                    <span>{currencySymbol}{displayValue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('description')}</h4>
                    <p className="text-sm font-bold text-foreground leading-relaxed whitespace-pre-wrap">
                      {item.description || t('noDescription', 'No description provided.')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{t('location')}</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <MapPin size={14} className="text-primary" />
                        <span>{item.location || t('notSpecified')}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{t('cashFlexibility')}</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <CircleDollarSign size={14} className="text-primary" />
                        <span>{t(item.cash_flexibility)}</span>
                      </div>
                    </div>
                  </div>

                  {item.looking_for?.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('lookingFor')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.looking_for.map((cat, i) => (
                          <span key={i} className="px-3 py-1 bg-muted rounded-lg text-[10px] font-bold text-foreground border border-border">
                            {getCategoryLabel(cat)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ItemDetailsModal;
