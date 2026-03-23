import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMutualMatches } from '../../api/api';
import ItemCard from '../items/ItemCard';
import { Sparkles, ArrowRightLeft, Loader2, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function MutualMatches() {
    const { t } = useLanguage();
    const { data, isLoading, error } = useQuery({
        queryKey: ['items', 'matches'],
        queryFn: getMutualMatches,
        staleTime: 30000, // 30 seconds
    });

    if (isLoading) return (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
    );

    if (error || !data?.matches?.length) return null;

    return (
        <section className="relative py-12 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full -z-10" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20 animate-pulse">
                        <Sparkles size={14} />
                        Perfect Trades Found
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic">
                        {t('mutualMatches', 'Mutual Matches')}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                        {t('mutualMatchesDesc', 'Items from users looking for what you have!')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.matches.map((match, idx) => (
                    <motion.div 
                        key={match.item._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative group"
                    >
                        {/* Match Badge */}
                        <div className="absolute -top-3 -right-2 z-20 bg-gradient-to-r from-purple-600 to-primary text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl shadow-primary/20 flex items-center gap-1.5 border border-white/20 group-hover:scale-110 transition-transform">
                            <ArrowRightLeft size={12} />
                            MATCH
                        </div>
                        
                        <ItemCard item={match.item} />
                        
                        <div className="mt-3 px-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Info size={12} className="text-primary" />
                            {match.matchReason}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
