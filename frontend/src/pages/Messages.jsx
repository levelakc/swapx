import io from 'socket.io-client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getConversations, 
    getMessages, 
    sendMessage, 
    getMe, 
    uploadMessageMedia, 
    startSupportChat, 
    getTradeById, 
    updateTradeStatus,
    getItem
} from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
    Loader2, Send, Image, Mic, Check, CheckCheck, HeartHandshake, X, 
    MessageCircle, Link as LinkIcon, ChevronLeft, Search, Package, 
    ArrowRightLeft, DollarSign, AlertCircle, Info, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import AudioRecorder from '../components/common/AudioRecorder';
import MakeOfferModal from '../components/trade/MakeOfferModal';
import ShareItemModal from '../components/trade/ShareItemModal';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

function TradePreview({ tradeId, isMe }) {
    const { t } = useLanguage();
    const { currency, convertCurrency } = useCurrency();
    const queryClient = useQueryClient();

    const { data: trade, isLoading, error } = useQuery({
        queryKey: ['trade', tradeId],
        queryFn: () => getTradeById(tradeId),
        enabled: !!tradeId,
    });

    // Fetch details for all items in the trade
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

    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => updateTradeStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries(['trade', tradeId]);
            queryClient.invalidateQueries(['conversations']);
            toast.success(t('statusUpdated', 'Status updated!'));
        },
        onError: (err) => {
            toast.error(err.message || t('failedToUpdateStatus'));
        }
    });

    if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (error || !trade) return null;

    const isReceiver = !isMe; // Simplified for this view context
    const currencySymbol = currency === 'ILS' ? '₪' : '$';

    const renderItemSmall = (item) => (
        <div key={item._id} className="flex items-center gap-2 p-1.5 bg-background/50 rounded-lg border border-border/50">
            <img src={item.images?.[0]} alt="" className="w-8 h-8 object-cover rounded shadow-xs" />
            <span className="text-[10px] font-bold truncate max-w-[80px]">{item.title}</span>
        </div>
    );

    return (
        <div className="bg-card border-b p-3 md:p-4 shadow-sm relative overflow-hidden">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-full -mr-16 -mt-16 ${
                trade.status === 'accepted' ? 'bg-green-500' : 
                trade.status === 'rejected' || trade.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'
            }`}></div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center relative">
                <div className="flex-1 grid grid-cols-2 gap-4 w-full md:w-auto">
                    {/* Offered */}
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            <Package size={12} className="text-blue-500" /> {t('offered')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {offeredItems.map(renderItemSmall)}
                            {trade.cash_offered > 0 && (
                                <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                                    +{currencySymbol}{trade.cash_offered}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Requested */}
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            <Package size={12} className="text-purple-500" /> {t('requested')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {requestedItems.map(renderItemSmall)}
                            {trade.cash_requested > 0 && (
                                <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                    +{currencySymbol}{trade.cash_requested}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 items-center md:items-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-xs ${
                        trade.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        trade.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                        trade.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                        {t(trade.status)}
                    </div>

                    {trade.status === 'pending' && (
                        <div className="flex gap-2 ml-auto md:ml-0">
                            {trade.receiver_email === queryClient.getQueryData(['user', 'me'])?.email ? (
                                <>
                                    <button 
                                        onClick={() => statusMutation.mutate({ id: tradeId, status: 'rejected' })}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                                        title={t('decline')}
                                    >
                                        <X size={16} />
                                    </button>
                                    <button 
                                        onClick={() => statusMutation.mutate({ id: tradeId, status: 'accepted' })}
                                        className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded-lg shadow-sm transition-colors"
                                        title={t('accept')}
                                    >
                                        <Check size={16} />
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => statusMutation.mutate({ id: tradeId, status: 'cancelled' })}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                                    title={t('cancel')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Messages() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showList, setShowList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ['user', 'me'], queryFn: getMe });

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  // Filter to only show trade-related conversations or support
  const tradeConversations = useMemo(() => {
    return conversations.filter(c => c.related_trade_id || c.participants.some(p => p.includes('sona') || p.includes('support')));
  }, [conversations]);

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => getMessages(selectedConversationId),
    enabled: !!selectedConversationId && !!me,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const messages = useMemo(() => Array.isArray(messagesData) ? messagesData : [], [messagesData]);

  const filteredConversations = useMemo(() => {
    const list = tradeConversations;
    if (!searchQuery) return list;
    return list.filter(convo => {
        const otherParticipant = convo.participants.find(p => p !== me?.email) || '';
        return otherParticipant.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [tradeConversations, searchQuery, me?.email]);

  const selectedConversation = useMemo(() => 
    conversations.find(c => c._id === selectedConversationId), 
    [conversations, selectedConversationId]
  );

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage) => sendMessage(newMessage.conversation_id, newMessage),
    onMutate: async (newMessage) => {
        await queryClient.cancelQueries(['messages', selectedConversationId]);
        const previousMessages = queryClient.getQueryData(['messages', selectedConversationId]);
        
        const optimisticMsg = {
            _id: 'temp-' + Date.now(),
            ...newMessage,
            sender_email: me?.email,
            createdAt: new Date().toISOString(),
            read: false,
        };
        
        queryClient.setQueryData(['messages', selectedConversationId], (old) => [...(old || []), optimisticMsg]);
        return { previousMessages };
    },
    onError: (err, newMessage, context) => {
        queryClient.setQueryData(['messages', selectedConversationId], context.previousMessages);
        toast.error(t('failedToSendChatMessage'));
    },
    onSuccess: (data) => {
        setMessageContent('');
        queryClient.invalidateQueries(['messages', selectedConversationId]);
        queryClient.invalidateQueries(['conversations']);
    }
  });

  const mediaMutation = useMutation({
    mutationFn: (mediaData) => uploadMessageMedia(mediaData),
    onSuccess: (data) => {
      const fileType = data.url.match(/\.(mp3|wav|ogg|webm)$/i) ? 'voice' : 'image';
      sendMessageMutation.mutate({
        conversation_id: selectedConversationId,
        content: data.url,
        type: fileType,
      });
    },
    onError: (error) => {
      toast.error(error.message || t('failedToUploadMedia'));
    }
  });

  const handleAudioRecorded = (file) => {
    const formData = new FormData();
    formData.append('media', file);
    mediaMutation.mutate(formData);
  };

  const handleSendOffer = (offerData) => {
    const itemsCount = offerData.offeredItems.length;
    const cashText = offerData.cash.amount > 0 
        ? (offerData.cash.type === 'add' ? ` + ${offerData.cash.amount} cash` : ` asking for ${offerData.cash.amount} cash`) 
        : '';
    
    const content = `New Counter Offer: ${itemsCount} items${cashText}`;
    
    sendMessageMutation.mutate({ 
        conversation_id: selectedConversationId,
        content: content, 
        type: 'counter', 
        trade_data: offerData 
    });
    toast.success(t('offerSent'));
  };

  const handleShareItem = (item) => {
      const link = `${window.location.origin}/item/${item._id}`;
      const content = `Check out my item: ${item.title}\n${link}`;
      sendMessageMutation.mutate({
          conversation_id: selectedConversationId,
          content: content,
      });
      toast.success('Item shared');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);
    mediaMutation.mutate(formData);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate({
        conversation_id: selectedConversationId,
        content: messageContent,
    });
  };

  // Socket Connection
  useEffect(() => {
    const userData = localStorage.getItem('base44_user');
    if (!userData) return;

    const token = JSON.parse(userData)?.token;
    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    socket.current = newSocket;

    newSocket.on('connect', () => console.log('Socket connected'));
    
    newSocket.on('newMessage', (newMessage) => {
      queryClient.setQueryData(['messages', newMessage.conversation_id], (oldData) => {
        if (!oldData) return [newMessage];
        if (oldData.some(m => m._id === newMessage._id || (m._id.length < 20 && m.content === newMessage.content))) {
            return oldData.map(m => m.content === newMessage.content && m._id.length < 20 ? newMessage : m);
        }
        return [...oldData, newMessage];
      });
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['trade']);
    });

    newSocket.on('typing', ({ user }) => setIsTyping(true));
    newSocket.on('stopTyping', () => setIsTyping(false));
    
    newSocket.on('messagesRead', ({ messageIds }) => {
      queryClient.setQueryData(['messages', selectedConversationId], (oldData) => {
        if (!oldData) return [];
        return oldData.map(message => messageIds.includes(message._id) ? { ...message, read: true } : message);
      });
    });

    newSocket.on('onlineUsers', (users) => setOnlineUsers(users));

    return () => newSocket.disconnect();
  }, [queryClient, me?.email, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId && socket.current) {
      socket.current.emit('joinConversation', { conversationId: selectedConversationId });
      return () => {
        socket.current.emit('leaveConversation', { conversationId: selectedConversationId });
      };
    }
  }, [selectedConversationId]);

  const handleTyping = (e) => {
    setMessageContent(e.target.value);
    if (socket.current) {
      socket.current.emit('typing', { conversationId: selectedConversationId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket.current) socket.current.emit('stopTyping', { conversationId: selectedConversationId });
    }, 2000);
  };

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (messagesEndRef.current) {
        const behavior = isInitialLoad.current ? 'auto' : 'smooth';
        messagesEndRef.current.scrollIntoView({ behavior });
        isInitialLoad.current = false;
    }
  }, [messages, isTyping]);

  const handleSelectConversation = (id) => {
      isInitialLoad.current = true;
      setSelectedConversationId(id);
      setShowList(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] bg-background border rounded-none md:rounded-xl overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* Offers List Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-card/50 backdrop-blur-md ${!showList && 'hidden md:flex'}`}>
        <div className="p-4 border-b space-y-4 bg-background/40">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-2 tracking-tighter">
                    <ArrowRightLeft className="text-primary" />
                    {t('offers', 'Offers')}
                </h2>
                <div className="bg-primary/10 px-2 py-0.5 rounded text-[10px] font-black uppercase text-primary">Beta</div>
            </div>

            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder={t('searchOffers', 'Filter offers...')}
                    className="w-full pl-9 pr-4 py-2 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
            {isLoadingConversations ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : filteredConversations.length > 0 ? (
                filteredConversations.map(convo => {
                    const otherParticipant = convo.participants.find(p => p !== me?.email);
                    const isOnline = onlineUsers.some(u => u.email === otherParticipant);
                    const isSelected = selectedConversationId === convo._id;
                    const unreadCount = convo.unread_count?.[me?.email] || 0;
                    const isSupport = convo.participants.some(p => p.includes('sona') || p.includes('support'));

                    return (
                        <div 
                            key={convo._id}
                            onClick={() => handleSelectConversation(convo._id)}
                            className={`p-4 cursor-pointer border-b transition-all relative group ${
                                isSelected 
                                ? 'bg-primary/10 border-l-4 border-l-primary shadow-inner' 
                                : 'hover:bg-muted/50 border-l-4 border-l-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted'}`}></div>
                                    <p className={`font-bold text-sm tracking-tight truncate max-w-[150px] ${unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {isSupport ? t('supportChat', 'SwapX Support') : otherParticipant}
                                    </p>
                                </div>
                                <p className="text-[9px] font-medium text-muted-foreground/60">{format(new Date(convo.last_message_at), 'p')}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {convo.related_trade_id && (
                                    <div className="flex-shrink-0 bg-primary/20 p-1 rounded">
                                        <Package size={10} className="text-primary" />
                                    </div>
                                )}
                                <p className={`text-xs truncate flex-1 ${unreadCount > 0 ? 'font-bold text-foreground' : 'text-muted-foreground/80'}`}>
                                    {convo.last_message || t('noMessagesYet', 'No messages yet')}
                                </p>
                            </div>

                            {unreadCount > 0 && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-bounce">
                                    {unreadCount}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center opacity-40">
                        <ArrowRightLeft size={32} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-foreground font-bold">{t('noOffersFound', 'No active offers found')}</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">{t('startTradingPrompt', 'Find items you like and send an offer to start a conversation!')}</p>
                    </div>
                    <button 
                        onClick={() => {
                            startSupportChat().then(convo => {
                                queryClient.invalidateQueries(['conversations']);
                                setSelectedConversationId(convo._id);
                                setShowList(false);
                            }).catch(err => toast.error('Failed to start chat'));
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black hover:bg-primary/90 transition-all shadow-lg active:scale-95"
                    >
                        <MessageCircle size={14}/> {t('askHelp', 'Need Help?')}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Main Area: Trade Preview + Chat */}
      <div className={`flex-1 flex flex-col bg-background ${showList && 'hidden md:flex'}`}>
        {selectedConversationId ? (
          <>
            {/* Header / Trade Preview */}
            <div className="flex flex-col">
                <div className="p-3 border-b flex items-center justify-between bg-card/30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowList(true)} className="md:hidden p-2 hover:bg-muted rounded-full transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <p className="font-black text-sm">{selectedConversation?.participants.find(p => p !== me?.email)}</p>
                            {isTyping && <p className="text-[10px] text-primary font-bold animate-pulse">{t('typing', 'typing...')}</p>}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setIsOfferModalOpen(true)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title={t('makeCounterOffer', 'Counter Offer')}>
                            <ArrowRightLeft size={18} />
                        </button>
                    </div>
                </div>

                {/* Persistent Trade Preview */}
                {selectedConversation?.related_trade_id && (
                    <TradePreview 
                        tradeId={selectedConversation.related_trade_id?._id || selectedConversation.related_trade_id} 
                        isMe={true} 
                    />
                )}
            </div>

            {/* Messages List */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-muted/5 scroll-smooth">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>
              ) : messages.length > 0 ? (
                messages.map(msg => {
                    const isMe = msg.sender_email === me?.email;
                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl shadow-sm ${
                                isMe 
                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                : 'bg-card text-card-foreground border border-border rounded-tl-none'
                            }`}>
                                {msg.type === 'image' ? (
                                    <img src={msg.content} alt="" className="w-full h-auto rounded-lg mb-1 shadow-sm" />
                                ) : msg.type === 'voice' ? (
                                    <audio controls src={msg.content} className="w-full max-w-[240px] h-8" />
                                ) : msg.type === 'offer' || msg.type === 'counter' ? (
                                    <div className="p-2 bg-black/10 rounded-xl space-y-2 mb-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80 border-b border-white/10 pb-1">
                                            <HeartHandshake size={14} />
                                            <span>{msg.type === 'offer' ? t('tradeOffer') : t('counterOffer')}</span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed italic">"{msg.content}"</p>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed font-medium">{msg.content}</p>
                                )}
                                <div className="flex items-center justify-end mt-1.5 gap-1 opacity-60">
                                    <p className={`text-[8px] font-bold ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                        {format(new Date(msg.createdAt), 'p')}
                                    </p>
                                    {isMe && (
                                        msg.read ? <CheckCheck size={10} className="text-blue-300" /> : <Check size={10} className="" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 py-20">
                    <MessageCircle size={64} className="mb-4" />
                    <p className="font-bold">{t('startChatPrompt', 'No messages in this offer yet')}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t bg-background/80 backdrop-blur-md">
              <div className="flex items-center gap-2 max-w-5xl mx-auto">
                  <div className="flex items-center gap-0.5">
                      <button onClick={() => setIsShareModalOpen(true)} className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors" title="Share Item">
                        <LinkIcon size={18} />
                      </button>
                      <button onClick={() => fileInputRef.current.click()} className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors" title={t('sendImage')}>
                        <Image size={18} />
                      </button>
                  </div>
                  
                  <div className="flex-grow relative">
                      <input 
                        type="text" 
                        value={messageContent}
                        onChange={handleTyping}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('negotiatePrompt', 'Message about this offer...')}
                        className="w-full bg-muted/30 border border-border/50 p-2.5 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium transition-all"
                      />
                      {messageContent.trim() && (
                          <button onClick={handleSendMessage} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-1.5 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20">
                              <Send size={14} />
                          </button>
                      )}
                  </div>
                  
                  {!messageContent.trim() && (
                      <AudioRecorder onRecordingComplete={handleAudioRecorded} isUploading={mediaMutation.isLoading} />
                  )}
              </div>
              
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center space-y-6">
            <div className="w-32 h-32 bg-muted/20 rounded-full flex items-center justify-center relative shadow-inner">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full"
                ></motion.div>
                <ArrowRightLeft size={48} className="text-primary/30" />
            </div>
            <div className="max-w-xs space-y-2">
                <h3 className="text-2xl font-black text-foreground tracking-tighter">{t('yourOffers', 'Offer Center')}</h3>
                <p className="text-sm font-medium leading-relaxed">{t('selectOfferPrompt', 'Select an offer from the sidebar to view details and negotiate.')}</p>
            </div>
            <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center"><Check size={20}/></div>
                    <span className="text-[10px] font-bold uppercase">{t('accept')}</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center"><X size={20}/></div>
                    <span className="text-[10px] font-bold uppercase">{t('decline')}</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center"><ArrowRightLeft size={20}/></div>
                    <span className="text-[10px] font-bold uppercase">{t('counter')}</span>
                </div>
            </div>
          </div>
        )}
      </div>

      <MakeOfferModal isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)} onSubmit={handleSendOffer} />
      <ShareItemModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onSubmit={handleShareItem} />
    </div>
  );
}
