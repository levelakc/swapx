import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SEO({ 
  title, 
  description, 
  canonical, 
  ogTitle, 
  ogDescription, 
  ogImage, 
  ogType = 'website',
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
  twitterCard = 'summary_large_image',
  jsonLd
}) {
  const { t } = useLanguage();
  const siteTitle = t('brand', 'Ahlafot');
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = t('siteDescription', 'Ahlafot - Trade Anything for Anything. The ultimate marketplace for items and services exchange.');
  const metaDescription = description || defaultDescription;
  const currentUrl = ogUrl || window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || metaDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={twitterTitle || ogTitle || fullTitle} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || metaDescription} />
      {twitterImage && <meta name="twitter:image" content={twitterImage || ogImage} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
