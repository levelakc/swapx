import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { MapPin, Clock, User, Calendar } from 'lucide-react';
import FuturisticCard from '../futuristicCard/FuturisticCard';
import ImageWithFallback from '../common/ImageWithFallback';

export default function ServiceCard({ service }) {
  const { t } = useLanguage();
  const { currency, convertCurrency } = useCurrency();

  const displayRate = currency === 'ILS' ? convertCurrency(service.hourly_rate, 'USD', 'ILS') : service.hourly_rate;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <Link to={`/service/${service._id}`} target="_blank" rel="noopener noreferrer" className="block h-full">
      <FuturisticCard className="h-full">
        <div className="flex flex-col h-full">
          <div className="relative w-full h-48">
            <ImageWithFallback
              src={service.images?.[0]}
              alt={service.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground px-2 py-1 rounded-full text-xs font-bold border border-white/10 shadow-lg">
              {currencySymbol}{displayRate.toLocaleString()}{t('perHour')}
            </div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden border border-primary/20">
                  {service.provider_avatar ? (
                    <ImageWithFallback src={service.provider_avatar} alt="P" className="w-full h-full object-cover"/>
                  ) : (
                    service.provider_name?.[0] || 'P'
                  )}
               </div>
               <span className="text-[11px] font-bold text-muted-foreground truncate">{service.provider_name}</span>
            </div>
            
            <h3 className="text-lg font-bold truncate text-foreground mb-3">{service.title}</h3>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-auto mb-4">
              <div className="flex items-center text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0 text-primary" />
                <span className="truncate">{service.location}</span>
              </div>
              <div className="flex items-center text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3 mr-1 flex-shrink-0 text-primary" />
                <span className="truncate">{service.availability || t('flexible')}</span>
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-white/5">
                <div className="w-full py-2 bg-primary/10 text-primary rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-primary/20">
                    <Calendar size={14} /> {t('scheduleDate')}
                </div>
            </div>
          </div>
        </div>
      </FuturisticCard>
    </Link>
  );
}
