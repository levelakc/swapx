import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

export default function CoinPanel() {
    const { t } = useLanguage();
    const { data: user, isLoading, error } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: getMe,
        retry: false,
    });

    if (isLoading) return <div className="flex justify-center mt-8"><Loader2 className="w-10 h-10 animate-spin"/></div>;
    if (error) return <p className="text-red-500 text-center mt-8">Error loading user data.</p>;

    const nextRewardDate = user.lastLoginRewardClaimed 
        ? new Date(new Date(user.lastLoginRewardClaimed).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()
        : t('availableNow', 'Available Now'); // If null, means they can claim now

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">{t('yourCoins', 'Your Coins')}</h1>
            <div className="bg-card p-6 rounded-lg shadow-md mb-8">
                <div className="flex items-center space-x-4 mb-4">
                    <img src="/coin.svg" alt="Coin" className="h-10 w-10"/>
                    <p className="text-5xl font-bold text-primary">{user.coins}</p>
                </div>
                <p className="text-lg text-foreground/80 mb-2">
                    {t('dailyRewardInfo', 'You receive 5 coins daily upon logging in.')}
                </p>
                <p className="text-lg text-foreground/80">
                    {t('nextReward', 'Next reward can be claimed after:')} {nextRewardDate}
                </p>
            </div>

            <h2 className="text-2xl font-bold mb-4">{t('coinUsage', 'Coin Usage')}</h2>
            <p className="text-lg text-foreground/80">
                {t('featureItemWithCoins', 'You can spend coins to feature your items. Featured items appear prominently and get more visibility.')}
            </p>
            <p className="text-lg text-foreground/80">
                {t('featureCost', 'Featuring an item costs 5 coins and lasts for 12 hours. You can feature your items from the "My Items" page.')}
            </p>

            {/* Further sections for coin history, buying coins etc. can be added here */}
        </div>
    );
}
