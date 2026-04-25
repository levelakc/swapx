import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getMe, getAllItems, getAllUsers, getAllTrades, getPlatformStats, updateUserCoins, updateUserRole, getSupportConversations, resolveSupportRequest, getUserLogs } from '../api/api';
import { Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Loader2, CheckCircle, MessageSquare, History, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import CategoryManager from '../components/admin/CategoryManager';
import ItemsTable from '../components/admin/ItemsTable';
import OnlineUsersTable from '../components/admin/OnlineUsersTable';
import TradesTable from '../components/admin/TradesTable';
import EmailManager from '../components/admin/EmailManager';
import PageInfo from '../components/common/PageInfo';

const StatCard = ({ title, value }) => (
  <div className="bg-muted p-4 rounded-lg shadow-sm">
    <h3 className="text-lg font-medium text-foreground/70">{title}</h3>
    <p className="text-3xl font-bold text-primary">{value}</p>
  </div>
);

const AdminDashboard = () => {
    const { t } = useLanguage();
    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin', 'platformStats'], queryFn: getPlatformStats });

    if (statsLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">{t('overview')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title={t('totalUsers')} value={stats?.usersCount || 0} />
                <StatCard title={t('totalItems')} value={stats?.totalItemsCount || 0} />
                <StatCard title={t('activeItems')} value={stats?.activeItemsCount || 0} />
                <StatCard title={t('pendingTrades')} value={stats?.pendingTradesCount || 0} />
                <StatCard title={t('completedTrades')} value={stats?.completedTradesCount || 0} />
                <StatCard title={t('categories')} value={stats?.categoriesCount || 0} />
            </div>
        </div>
    );
};

const SupportTable = () => {
    const { t } = useLanguage();
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
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('participants')}</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('lastMessage')}</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('time')}</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {conversations.length === 0 ? (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">{t('noSupportRequests')}</td></tr>
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
                                    <MessageSquare size={14} /> {t('openChat')}
                                </Link>
                                <button
                                    onClick={() => resolveMutation.mutate(conv._id)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all shadow-sm"
                                >
                                    <CheckCircle size={14} /> {t('resolve')}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const LogsModal = ({ userId, userName, onClose }) => {
    const { t } = useLanguage();
    const { data: logs = [], isLoading } = useQuery({ 
        queryKey: ['admin', 'userLogs', userId], 
        queryFn: () => getUserLogs(userId),
        enabled: !!userId
    });

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border border-border flex flex-col"
            >
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter">{t('userLogs')}</h2>
                        <p className="text-sm text-muted-foreground">{userName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No activity logs found for this user.</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log, i) => (
                                <div key={i} className="p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
                                    <div className="flex justify-between font-bold mb-1">
                                        <span className="text-primary">{log.method} {log.url}</span>
                                        <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                        IP: {log.ip} | UA: {log.userAgent}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

const UsersTable = () => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { data: users = [], isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: getAllUsers });
    const [selectedUserLogs, setSelectedUserLogs] = useState(null);

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
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('fullName')}</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('email')}</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('role')}</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('lastOnline')}</th>
                        <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">{t('actions')}</th>
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
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                                {user.isOnline ? (
                                    <span className="text-green-500 font-bold flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> {t('live')}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                <button 
                                    onClick={() => setSelectedUserLogs({ id: user._id, name: user.full_name })} 
                                    className="p-1.5 bg-muted hover:bg-muted-foreground/10 text-foreground rounded-lg transition-all"
                                    title={t('userLogs')}
                                >
                                    <History size={16} />
                                </button>
                                <button onClick={() => handleEditCoins(user._id, user.coins)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">{t('editCoins')}</button>
                                <button
                                    onClick={() => updateRoleMutation.mutate({ userId: user._id, role: 'moderator' })}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all ${user.role === 'moderator' ? 'bg-gray-200 text-muted-foreground cursor-not-allowed' : 'bg-purple-600 text-white'}`}
                                    disabled={user.role === 'moderator'}
                                >
                                    {t('setMod')}
                                </button>
                                <button onClick={() => handleEditRole(user._id, user.role)} className="px-3 py-1 bg-gray-800 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">{t('role')}</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <AnimatePresence>
                {selectedUserLogs && (
                    <LogsModal 
                        userId={selectedUserLogs.id} 
                        userName={selectedUserLogs.name} 
                        onClose={() => setSelectedUserLogs(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default function Admin() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: user, isLoading } = useQuery({ queryKey: ['user', 'me'], queryFn: getMe, retry: false });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary"/></div>
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return <Navigate to="/" />;
  
  const isAdmin = user.role === 'admin';

  const tabs = {
    dashboard: { component: <AdminDashboard />, adminOnly: true, label: t('dashboard') },
    support: { component: <SupportTable />, adminOnly: false, label: t('support') },
    users: { component: <UsersTable />, adminOnly: true, label: t('users') },
    email: { component: <EmailManager />, adminOnly: true, label: t('email') },
    categories: { component: <CategoryManager />, adminOnly: true, label: t('categories') },
    items: { component: <ItemsTable />, adminOnly: false, label: t('items') },
    trades: { component: <TradesTable />, adminOnly: false, label: t('trades') },
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                  {isAdmin ? t('adminConsole') : t('moderatorPanel')}
              </h1>
              <PageInfo infoKey="adminInfo" />
          </div>
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
                    {tabs[tab].label}
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

