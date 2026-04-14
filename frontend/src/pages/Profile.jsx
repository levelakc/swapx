import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe, getMyItems, deleteItem, startSupportChat } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Mail, LogOut, Star, Repeat, Edit, Plus, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import ItemCard from '../components/items/ItemCard';
import { Link, useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/common/ImageWithFallback';
import PageInfo from '../components/common/PageInfo';

export default function Profile() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => {
      const u = getMe();
      u.then(data => {
        setValue('full_name', data.full_name);
        setValue('bio', data.bio);
      });
      return u;
    },
    retry: false,
  });

  const { data: myItemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['items', 'my'],
    queryFn: getMyItems,
  });
  const myItems = myItemsData?.items || myItemsData || []; // Handle array or object response

  const updateMutation = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries(['user', 'me']);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
        toast.success('Item removed');
        queryClient.invalidateQueries(['items', 'my']);
    },
    onError: (err) => toast.error(err.message)
  });

  const onUpdateSubmit = (data) => {
    updateMutation.mutate(data);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('swapx_user');
    window.location.href = '/';
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${user._id}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success(t('profileLinkCopied', 'Profile link copied to clipboard!'));
  };

  const handleEditItem = (id) => {
      navigate(`/edit-item/${id}`);
  };

  const supportMutation = useMutation({
      mutationFn: startSupportChat,
      onSuccess: () => {
          navigate('/messages');
      },
      onError: (err) => toast.error(err.message)
  });

  if (isLoading) return <div className="flex justify-center mt-8"><Loader2 className="w-10 h-10 animate-spin"/></div>
  if (error) return <p className="text-red-500 text-center mt-8">Please log in to view your profile.</p>

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-12">
      {/* Profile Header Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-600 to-secondary rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-card rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-white/10 overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>

          <div className="absolute top-8 right-8 z-10">
            <PageInfo infoKey="profileInfo" />
          </div>

          <div className="relative flex flex-col items-center md:flex-row md:items-start md:gap-12">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-purple-500 rounded-full blur-sm opacity-50 animate-pulse"></div>
              <div className="w-32 h-32 md:w-40 md:h-40 relative">
                <ImageWithFallback 
                  src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} 
                  alt="avatar" 
                  className="relative w-full h-full rounded-full object-cover border-4 border-background shadow-2xl" 
                />
              </div>
              <button className="absolute bottom-1 right-1 bg-primary text-primary-content p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-background">
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 md:mt-2 text-center md:text-left flex-grow">
              <form onSubmit={handleSubmit(onUpdateSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <input 
                        {...register('full_name')} 
                        className="text-4xl md:text-5xl font-black bg-transparent border-none focus:ring-0 p-0 text-foreground w-full text-center md:text-left selection:bg-primary/30"
                        placeholder={t('fullName')}
                    />
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest">
                        <Mail className="w-4 h-4 text-primary" />
                        <span>{user.email}</span>
                    </div>
                </div>

                <textarea 
                    {...register('bio')} 
                    rows="3" 
                    className="w-full text-lg text-muted-foreground bg-muted/20 border border-white/5 focus:border-primary/30 focus:bg-muted/30 rounded-2xl p-4 transition-all resize-none outline-none" 
                    placeholder={t('writeSomethingAboutYourself', 'Write something about yourself...')}
                />

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <button 
                    type="submit" 
                    disabled={updateMutation.isLoading}
                    className="bg-primary text-primary-content px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                      {updateMutation.isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : t('saveChanges', 'Save Changes')}
                  </button>
                  <button 
                      type="button" 
                      onClick={() => supportMutation.mutate()} 
                      disabled={supportMutation.isLoading}
                      className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                  >
                      {supportMutation.isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><MessageCircle className="w-4 h-4"/> {t('contactSupport')}</>}
                  </button>

                  <button 
                    type="button"
                    onClick={handleShareProfile} 
                    className="bg-secondary/50 text-foreground border border-white/10 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-secondary transition-all active:scale-95 flex items-center gap-2"
                  >
                      <Share2 size={16}/>
                      {t('shareProfile', 'Share Profile')}
                  </button>
                  
                  {/* Logout Button - Small and Curvy */}
                  <button 
                    type="button"
                    onClick={handleLogout} 
                    className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                  >
                      <LogOut size={16}/>
                      {t('logout')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center group/stat px-2">
              <div className="inline-flex p-3 bg-purple-500/10 rounded-2xl text-purple-500 mb-3 group-hover/stat:scale-110 transition-transform">
                <Repeat className="w-6 h-6" />
              </div>
              <h4 className="font-black text-2xl md:text-3xl text-foreground block truncate">{user.total_trades || 0}</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground mt-1 truncate">{t('totalTrades', 'Total Trades')}</p>
            </div>
            <div className="text-center group/stat px-2">
              <div className="inline-flex p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 mb-3 group-hover/stat:scale-110 transition-transform">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <div className="flex items-center justify-center gap-1">
                <h4 className="font-black text-2xl md:text-3xl text-foreground truncate">{user.rating || 0}</h4>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground mt-1 truncate">{t('rating', 'Rating')}</p>
            </div>
            <div className="text-center group/stat px-2">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-3 group-hover/stat:scale-110 transition-transform">
                <Plus className="w-6 h-6 rotate-45" />
              </div>
              <h4 className="font-black text-2xl md:text-3xl text-foreground block truncate">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '...'}
              </h4>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground mt-1 truncate">{t('memberSince', 'Member Since')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {t('myItems', 'My Items')}
                </h2>
                <p className="text-muted-foreground font-medium mt-1 text-center sm:text-left">{t('manageYourInventory', 'Manage your trade inventory')}</p>
            </div>
            <Link to="/create" className="w-full sm:w-auto bg-primary text-primary-content px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 shadow-xl">
                <Plus size={20} /> {t('listItem', 'List Item')}
            </Link>
        </div>

        {isLoadingItems ? (
            <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : myItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myItems.map(item => (
                    <ItemCard 
                        key={item._id} 
                        item={item} 
                        showActions={true} 
                        onEdit={handleEditItem} 
                        onDelete={(id) => deleteMutation.mutate(id)}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center bg-card rounded-[2.5rem] border border-dashed border-white/10 p-20">
                <div className="inline-flex p-6 bg-muted/30 rounded-full text-muted-foreground mb-6">
                    <Plus size={40} className="opacity-50" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">{t('noItemsYet', "No items yet")}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">{t('startByListing', "Start by listing something you'd like to trade!")}</p>
                <Link to="/create" className="text-primary font-black uppercase tracking-widest text-sm hover:underline">{t('listItemNow', "List Item Now")}</Link>
            </div>
        )}
      </div>
    </div>
  );
}
