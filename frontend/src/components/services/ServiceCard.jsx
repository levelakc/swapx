import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { MapPin, Clock, User } from 'lucide-react';
import FuturisticCard from '../futuristicCard/FuturisticCard';

export default function ServiceCard({ service }) {
  const { t } = useLanguage();
  const { currency, convertCurrency } = useCurrency();

  const displayRate = currency === 'ILS' ? convertCurrency(service.hourly_rate, 'USD', 'ILS') : service.hourly_rate;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <Link to={`/service/${service._id}`} className="block">
      <FuturisticCard className="h-full group hover:ring-2 hover:ring-primary/50 transition-all">
        <div className="relative">
          <img
            src={service.images?.[0] || `https://picsum.photos/seed/${service._id}/300/200`}
            alt={service.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-lg">
            {currencySymbol}{displayRate.toLocaleString()}/hr
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                <img src={service.provider_avatar || `https://avatar.vercel.sh/${service.provider_name}.svg`} alt="Provider" className="w-full h-full object-cover"/>
             </div>
             <span className="text-xs text-muted-foreground">{service.provider_name}</span>
          </div>
          <h3 className="text-lg font-bold truncate text-foreground group-hover:text-primary transition-colors">{service.title}</h3>
          
          <div className="flex items-center text-sm text-muted-foreground mt-3">
            <MapPin className="w-4 h-4 mr-1 text-primary" />
            <span>{service.location}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Clock className="w-4 h-4 mr-1 text-primary" />
            <span>{service.availability || 'Flexible'}</span>
          </div>
        </div>
      </FuturisticCard>
    </Link>
  );
}
