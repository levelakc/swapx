import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getMe, getAllItems, getAllUsers, getAllTrades, getPlatformStats, updateUserCoins, updateUserRole, getSupportConversations, resolveSupportRequest } from '../api/api';
import { Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import CategoryManager from '../components/admin/CategoryManager';
import ItemsTable from '../components/admin/ItemsTable';
import OnlineUsersTable from '../components/admin/OnlineUsersTable';
import TradesTable from '../components/admin/TradesTable';

const StatCard = ({ title, value }) => (
  <div className="bg-muted p-4 rounded-lg shadow-sm">
    <h3 className="text-lg font-medium text-foreground/70">{title}</h3>
    <p className="text-3xl font-bold text-primary">{value}</p>
  </div>
);

const AdminDashboard = () => {
    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin', 'platformStats'], queryFn: getPlatformStats });

    if (statsLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

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
        </div>
    );
};

const SupportTable = () => {
    const queryClient = useQueryClient();
    const { data: conversations = [], isLoading } = useQuery({ queryKey: ['admin', 'support'], queryFn: getSupportConversations });

    const resolveMutation = useMutation({
        mutationFn: (id) => resolveSupportRequest(id),
        onSuccess: () => {
            toast.success('Support request marked as resolved');
            queryClient.invalidateQueries(['admin', 'support']);
        },
        onError: (err) => toast.error(err.message)
    });

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

    return (
        <div className="overflow-x-auto bg-card rounded-xl border border-border shadow-sm">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Participants</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Last Message</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {conversations.length === 0 ? (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">No active support requests! 🌈</td></tr>
                    ) : conversations.map(conv => (
                        <tr key={conv._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {conv.participants.join(' & ')}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                                {conv.last_message}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {new Date(conv.last_message_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap flex gap-3">
                                <Link 
                                    to={`/messages/${conv._id}`}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-content rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    <MessageSquare size={14} /> Open Chat
                                </Link>
                                <button
                                    onClick={() => resolveMutation.mutate(conv._id)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all shadow-sm"
                                >
                                    <CheckCircle size={14} /> Resolve
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const UsersTable = () => {
    const queryClient = useQueryClient();
    const { data: users = [], isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: getAllUsers });

    const updateCoinsMutation = useMutation({
        mutationFn: ({ userId, coins }) => updateUserCoins(userId, coins),
        onSuccess: () => {
            toast.success('User coins updated successfully!');
            queryClient.invalidateQueries(['admin', 'users']);
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }) => updateUserRole(userId, role),
        onSuccess: () => {
            toast.success('User role updated successfully!');
            queryClient.invalidateQueries(['admin', 'users']);
        }
    });

    const handleEditCoins = (userId, currentCoins) => {
        const newCoins = window.prompt(`Enter new coin balance for user (current: ${currentCoins}):`);
        if (newCoins !== null) {
            const coinsValue = parseInt(newCoins, 10);
            if (!isNaN(coinsValue) && coinsValue >= 0) {
                updateCoinsMutation.mutate({ userId, coins: coinsValue });
            }
        }
    };

    const handleEditRole = (userId, currentRole) => {
        const roles = ['user', 'moderator', 'admin'];
        const newRole = window.prompt(`Enter new role for user (${roles.join(', ')}). Current: ${currentRole}:`);
        if (newRole && roles.includes(newRole.toLowerCase())) {
            updateRoleMutation.mutate({ userId, role: newRole.toLowerCase() });
        }
    };

    if(isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    
    return (
        <div className="overflow-x-auto bg-card rounded-xl border border-border shadow-sm">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {users.map(user => (
                        <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                    user.role === 'admin' ? 'bg-red-500/10 text-red-600' : 
                                    user.role === 'moderator' ? 'bg-purple-500/10 text-purple-600' : 
                                    'bg-blue-500/10 text-blue-600'
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                <button onClick={() => handleEditCoins(user._id, user.coins)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">Coins</button>
                                <button
                                    onClick={() => updateRoleMutation.mutate({ userId: user._id, role: 'moderator' })}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all ${user.role === 'moderator' ? 'bg-gray-200 text-muted-foreground cursor-not-allowed' : 'bg-purple-600 text-white'}`}
                                    disabled={user.role === 'moderator'}
                                >
                                    Set Mod
                                </button>
                                <button onClick={() => handleEditRole(user._id, user.role)} className="px-3 py-1 bg-gray-800 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">Role</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: user, isLoading } = useQuery({ queryKey: ['user', 'me'], queryFn: getMe, retry: false });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary"/></div>
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return <Navigate to="/" />;
  
  const isAdmin = user.role === 'admin';

  const tabs = {
    dashboard: { component: <AdminDashboard />, adminOnly: true },
    support: { component: <SupportTable />, adminOnly: false },
    users: { component: <UsersTable />, adminOnly: true },
    categories: { component: <CategoryManager />, adminOnly: true },
    items: { component: <ItemsTable />, adminOnly: false },
    trades: { component: <TradesTable />, adminOnly: false },
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase tracking-tighter">
              {isAdmin ? 'Admin Console' : 'Moderator Panel'}
          </h1>
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
              {user.role}
          </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {Object.keys(tabs).map(tab => {
            if (tabs[tab].adminOnly && !isAdmin) return null;
            return (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    {tab}
                </button>
            );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tabs[activeTab].component}
      </motion.div>
    </div>
  );
}
