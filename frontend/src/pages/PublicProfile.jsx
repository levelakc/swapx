import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getUserItems, getMe } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Mail, Star, Repeat, Plus, Share2, ShieldCheck, MapPin } from 'lucide-react';
import ItemCard from '../components/items/ItemCard';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { toast } from 'sonner';

export default function PublicProfile() {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const { data: user, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['user', 'profile', id],
    queryFn: () => getUserProfile(id),
  });

  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['items', 'user', id],
    queryFn: () => getUserItems(id),
  });

  const { data: me } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
  });

  const items = itemsData?.items || [];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('linkCopied', 'Profile link copied!'));
  };

  if (isLoadingUser) return <div className="flex justify-center mt-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (userError) return <div className="text-center mt-20 text-red-500 font-bold">{t('userNotFound', 'User not found')}</div>;

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-12">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-600 to-secondary rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-card rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-white/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative flex flex-col items-center md:flex-row md:items-start md:gap-12">
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 relative">
                <ImageWithFallback 
                  src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} 
                  alt="avatar" 
                  className="relative w-full h-full rounded-full object-cover border-4 border-background shadow-2xl" 
                />
              </div>
              {user.verification_status === 'verified' && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-background shadow-lg">
                  <ShieldCheck size={20} />
                </div>
              )}
            </div>

            <div className="mt-8 md:mt-2 text-center md:text-left flex-grow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-foreground selection:bg-primary/30">{user.full_name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-muted-foreground font-bold text-sm uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-primary" />
                      <span>{user.location || 'Israel'}</span>
                    </div>
                    {user.email && (
                       <div className="flex items-center gap-1.5">
                        <Mail size={16} className="text-primary" />
                        <span>{user.email.split('@')[0]}@***</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={handleShare}
                  className="bg-secondary/50 hover:bg-secondary text-foreground p-4 rounded-2xl transition-all active:scale-95 border border-white/5 flex items-center gap-2"
                >
                  <Share2 size={20} />
                </button>
              </div>

              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {user.bio || t('noBioProvided', 'No bio provided.')}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center group/stat px-2">
              <div className="inline-flex p-3 bg-purple-500/10 rounded-2xl text-purple-500 mb-3">
                <Repeat className="w-6 h-6" />
              </div>
              <h4 className="font-black text-2xl md:text-3xl text-foreground block truncate">{user.total_trades || 0}</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground mt-1 truncate">{t('totalTrades', 'Total Trades')}</p>
            </div>
            <div className="text-center group/stat px-2">
              <div className="inline-flex p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 mb-3">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <h4 className="font-black text-2xl md:text-3xl text-foreground block truncate">{user.rating || 0}</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground mt-1 truncate">{t('rating', 'Rating')}</p>
            </div>
            <div className="text-center group/stat px-2">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-black text-2xl md:text-3xl text-foreground block uppercase truncate">{t(user.verification_status || 'unverified')}</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground mt-1 truncate">{t('status', 'Status')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {t('userInventory', 'Inventory')}
            </h2>
            <p className="text-muted-foreground font-medium mt-1">{t('browseUserItems', 'Browse items available for trade')}</p>
          </div>
        </div>

        {isLoadingItems ? (
            <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(item => (
                    <ItemCard 
                        key={item._id} 
                        item={item} 
                    />
                ))}
            </div>
        ) : (
            <div className="text-center bg-card rounded-[2.5rem] border border-dashed border-white/10 p-20">
                <h3 className="text-2xl font-black text-foreground mb-2">{t('noPublicItems', "No public items yet")}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">{t('userHasNoItemsToTrade', "This user doesn't have any visible items to trade right now.")}</p>
            </div>
        )}
      </div>

      {me && me._id !== user._id && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <Link 
                to={`/browse?user=${user._id}`}
                className="bg-primary text-primary-content px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-primary/40 flex items-center gap-3 hover:scale-105 transition-all active:scale-95"
            >
                <Repeat size={24} />
                {t('makeAnOffer', 'Make an Offer')}
            </Link>
        </div>
      )}
    </div>
  );
}
