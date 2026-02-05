import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, getMyItems, deleteItem, featureItem } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, PlusCircle, Star } from 'lucide-react'; // Import Star icon
import ItemCard from '../components/items/ItemCard';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';


export default function MyItems() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['items', 'my'],
    queryFn: getMyItems,
    enabled: !!user,
  });
  
  const deleteMutation = useMutation({
    mutationFn: (itemId) => deleteItem(itemId),
    onSuccess: () => {
        toast.success('Item deleted successfully');
        queryClient.invalidateQueries(['items', 'my']);
    },
    onError: (error) => {
        toast.error(error.message || 'Failed to delete item');
    }
  });

  const featureMutation = useMutation({
    mutationFn: (itemId) => featureItem(itemId),
    onSuccess: (data) => {
        toast.success('Item featured successfully!');
        queryClient.invalidateQueries(['items', 'my']); // Refresh my items to show featured status
        queryClient.invalidateQueries(['user', 'me']); // Refresh user data for updated coins
        // Optionally, also invalidate featured items query on the home page
        queryClient.invalidateQueries(['items', 'featured']); 
    },
    onError: (error) => {
        toast.error(error.message || 'Failed to feature item');
    }
  });

  const handleDelete = (itemId) => {
    toast.warning('Are you sure you want to delete this item?', {
      action: {
        label: 'Delete',
        onClick: () => deleteMutation.mutate(itemId),
      },
    });
  };

  const handleEdit = (itemId) => {
    // Navigate to an edit page, which can be the same as CreateItem page with pre-filled data
    navigate(`/edit-item/${itemId}`);
  };

  const handleFeature = (itemId) => {
    toast.info('Featuring an item costs 5 coins and lasts 12 hours.', {
        action: {
            label: 'Confirm Feature',
            onClick: () => featureMutation.mutate(itemId),
        }
    });
  };


  const groupedItems = {
    active: items.filter(i => i.status === 'active'),
    pending: items.filter(i => i.status === 'pending'),
    traded: items.filter(i => i.status === 'traded'),
  };
  
  const tabs = ['active', 'pending', 'traded'];

  if (isLoading) return <div className="flex justify-center mt-8"><Loader2 className="w-10 h-10 animate-spin"/></div>
  if (error) return <p className="text-red-500 text-center mt-8">Error loading your items.</p>

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{t('myItems')}</h1>
            <Link to="/create" className="flex items-center space-x-2 bg-primary text-primary-content px-4 py-2 rounded-lg">
                <PlusCircle className="w-5 h-5"/>
                <span>{t('listItem')}</span>
            </Link>
        </div>

        <div className="border-b border-border mb-4">
            <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                    {t(tab)} ({groupedItems[tab].length})
                </button>
            ))}
            </nav>
        </div>

        <div>
            {groupedItems[activeTab].length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {groupedItems[activeTab].map(item => (
                        <ItemCard 
                            key={item._id} 
                            item={item} 
                            showActions={activeTab === 'active'}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        >
                            {activeTab === 'active' && item.status === 'active' && !item.isFeatured && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleFeature(item._id); }}
                                    className="flex items-center justify-center space-x-1 p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                                >
                                    <Star className="w-4 h-4" />
                                    <span>{t('featureItem')}</span>
                                </button>
                            )}
                            {activeTab === 'active' && item.status === 'active' && item.isFeatured && item.featuredUntil && (
                                <div className="flex items-center justify-center space-x-1 p-2 bg-green-500 text-white rounded-md">
                                    <Star className="w-4 h-4" />
                                    <span>{t('featuredUntil', { date: new Date(item.featuredUntil).toLocaleDateString() })}</span>
                                </div>
                            )}
                        </ItemCard>
                    ))}
                </div>
            ) : (
                <p>No items in this category.</p>
            )}
        </div>
    </div>
  );
}
