import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getTradeById, 
    updateTradeStatus, 
    getItem, 
    getMe, 
    getMessages, 
    sendMessage, 
    uploadMessageMedia 
} from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { 
    Loader2, X, ArrowRightLeft, DollarSign, Package, Check, 
    AlertCircle, Send, Image, Mic, CheckCheck, Info, HeartHandshake,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import io from 'socket.io-client';
import AudioRecorder from '../common/AudioRecorder';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

export default function TradeNegotiationModal({ isOpen, onClose, tradeId, conversationId }) {
  const { t, language } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [messageContent, setMessageContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ['user', 'me'], queryFn: getMe, enabled: isOpen });

  const { data: trade, isLoading: isLoadingTrade, error } = useQuery({
    queryKey: ['trade', tradeId],
    queryFn: () => getTradeById(tradeId),
    enabled: isOpen && !!tradeId,
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: isOpen && !!conversationId,
  });

  const messages = useMemo(() => Array.isArray(messagesData) ? messagesData : [], [messagesData]);

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

  const isReceiver = me && trade && trade.receiver_email === me.email;
  const isInitiator = me && trade && trade.initiator_email === me.email;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTradeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['trade', tradeId]);
      queryClient.invalidateQueries(['conversations']);
      toast.success(t('statusUpdated'));
    },
    onError: (err) => {
      toast.error(err.message || t('failedToUpdateStatus'));
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage) => sendMessage(conversationId, newMessage),
    onSuccess: () => {
        setMessageContent('');
        queryClient.invalidateQueries(['messages', conversationId]);
    }
  });

  const mediaMutation = useMutation({
    mutationFn: (mediaData) => uploadMessageMedia(mediaData),
    onSuccess: (data) => {
      const fileType = data.url.match(/\.(mp3|wav|ogg|webm)$/i) ? 'voice' : 'image';
      sendMessageMutation.mutate({
        conversation_id: conversationId,
        content: data.url,
        type: fileType,
      });
    }
  });

  // Socket setup
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const userData = localStorage.getItem('base44_user');
    if (!userData) return;

    const token = JSON.parse(userData)?.token;
    const newSocket = io(SOCKET_URL, { auth: { token } });
    socket.current = newSocket;

    newSocket.on('connect', () => {
        newSocket.emit('joinConversation', { conversationId });
    });
    
    newSocket.on('newMessage', (newMessage) => {
      if (newMessage.conversation_id === conversationId) {
          queryClient.setQueryData(['messages', conversationId], (old) => [...(old || []), newMessage]);
          queryClient.invalidateQueries(['conversations']);
      }
    });

    newSocket.on('typing', () => setIsTyping(true));
    newSocket.on('stopTyping', () => setIsTyping(false));

    return () => {
        if (socket.current) {
            socket.current.emit('leaveConversation', { conversationId });
            socket.current.disconnect();
        }
    };
  }, [isOpen, conversationId, queryClient]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate({
        conversation_id: conversationId,
        content: messageContent,
    });
  };

  const handleTyping = (e) => {
    setMessageContent(e.target.value);
    if (socket.current) socket.current.emit('typing', { conversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket.current) socket.current.emit('stopTyping', { conversationId });
    }, 2000);
  };

  const renderItemSmall = (item) => {
    const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
    const currencySymbol = currency === 'ILS' ? '₪' : '$';
    return (
        <div key={item._id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-xl border border-border/50">
            <img src={item.images?.[0]} alt="" className="w-10 h-10 object-cover rounded-lg shadow-sm" />
            <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-black truncate">{item.title}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{currencySymbol}{displayValue.toLocaleString()}</p>
            </div>
        </div>
    );
  };

  const [activeTab, setActiveTab] = useState('chat'); // 'details' or 'chat' for mobile

  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background w-full max-w-6xl h-full md:h-[90vh] rounded-none md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10"
      >
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex border-b border-white/10">
            <button 
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
                {t('tradeSummary')}
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
                {t('negotiationRoom')}
            </button>
        </div>

        {/* Left Side: Trade Details (Items) */}
        <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-card/20 overflow-y-auto ${activeTab !== 'details' && 'hidden md:flex'}`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ArrowRightLeft className="text-primary w-6 h-6" />
                    <h2 className="text-xl font-black tracking-tighter uppercase">{t('tradeSummary')}</h2>
                </div>
                <button onClick={onClose} className="md:hidden p-2 hover:bg-muted rounded-full transition-all">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-8 flex-grow">
                {/* Offered */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {t('offered')}
                    </h3>
                    <div className="space-y-2">
                        {offeredItems.map(renderItemSmall)}
                        {trade?.cash_offered > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 font-black text-sm">
                                <DollarSign size={16} />
                                <span>+{currencySymbol}{trade.cash_offered.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Requested */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {t('requested')}
                    </h3>
                    <div className="space-y-2">
                        {requestedItems.map(renderItemSmall)}
                        {trade?.cash_requested > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 font-black text-sm">
                                <DollarSign size={16} />
                                <span>+{currencySymbol}{trade.cash_requested.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Badge */}
                <div className="pt-4 border-t border-white/5">
                    <div className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 border shadow-lg ${
                        trade?.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                        trade?.status === 'accepted' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                        trade?.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                    }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                            trade?.status === 'pending' ? 'bg-yellow-500' :
                            trade?.status === 'accepted' ? 'bg-green-500' :
                            'bg-red-500'
                        }`} />
                        <span className="text-xs font-black uppercase tracking-widest">{t(trade?.status || 'pending')}</span>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-white/10 bg-black/20">
                {isReceiver && trade?.status === 'pending' && (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => statusMutation.mutate({ id: tradeId, status: 'rejected' })}
                                className="py-3 px-4 rounded-2xl border-2 border-red-500/50 text-red-500 font-black text-xs uppercase hover:bg-red-500/10 transition-all active:scale-95"
                            >
                                {t('decline')}
                            </button>
                            <button 
                                onClick={() => statusMutation.mutate({ id: tradeId, status: 'accepted' })}
                                className="py-3 px-4 rounded-2xl bg-green-500 text-white font-black text-xs uppercase shadow-xl shadow-green-500/20 hover:bg-green-600 transition-all active:scale-95"
                            >
                                {t('accept')}
                            </button>
                        </div>
                        <button 
                            onClick={() => {
                                // Close negotiation and open offer modal logic could be here
                                // For now, we'll just toast that it's coming soon or use a shared state
                                toast.info("Use the chat to discuss changes, then send a new offer if needed.");
                            }}
                            className="w-full py-3 rounded-2xl border-2 border-primary/50 text-primary font-black text-xs uppercase hover:bg-primary/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft size={14} />
                            {t('counterOffer')}
                        </button>
                    </div>
                )}
                {isInitiator && trade?.status === 'pending' && (
                    <button 
                        onClick={() => statusMutation.mutate({ id: tradeId, status: 'cancelled' })}
                        className="w-full py-3 rounded-2xl border-2 border-red-500/50 text-red-500 font-black text-xs uppercase hover:bg-red-500/10 transition-all active:scale-95"
                    >
                        {t('cancel')}
                    </button>
                )}
            </div>
        </div>

        {/* Right Side: Chat Interface (Restored Previous Look) */}
        <div className={`flex-1 flex flex-col bg-background relative overflow-hidden ${activeTab !== 'chat' && 'hidden md:flex'}`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-card/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Info className="text-primary w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tighter">{t('negotiationRoom')}</h2>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('chatWithUser')}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="hidden md:block p-2 hover:bg-muted rounded-full transition-all bg-muted/20">
                    <X size={20} />
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-none">
                {isLoadingMessages ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : messages.length > 0 ? (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_email === me?.email;
                        const isSameAsPrev = idx > 0 && messages[idx-1].sender_email === msg.sender_email;
                        
                        return (
                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameAsPrev ? '-mt-4' : 'mt-2'}`}>
                                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isSameAsPrev && (
                                        <span className="text-[9px] font-black uppercase tracking-widest mb-1 px-2 opacity-40">
                                            {isMe ? t('you') : msg.sender_email.split('@')[0]}
                                        </span>
                                    )}
                                    <div className={`p-4 shadow-xl rounded-3xl transition-all ${
                                        isMe 
                                        ? 'bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground rounded-tr-sm' 
                                        : 'bg-card text-card-foreground border border-white/5 rounded-tl-sm'
                                    }`}>
                                        {msg.type === 'image' ? (
                                            <img src={msg.content} alt="" className="w-full max-w-sm h-auto rounded-2xl" />
                                        ) : msg.type === 'voice' ? (
                                            <audio controls src={msg.content} className="w-full max-w-[200px] h-8 filter invert dark:invert-0" />
                                        ) : msg.type === 'offer' ? (
                                            <div className="p-3 bg-black/20 rounded-2xl border border-white/5 flex items-center gap-3">
                                                <HeartHandshake className="text-primary" size={24} />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase opacity-60">{t('tradeOffer')}</p>
                                                    <p className="text-sm font-bold">{msg.content}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm font-bold leading-relaxed tracking-tight">{msg.content}</p>
                                        )}
                                        <div className="flex justify-end mt-2 opacity-50">
                                            <span className="text-[8px] font-black">{format(new Date(msg.createdAt), 'p')}</span>
                                            {isMe && (msg.read ? <CheckCheck size={10} className="ml-1 text-blue-300" /> : <Check size={10} className="ml-1" />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 opacity-20">
                        <Send size={64} />
                        <p className="font-black text-xl uppercase mt-4 tracking-tighter">{t('startConversation')}</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-white/10 bg-background/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button onClick={() => fileInputRef.current.click()} className="p-3 text-muted-foreground hover:bg-muted hover:text-primary rounded-2xl bg-muted/20 transition-all">
                            <Image size={20} />
                        </button>
                    </div>
                    <div className="flex-grow relative group">
                        <input 
                            type="text"
                            value={messageContent}
                            onChange={handleTyping}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={t('negotiatePrompt')}
                            className="w-full bg-muted/40 border-none p-4 pr-12 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-bold transition-all"
                        />
                        <AnimatePresence>
                            {messageContent.trim() && (
                                <motion.button 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    onClick={handleSendMessage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-xl"
                                >
                                    <Send size={16} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                    {!messageContent.trim() && (
                        <AudioRecorder onRecordingComplete={(file) => {
                            const fd = new FormData();
                            fd.append('media', file);
                            mediaMutation.mutate(fd);
                        }} isUploading={mediaMutation.isLoading} />
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    if (e.target.files[0]) {
                        const fd = new FormData();
                        fd.append('media', e.target.files[0]);
                        mediaMutation.mutate(fd);
                    }
                }} />
            </div>
        </div>
      </motion.div>
    </div>
  );
}
