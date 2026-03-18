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
    Clock, ShieldCheck, CircleDollarSign, Trash2
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
                                    <CircleDollarSign size={20} />
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

function ChatMessage({ msg, me, onOpenNegotiation, t }) {
    const isMe = msg.sender_email === me?.email;
    const isSystem = msg.sender_email === 'system@ahlafot.com' || msg.sender_email === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <div className="px-4 py-2 bg-muted/50 rounded-full border border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{msg.content}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-3xl shadow-sm ${
                isMe 
                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                : 'bg-card text-card-foreground border border-border rounded-tl-none'
            }`}>
                {msg.type === 'offer' ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <ArrowRightLeft size={20} className={isMe ? 'text-white' : 'text-primary'} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('tradeOffer')}</p>
                                <p className="text-sm font-bold">{msg.content}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onOpenNegotiation}
                            className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                                isMe 
                                ? 'bg-white/20 hover:bg-white/30 text-white' 
                                : 'bg-primary text-white hover:opacity-90'
                            }`}
                        >
                            <ExternalLink size={14} />
                            {t('openNegotiation')}
                        </button>
                    </div>
                ) : msg.type === 'image' ? (
                    <img src={msg.content} alt="" className="w-full rounded-2xl cursor-pointer hover:opacity-90" onClick={() => window.open(msg.content, '_blank')} />
                ) : (
                    <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                )}
                <div className={`text-[9px] mt-2 font-black uppercase opacity-40 flex justify-end`}>
                    {format(new Date(msg.createdAt), 'p')}
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
  const [message, setMessage] = useState('');
  
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ['user', 'me'], queryFn: getMe });

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => getMessages(selectedConversationId),
    enabled: !!selectedConversationId,
    refetchInterval: 5000,
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

  const sendMessageMutation = useMutation({
    mutationFn: (msgData) => sendMessage(selectedConversationId, msgData),
    onSuccess: (newMsg) => {
        setMessage('');
        queryClient.setQueryData(['messages', selectedConversationId], (old = []) => [...old, newMsg]);
        queryClient.invalidateQueries(['conversations']);
    }
  });

  // Socket setup
  useEffect(() => {
    const userData = localStorage.getItem('base44_user');
    if (!userData) return;
    const token = JSON.parse(userData)?.token;
    const newSocket = io(SOCKET_URL, { auth: { token } });
    socket.current = newSocket;
    
    newSocket.on('onlineUsers', (users) => setOnlineUsers(users));
    
    newSocket.on('newMessage', (newMsg) => {
        if (newMsg.conversation_id === selectedConversationId) {
            queryClient.setQueryData(['messages', selectedConversationId], (old = []) => [...old, newMsg]);
            queryClient.invalidateQueries(['conversations']);
        }
    });

    return () => newSocket.disconnect();
  }, [selectedConversationId, queryClient]);

  useEffect(() => {
    if (selectedConversationId && socket.current) {
        socket.current.emit('joinConversation', { conversationId: selectedConversationId });
    }
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (id) => {
      setSelectedConversationId(id);
      setShowList(false);
  };

  const handleSendMessage = () => {
      if (!message.trim()) return;
      sendMessageMutation.mutate({ content: message, type: 'text' });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] bg-background border-none md:border rounded-none md:rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* Sidebar (Existing logic) */}
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

      {/* Main Content Area (REFACTORED TO CHAT) */}
      <div className={`flex-1 flex flex-col bg-card/5 backdrop-blur-sm ${showList && 'hidden md:flex'}`}>
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-card/20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowList(true)} className="p-2.5 bg-muted/20 rounded-xl md:hidden hover:bg-muted/40 transition-all">
                        <ChevronLeft size={18}/>
                    </button>
                    <div className="flex items-center gap-3">
                        <img src={`https://avatar.vercel.sh/${selectedConversation?.participants.find(p => p !== me?.email)}.svg`} className="w-10 h-10 rounded-xl" alt="" />
                        <div>
                            <p className="font-black text-sm uppercase tracking-tight">{selectedConversation?.participants.find(p => p !== me?.email)}</p>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${onlineUsers.some(u => u.email === selectedConversation?.participants.find(p => p !== me?.email)) ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                                <span className="text-[9px] font-black uppercase opacity-40">{onlineUsers.some(u => u.email === selectedConversation?.participants.find(p => p !== me?.email)) ? t('online') : t('offline')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsNegotiationOpen(true)}
                    className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                >
                    {t('negotiationRoom')}
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-none">
                {isLoadingMessages ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : messages.length > 0 ? (
                    messages.map((msg, idx) => (
                        <ChatMessage 
                            key={msg._id} 
                            msg={msg} 
                            me={me} 
                            t={t} 
                            onOpenNegotiation={() => setIsNegotiationOpen(true)} 
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                        <MessageCircle size={64} />
                        <p className="font-black text-xl uppercase mt-4">{t('startConversation')}</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-white/5 bg-card/20">
                <div className="flex items-center gap-3 max-w-4xl mx-auto">
                    <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('typeAMessage')}
                        className="flex-1 bg-muted/40 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isLoading}
                        className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {sendMessageMutation.isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
          </>
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

      {/* Negotiation Room Popup (Logic remains same) */}
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

