import { useLanguage } from '../../contexts/LanguageContext';
import ItemCard from '../items/ItemCard';
import { Link } from 'react-router-dom';

export default function PopularItems({ items }) {
  const { t } = useLanguage();

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{t('popularItems', 'Popular Items')}</h2>
        <Link to="/browse" className="text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(item => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
}