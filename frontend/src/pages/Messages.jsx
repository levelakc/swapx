import io from 'socket.io-client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getConversations, 
    getMe, 
    startSupportChat, 
    getTradeById, 
    getItem
} from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
    Loader2, ChevronLeft, Search, Package, 
    ArrowRightLeft, MessageCircle, Check, X, Info, ExternalLink,
    Clock, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TradeNegotiationModal from '../components/trade/TradeNegotiationModal';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

function OfferSummaryCard({ tradeId, onOpen }) {
    const { t, language } = useLanguage();
    const { currency, convertCurrency } = useCurrency();

    const { data: trade, isLoading } = useQuery({
        queryKey: ['trade', tradeId],
        queryFn: () => getTradeById(tradeId),
        enabled: !!tradeId,
    });

    const { data: offeredItems = [] } = useQuery({
        queryKey: ['items', trade?.offered_items],
        queryFn: async () => {
            const items = await Promise.all(trade.offered_items.map(id => getItem(id).catch(() => null)));
            return items.filter(Boolean);
        },
        enabled: !!trade?.offered_items?.length,
    });

    const { data: requestedItems = [] } = useQuery({
        queryKey: ['items', trade?.requested_items],
        queryFn: async () => {
            const items = await Promise.all(trade.requested_items.map(id => getItem(id).catch(() => null)));
            return items.filter(Boolean);
        },
        enabled: !!trade?.requested_items?.length,
    });

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (!trade) return null;

    const currencySymbol = currency === 'ILS' ? '₪' : '$';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto bg-card rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden"
        >
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tighter uppercase">{t('newOfferReceived')}</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('openToViewAndChat')}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        trade.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                        trade.status === 'accepted' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                        'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                        {t(trade.status)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">{t('offered')}</p>
                        <div className="flex -space-x-3 overflow-hidden">
                            {offeredItems.slice(0, 3).map((item, i) => (
                                <img key={i} src={item.images?.[0]} className="w-14 h-14 rounded-2xl border-4 border-card object-cover shadow-lg" alt="" />
                            ))}
                            {offeredItems.length > 3 && (
                                <div className="w-14 h-14 rounded-2xl border-4 border-card bg-muted flex items-center justify-center text-xs font-black">
                                    +{offeredItems.length - 3}
                                </div>
                            )}
                            {offeredItems.length === 0 && trade.cash_offered > 0 && (
                                <div className="w-14 h-14 rounded-2xl border-4 border-card bg-green-500/10 flex items-center justify-center text-green-500">
                                    <DollarSign size={20} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">{t('requested')}</p>
                        <div className="flex -space-x-3 overflow-hidden">
                            {requestedItems.slice(0, 3).map((item, i) => (
                                <img key={i} src={item.images?.[0]} className="w-14 h-14 rounded-2xl border-4 border-card object-cover shadow-lg" alt="" />
                            ))}
                            {requestedItems.length > 3 && (
                                <div className="w-14 h-14 rounded-2xl border-4 border-card bg-muted flex items-center justify-center text-xs font-black">
                                    +{requestedItems.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={onOpen}
                        className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <ExternalLink size={18} />
                        {t('openNegotiation')}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function Messages() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showList, setShowList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  
  const socket = useRef(null);

  const { data: me } = useQuery({ queryKey: ['user', 'me'], queryFn: getMe });

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const tradeConversations = useMemo(() => {
    return conversations.filter(c => c.related_trade_id || c.participants.some(p => p.includes('sona') || p.includes('support')));
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return tradeConversations;
    return tradeConversations.filter(convo => {
        const otherParticipant = convo.participants.find(p => p !== me?.email) || '';
        return otherParticipant.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [tradeConversations, searchQuery, me?.email]);

  const selectedConversation = useMemo(() => 
    conversations.find(c => c._id === selectedConversationId), 
    [conversations, selectedConversationId]
  );

  // Socket setup for online status
  useEffect(() => {
    const userData = localStorage.getItem('base44_user');
    if (!userData) return;
    const token = JSON.parse(userData)?.token;
    const newSocket = io(SOCKET_URL, { auth: { token } });
    socket.current = newSocket;
    newSocket.on('onlineUsers', (users) => setOnlineUsers(users));
    return () => newSocket.disconnect();
  }, []);

  const handleSelectConversation = (id) => {
      setSelectedConversationId(id);
      setShowList(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] bg-background border-none md:border rounded-none md:rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-card/30 backdrop-blur-xl ${!showList && 'hidden md:flex'}`}>
        <div className="p-6 border-b space-y-4">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tighter">
                <ArrowRightLeft className="text-primary w-7 h-7" />
                {t('offers')}
            </h2>
            <div className="relative group">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder={t('searchOffers')}
                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-grow overflow-y-auto scrollbar-none">
            {isLoadingConversations ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : filteredConversations.map(convo => {
                const otherParticipant = convo.participants.find(p => p !== me?.email);
                const isOnline = onlineUsers.some(u => u.email === otherParticipant);
                const isSelected = selectedConversationId === convo._id;
                const unreadCount = convo.unread_count?.[me?.email] || 0;

                return (
                    <div 
                        key={convo._id}
                        onClick={() => handleSelectConversation(convo._id)}
                        className={`p-5 cursor-pointer border-b border-border/40 transition-all flex items-center gap-4 ${
                            isSelected ? 'bg-primary/10 border-l-4 border-l-primary shadow-inner' : 'hover:bg-muted/40 border-l-4 border-l-transparent'
                        }`}
                    >
                        <div className="relative">
                            <img src={`https://avatar.vercel.sh/${otherParticipant}.svg`} className="w-12 h-12 rounded-2xl shadow-md" alt="" />
                            {isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-4 border-card shadow-lg" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-black text-sm truncate">{otherParticipant}</p>
                                <span className="text-[10px] font-bold opacity-40">{format(new Date(convo.last_message_at), 'p')}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate font-bold">{convo.last_message || t('noMessagesYet')}</p>
                        </div>
                        {unreadCount > 0 && (
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-[10px] font-black">{unreadCount}</div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col bg-card/5 backdrop-blur-sm ${showList && 'hidden md:flex'}`}>
        {selectedConversationId ? (
          <div className="flex-1 flex flex-col p-6 md:p-12 items-center justify-center space-y-12">
            <div className="flex items-center gap-4 md:hidden self-start mb-8">
                <button onClick={() => setShowList(true)} className="p-3 bg-muted/20 rounded-2xl"><ChevronLeft size={20}/></button>
                <h3 className="font-black text-lg">{selectedConversation?.participants.find(p => p !== me?.email)}</h3>
            </div>

            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle size={40} className="text-primary opacity-40" />
            </div>

            <div className="text-center space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase">{t('negotiationRoom')}</h2>
                <p className="text-muted-foreground font-bold max-w-sm mx-auto">{t('selectOfferPrompt')}</p>
            </div>

            <OfferSummaryCard 
                tradeId={selectedConversation?.related_trade_id?._id || selectedConversation?.related_trade_id} 
                onOpen={() => setIsNegotiationOpen(true)}
            />

            <div className="flex gap-8 opacity-20">
                <div className="flex flex-col items-center gap-2"><Clock size={24}/><span className="text-[10px] font-black uppercase">{t('pending')}</span></div>
                <div className="flex flex-col items-center gap-2"><Check size={24}/><span className="text-[10px] font-black uppercase">{t('accept')}</span></div>
                <div className="flex flex-col items-center gap-2"><X size={24}/><span className="text-[10px] font-black uppercase">{t('decline')}</span></div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
            <div className="w-48 h-48 bg-primary/5 rounded-[4rem] flex items-center justify-center relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-dashed border-primary/10 rounded-[4rem]" />
                <ArrowRightLeft size={80} className="text-primary opacity-20" />
            </div>
            <div className="max-w-xs space-y-3">
                <h3 className="text-3xl font-black tracking-tighter uppercase">{t('yourOffers')}</h3>
                <p className="text-sm font-bold text-muted-foreground/60">{t('selectOfferPrompt')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Negotiation Room Popup */}
      {selectedConversation && (
          <TradeNegotiationModal 
            isOpen={isNegotiationOpen} 
            onClose={() => setIsNegotiationOpen(false)}
            tradeId={selectedConversation?.related_trade_id?._id || selectedConversation?.related_trade_id}
            conversationId={selectedConversationId}
          />
      )}
    </div>
  );
}
