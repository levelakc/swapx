import { useLanguage } from '../../contexts/LanguageContext';
import ServiceCard from '../services/ServiceCard';
import { Link } from 'react-router-dom';

export default function PopularServices({ services }) {
  const { t } = useLanguage();

  if (!services || services.length === 0) return null;

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{t('popularServices', 'Popular Services')}</h2>
        <Link to="/browse-services" className="text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(service => (
          <ServiceCard key={service._id} service={service} />
        ))}
      </div>
    </section>
  );
}
