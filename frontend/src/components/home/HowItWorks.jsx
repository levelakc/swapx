import { useLanguage } from '../../contexts/LanguageContext';
import { List, Search, Repeat } from 'lucide-react';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: <List className="w-12 h-12 text-primary" />,
      title: t('howItWorks.step1.title', '1. List Your Item'),
      description: t('howItWorks.step1.description', 'Take a few photos, write a description, and set an estimated value for what you want to trade.'),
    },
    {
      icon: <Search className="w-12 h-12 text-primary" />,
      title: t('howItWorks.step2.title', '2. Find a Match'),
      description: t('howItWorks.step2.description', 'Browse items from others or search for something specific. See what others are looking for in return.'),
    },
    {
      icon: <Repeat className="w-12 h-12 text-primary" />,
      title: t('howItWorks.step3.title', '3. Make a Trade'),
      description: t('howItWorks.step3.description', 'Propose a trade by offering your items, with optional cash to balance the deal. Negotiate and complete the swap!'),
    },
  ];
  
  return (
    <section className="py-12 bg-muted rounded-lg">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">{t('howItWorks.title', 'How It Works')}</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {steps.map((step, index) => (
            <div key={index} className="p-6 bg-background rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-foreground/80">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
