import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe, getMyItems, deleteItem } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Mail, LogOut, Star, Repeat, Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import ItemCard from '../components/items/ItemCard';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
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
    localStorage.removeItem('base44_user');
    window.location.href = '/';
  };

  const handleEditItem = (id) => {
      // Navigate to edit page (create one if needed, or reuse CreateItem with ID)
      // For now, assume /create?edit=id or similar, or just toast "Edit coming soon"
      // Or simply navigate to /item/:id which has edit button if owner?
      // Let's assume we want to route to /create/${id} or similar.
      // But CreateItem is /create.
      // I'll leave it as a toast for now or basic link.
      // Actually, standard is /item/:id/edit.
      window.location.href = `/create?edit=${id}`; // Simple query param
  };

  if (isLoading) return <div className="flex justify-center mt-8"><Loader2 className="w-10 h-10 animate-spin"/></div>
  if (error) return <p className="text-red-500 text-center mt-8">Please log in to view your profile.</p>

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Card */}
      <div className="bg-background shadow-lg rounded-lg p-8">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-8">
          <div className="relative">
            <img src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} alt="avatar" className="w-32 h-32 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-background" />
            <button className="absolute bottom-0 right-0 bg-primary text-primary-content p-2 rounded-full">
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-6 md:mt-0 text-center md:text-left flex-grow">
            <form onSubmit={handleSubmit(onUpdateSubmit)}>
              <input {...register('full_name')} className="text-3xl font-bold bg-transparent focus:bg-input rounded-md"/>
              <p className="text-muted-foreground flex items-center justify-center md:justify-start">
                <Mail className="w-4 h-4 mr-2" />{user.email}
              </p>
              <textarea {...register('bio')} rows="3" className="w-full text-lg text-muted-foreground mt-2 bg-transparent focus:bg-input rounded-md p-2" placeholder="Your bio..."/>
              <button type="submit" className="mt-2 bg-secondary text-secondary-content px-4 py-2 rounded-md text-sm">
                {updateMutation.isLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t grid grid-cols-1 md:grid-cols-3 text-center gap-4">
          <div>
            <h4 className="font-bold text-2xl">{user.total_trades || 0}</h4>
            <p className="text-muted-foreground flex items-center justify-center"><Repeat className="w-4 h-4 mr-1"/> Total Trades</p>
          </div>
          <div>
            <h4 className="font-bold text-2xl flex items-center justify-center">{user.rating || 0} <Star className="w-5 h-5 ml-1 text-yellow-400"/></h4>
            <p className="text-muted-foreground">Rating</p>
          </div>
          <div>
            <h4 className="font-bold text-2xl">{new Date(user.createdAt).toLocaleDateString()}</h4>
            <p className="text-muted-foreground">Member Since</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t">
            <button onClick={handleLogout} className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-red-600 hover:bg-red-700">
                <LogOut className="mr-2"/>
                {t('logout')}
            </button>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="bg-background shadow-lg rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('myItems', 'My Items')}</h2>
            <Link to="/create" className="bg-primary text-primary-content px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
                <Plus size={18} /> {t('listItem', 'List Item')}
            </Link>
        </div>

        {isLoadingItems ? <Loader2 className="mx-auto animate-spin" /> : myItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="text-center text-muted-foreground py-8">
                <p>You haven't listed any items yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}
