import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, claimDailyReward } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Timer, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function CoinPanel() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [timeLeft, setTimeLeft] = useState('');

    const { data: user, isLoading, error } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: getMe,
        retry: false,
    });

    const claimMutation = useMutation({
        mutationFn: claimDailyReward,
        onSuccess: (data) => {
            toast.success(`You claimed ${5} coins!`);
            queryClient.invalidateQueries(['user', 'me']);
        },
        onError: (err) => {
            toast.error(err.message || "Failed to claim reward");
        }
    });

    useEffect(() => {
        if (!user?.lastLoginRewardClaimed) return;

        const updateTimer = () => {
            const now = new Date();
            const lastClaim = new Date(user.lastLoginRewardClaimed);
            
            // Check if already available (different day)
            if (now.toDateString() !== lastClaim.toDateString()) {
                setTimeLeft(null); // Available
                return;
            }

            // Calculate time until next midnight
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);
            const diff = tomorrow - now;

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [user]);

    if (isLoading) return <div className="flex justify-center mt-8"><Loader2 className="w-10 h-10 animate-spin"/></div>;
    if (error) return <p className="text-red-500 text-center mt-8">Error loading user data.</p>;

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
                
                <div className="mt-4 p-4 bg-muted/50 rounded-lg inline-block">
                    {timeLeft ? (
                        <div className="flex items-center gap-2 text-orange-500 font-bold">
                            <Timer size={20} />
                            <span>Next reward in: {timeLeft}</span>
                        </div>
                    ) : (
                        <button 
                            onClick={() => claimMutation.mutate()}
                            disabled={claimMutation.isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-green-500/30"
                        >
                            {claimMutation.isLoading ? <Loader2 className="animate-spin h-5 w-5"/> : <Gift className="h-5 w-5" />}
                            {t('claimReward', 'Claim Daily Reward')}
                        </button>
                    )}
                </div>
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
