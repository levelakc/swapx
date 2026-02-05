import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getMe, getAllItems, getAllUsers, getAllTrades, getPlatformStats, updateUserCoins } from '../api/api';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CategoryManager from '../components/admin/CategoryManager';
import ItemsTable from '../components/admin/ItemsTable';
import OnlineUsersTable from '../components/admin/OnlineUsersTable'; // Import the new OnlineUsersTable component
import TradesTable from '../components/admin/TradesTable'; // Import the new TradesTable component

const StatCard = ({ title, value }) => (
  <div className="bg-muted p-4 rounded-lg shadow-sm">
    <h3 className="text-lg font-medium text-foreground/70">{title}</h3>
    <p className="text-3xl font-bold text-primary">{value}</p>
  </div>
);

const AdminDashboard = () => {
    const { data: items = [] } = useQuery({ queryKey: ['admin', 'items'], queryFn: getAllItems });
    const { data: users = [] } = useQuery({ queryKey: ['admin', 'users'], queryFn: getAllUsers });
    const { data: trades = [] } = useQuery({ queryKey: ['admin', 'trades'], queryFn: getAllTrades });
    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin', 'platformStats'], queryFn: getPlatformStats });

    if (statsLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Total Users" value={stats?.usersCount || 0} />
                <StatCard title="Total Items" value={stats?.totalItemsCount || 0} />
                <StatCard title="Active Items" value={stats?.activeItemsCount || 0} />
                <StatCard title="Pending Trades" value={stats?.pendingTradesCount || 0} />
                <StatCard title="Completed Trades" value={stats?.completedTradesCount || 0} />
                <StatCard title="Categories" value={stats?.categoriesCount || 0} />
            </div>

            <h2 className="text-2xl font-bold mt-8">Growth & Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="New Users (7 Days)" value={stats?.newUsersLast7Days || 0} />
                <StatCard title="New Users (30 Days)" value={stats?.newUsersLast30Days || 0} />
                <StatCard title="New Items (7 Days)" value={stats?.newItemsLast7Days || 0} />
                <StatCard title="New Items (30 Days)" value={stats?.newItemsLast30Days || 0} />
                <StatCard title="Completed Trades (7 Days)" value={stats?.completedTradesLast7Days || 0} />
                <StatCard title="Completed Trades (30 Days)" value={stats?.completedTradesLast30Days || 0} />
            </div>
        </div>
    );
};

const UsersTable = () => {
    const queryClient = useQueryClient(); // Access query client
    const { data: users = [], isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: getAllUsers });

    const updateCoinsMutation = useMutation({
        mutationFn: ({ userId, coins }) => updateUserCoins(userId, coins),
        onSuccess: () => {
            toast.success('User coins updated successfully!');
            queryClient.invalidateQueries(['admin', 'users']); // Refresh users list
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update user coins.');
        }
    });

    const handleEditCoins = (userId, currentCoins) => {
        const newCoins = window.prompt(`Enter new coin balance for user (current: ${currentCoins}):`);
        if (newCoins !== null) { // User didn't cancel
            const coinsValue = parseInt(newCoins, 10);
            if (!isNaN(coinsValue) && coinsValue >= 0) {
                updateCoinsMutation.mutate({ userId, coins: coinsValue });
            } else {
                toast.error('Please enter a valid non-negative number for coins.');
            }
        }
    };

    if(isLoading) return <Loader2 className="animate-spin"/>
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-background">
                <thead>
                    <tr>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Coins</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login (Approx.)</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.verification_status}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.coins}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{new Date(user.updatedAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">
                                <button
                                    onClick={() => handleEditCoins(user._id, user.coins)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                                >
                                    Edit Coins
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// Similar tables for Items and Trades can be created.

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  if (isLoading) return <div className="flex justify-center mt-8"><Loader2 className="w-10 h-10 animate-spin"/></div>
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  const tabs = {
    dashboard: <AdminDashboard />,
    categories: <CategoryManager />,
    users: <UsersTable />,
    items: <ItemsTable />, // Use the new ItemsTable component here
    trades: <TradesTable />, // Use the new TradesTable component here
    'online-users': <OnlineUsersTable />, // Use the new OnlineUsersTable component here
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <div className="flex space-x-4 border-b mb-4">
        {Object.keys(tabs).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize py-2 px-4 ${activeTab === tab ? 'border-b-2 border-primary text-primary' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {tabs[activeTab]}
      </div>
    </div>
  );
}
