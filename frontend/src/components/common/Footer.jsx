import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-background border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-primary">{t('brand')}</h3>
            <p className="text-muted-foreground mt-2">{t('tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('quickLinks')}</h4>
            <ul className="mt-2 space-y-1">
              <li><Link to="/browse" className="text-muted-foreground hover:text-primary">{t('explore')}</Link></li>
              <li><Link to="/create" className="text-muted-foreground hover:text-primary">{t('listItem')}</Link></li>
              <li><Link to="/my-items" className="text-muted-foreground hover:text-primary">{t('myItems')}</Link></li>
            </ul>
          </div>
           <div>
            <h4 className="font-semibold">{t('company')}</h4>
            <ul className="mt-2 space-y-1">
              <li><Link to="/about" className="text-muted-foreground hover:text-primary">{t('aboutUs')}</Link></li>
              <li><Link to="/careers" className="text-muted-foreground hover:text-primary">{t('careers')}</Link></li>
              <li><Link to="/press" className="text-muted-foreground hover:text-primary">{t('press')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t('legal')}</h4>
            <ul className="mt-2 space-y-1">
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary">{t('termsOfService')}</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary">{t('privacyPolicy')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {t('brand')}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
