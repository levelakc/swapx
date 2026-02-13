import { useLanguage } from '../../contexts/LanguageContext';
import ServiceCard from '../services/ServiceCard';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PopularServices({ services, title, onRefresh, isLoading }) {
  const { t } = useLanguage();

  return (
    <section className="relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{title}</h2>
          <div className="h-1.5 w-20 bg-primary mt-2 rounded-full"></div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
                onClick={(e) => {
                  e.preventDefault();
                  onRefresh();
                }} 
                disabled={isLoading}
                className="group flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-border/50 shadow-sm"
                title={t('refresh')}
            >
                <RefreshCw 
                  size={18} 
                  className={`text-primary transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} 
                />
                <span>{t('refresh')}</span>
            </button>
            
            <Link 
              to="/browse-services" 
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              {t('viewAll')}
              <ArrowRight size={16} />
            </Link>
        </div>
      </div>

      {isLoading && (!services || services.length === 0) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-3xl bg-muted animate-pulse"></div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {services?.map((service, index) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ServiceCard service={service} />
            </motion.div>
          ))}
          {(!services || services.length === 0) && !isLoading && (
            <div className="col-span-full py-20 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-border">
              <p className="text-muted-foreground font-medium">{t('noServicesFound', 'No services found.')}</p>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}
