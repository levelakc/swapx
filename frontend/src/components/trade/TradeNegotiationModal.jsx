import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getTradeById, 
    updateTradeStatus, 
    counterTrade,
    getItem, 
    getMe, 
    getMessages, 
    sendMessage, 
    uploadMessageMedia,
    getMyItems
} from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { 
    Loader2, X, ArrowRightLeft, DollarSign, Package, Check, 
    Send, Image as ImageIcon, CheckCheck, Info, HeartHandshake,
    Trash2, Edit3, Plus, Minus, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import io from 'socket.io-client';
import AudioRecorder from '../common/AudioRecorder';
import { motion, AnimatePresence } from 'framer-motion';
import ItemDetailsModal from './ItemDetailsModal';
import ImageWithFallback from '../common/ImageWithFallback';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

export default function TradeNegotiationModal({ isOpen, onClose, tradeId, conversationId }) {
  const { t, language } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const queryClient = useQueryClient();
  
  const [messageContent, setMessageContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ['user', 'me'], queryFn: getMe, enabled: isOpen });

  const { data: trade, isLoading: isLoadingTrade } = useQuery({
    queryKey: ['trade', tradeId],
    queryFn: () => getTradeById(tradeId),
    enabled: isOpen && !!tradeId,
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: isOpen && !!conversationId,
  });

  const { data: myInventoryData } = useQuery({
    queryKey: ['myItems'],
    queryFn: getMyItems,
    enabled: isOpen && isEditing,
  });

  const myInventory = myInventoryData?.items || [];

  const messages = useMemo(() => Array.isArray(messagesData) ? messagesData : [], [messagesData]);

  const { data: offeredItemsData = [] } = useQuery({
    queryKey: ['items', trade?.offered_items],
    queryFn: async () => {
      const items = await Promise.all(trade.offered_items.map(id => getItem(id).catch(() => null)));
      return items.filter(Boolean);
    },
    enabled: !!trade?.offered_items?.length,
  });

  const { data: requestedItemsData = [] } = useQuery({
    queryKey: ['items', trade?.requested_items],
    queryFn: async () => {
      const items = await Promise.all(trade.requested_items.map(id => getItem(id).catch(() => null)));
      return items.filter(Boolean);
    },
    enabled: !!trade?.requested_items?.length,
  });

  const isInitiator = me && trade && trade.initiator_email === me.email;
  const isReceiver = me && trade && trade.receiver_email === me.email;

  // Local state for edits
  const [draftMyItems, setDraftMyItems] = useState([]);
  const [draftTheirItems, setDraftTheirItems] = useState([]);
  const [draftMyCashOffered, setDraftMyCashOffered] = useState(0);
  const [draftMyCashRequested, setDraftMyCashRequested] = useState(0);

  useEffect(() => {
    if (trade && !isEditing) {
        if (isInitiator) {
            setDraftMyItems(trade.offered_items || []);
            setDraftTheirItems(trade.requested_items || []);
            setDraftMyCashOffered(trade.cash_offered || 0);
            setDraftMyCashRequested(trade.cash_requested || 0);
        } else {
            setDraftMyItems(trade.requested_items || []);
            setDraftTheirItems(trade.offered_items || []);
            setDraftMyCashOffered(trade.cash_requested || 0);
            setDraftMyCashRequested(trade.cash_offered || 0);
        }
    }
  }, [trade, isInitiator, isEditing]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
        // Clearing unread count on backend happens when messages are fetched
        // so we invalidate conversations to update the UI/Navbar ping
        queryClient.invalidateQueries(['conversations']);
    }
  }, [isOpen, messages.length, queryClient]);

  useEffect(() => {
    if (!isOpen) setIsEditing(false);
  }, [isOpen]);

  const myFullItems = isEditing 
    ? draftMyItems.map(id => myInventory.find(i => i._id === id) || offeredItemsData.find(i => i._id === id) || requestedItemsData.find(i => i._id === id)).filter(Boolean)
    : (isInitiator ? offeredItemsData : requestedItemsData);

  const theirFullItems = isInitiator ? requestedItemsData : offeredItemsData;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTradeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['trade', tradeId]);
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['messages', conversationId]);
      toast.success(t('statusUpdated'));
    },
    onError: (err) => toast.error(err.message || t('error'))
  });

  const counterMutation = useMutation({
    mutationFn: (data) => counterTrade(tradeId, data),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries(['trade', tradeId]);
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['messages', conversationId]);
      toast.success(t('offerSent'));
    },
    onError: (err) => toast.error(err.message || t('error'))
  });

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage) => sendMessage(conversationId, newMessage),
    onSuccess: () => {
        setMessageContent('');
        queryClient.invalidateQueries(['messages', conversationId]);
        toast.success(t('messageSentSuccessfully', 'Message sent!'));
    }
  });

  const mediaMutation = useMutation({
    mutationFn: (mediaData) => uploadMessageMedia(mediaData),
    onSuccess: (data) => {
      const fileType = data.url.match(/\.(mp3|wav|ogg|webm)$/i) ? 'voice' : 'image';
      sendMessageMutation.mutate({ conversation_id: conversationId, content: data.url, type: fileType });
    }
  });

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    const userData = localStorage.getItem('base44_user');
    if (!userData) return;
    const token = JSON.parse(userData)?.token;
    const newSocket = io(SOCKET_URL, { auth: { token } });
    socket.current = newSocket;

    newSocket.on('connect', () => newSocket.emit('joinConversation', { conversationId }));
    
    newSocket.on('newMessage', (newMsg) => {
      if (newMsg.conversation_id === conversationId) {
          queryClient.setQueryData(['messages', conversationId], (old) => {
              const currentMessages = Array.isArray(old) ? old : [];
              const alreadyExists = currentMessages.some(m => m._id === newMsg._id);
              if (alreadyExists) return currentMessages;
              
              const updated = [...currentMessages, newMsg];
              return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          });
          queryClient.invalidateQueries(['conversations']);
      } else if (newMsg.sender_email !== me?.email) {
          // Alert user about message in ANOTHER conversation
          toast(t('newMessageReceived'), {
              description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
          });
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
        const container = messagesEndRef.current.parentElement;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageContent.trim() || sendMessageMutation.isLoading) return;
    const content = messageContent;
    setMessageContent('');
    sendMessageMutation.mutate({ conversation_id: conversationId, content });
  };

  const handleTyping = (e) => {
    setMessageContent(e.target.value);
    if (socket.current) socket.current.emit('typing', { conversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket.current) socket.current.emit('stopTyping', { conversationId });
    }, 2000);
  };

  const translateSystemMessage = (content) => {
    if (!content) return content;
    const mapping = {
        'Sent you a trade offer!': t('sentTradeOffer'),
        'Counter offer sent!': t('offerCountered'),
        'I have updated my offer.': t('updatedOffer'),
        'Trade Accepted!': t('tradeAccepted'),
        'Trade Rejected': t('tradeRejected'),
        'Trade Cancelled': t('tradeCancelled'),
        'Offer Countered!': t('offerCountered'),
    };
    return mapping[content] || content;
  };

  const submitCounterOffer = () => {
      // Correctly map items back to their original roles for the backend
      const payload = {
          offered_items: isInitiator ? draftMyItems : draftTheirItems,
          requested_items: isInitiator ? draftTheirItems : draftMyItems,
          cash_offered: isInitiator ? draftMyCashOffered : draftMyCashRequested,
          cash_requested: isInitiator ? draftMyCashRequested : draftMyCashOffered,
          message: t('updatedOffer'),
      };
      counterMutation.mutate(payload);
  };

  const toggleMyItem = (itemId) => {
      if (draftMyItems.includes(itemId)) {
          setDraftMyItems(prev => prev.filter(id => id !== itemId));
      } else {
          setDraftMyItems(prev => [...prev, itemId]);
      }
  };

  const handleClose = () => {
      onClose();
  };

  const renderItemSmall = (item, isMine = false) => {
    const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
    const currencySymbol = currency === 'ILS' ? '₪' : '$';
    const isSelected = isMine && draftMyItems.includes(item._id);
    const canToggle = isEditing && isMine && !isTradeActionLoading && (trade?.status === 'pending' || trade?.status === 'countered');

    return (
        <div key={item._id} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${isSelected && isEditing ? 'bg-primary/10 border-primary' : 'bg-card/40 border-border/50'} ${canToggle ? 'cursor-pointer hover:bg-muted' : ''}`}>
            <div className="w-8 h-8 md:w-10 md:h-10 shrink-0">
                <ImageWithFallback 
                    src={item.images?.[0]} 
                    alt="" 
                    className="w-full h-full object-cover rounded-lg shadow-sm cursor-zoom-in hover:scale-105 transition-transform" 
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemForDetails(item);
                        setIsItemDetailsOpen(true);
                    }}
                />
            </div>
            <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => canToggle && toggleMyItem(item._id)}>
                <p className="text-[10px] md:text-xs font-black truncate">{item.title}</p>
                <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground">{currencySymbol}{displayValue.toLocaleString()}</p>
            </div>
            {canToggle && (
                <div className="mr-1 cursor-pointer" onClick={() => toggleMyItem(item._id)}>
                    {isSelected ? <Minus size={14} className="text-red-500" /> : <Plus size={14} className="text-green-500" />}
                </div>
            )}
        </div>
    );
  };

  const currencySym = currency === 'ILS' ? '₪' : '$';
  const isTradeActionLoading = statusMutation.isLoading || counterMutation.isLoading;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background w-full max-w-2xl h-[95vh] md:h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-primary/20 relative"
      >
        {trade?.status === 'cancelled' && (
            <div className="absolute inset-0 z-[710] bg-background/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                <div className="space-y-4">
                    <X size={48} className="mx-auto text-muted-foreground opacity-50" />
                    <p className="text-xl font-black uppercase tracking-tighter text-muted-foreground">{t('offerRemovedFromChat', 'Offer removed from the chat')}</p>
                    <button onClick={onClose} className="px-8 py-3 rounded-2xl bg-muted font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all">{t('close')}</button>
                </div>
            </div>
        )}
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-card/20 shrink-0">
            <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-primary w-5 h-5" />
                <h2 className="text-sm font-black tracking-tighter uppercase">{t('tradeOffer')}</h2>
            </div>
            <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    trade?.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                    trade?.status === 'accepted' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                    trade?.status === 'countered' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                    'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                    {t(trade?.status || 'pending')}
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-red-500 hover:text-white rounded-full transition-all bg-muted/20 text-muted-foreground group">
                    <X size={18} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            {/* Trade Windows (Stacked) */}
            <div className="p-4 flex flex-col gap-4 bg-card/5">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {/* Left: MY OFFER */}
                    <div className="flex flex-col bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-2 bg-white/5 border-b border-white/5 text-center shrink-0">
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">{t('yourOffer')}</p>
                        </div>
                        <div className="p-2 space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                            {isEditing ? (
                                myInventory.map(item => renderItemSmall(item, true))
                            ) : (
                                myFullItems.map(item => renderItemSmall(item, false))
                            )}
                            {(!isEditing && myFullItems.length === 0) && (
                                <div className="text-center p-2 opacity-30 text-[9px] uppercase font-black">{t('none')}</div>
                            )}
                        </div>
                        <div className="p-2 bg-white/5 border-t border-white/5 shrink-0 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{t('addCash')}</span>
                            {isEditing ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-green-500">{currencySym}</span>
                                    <input 
                                        type="number" 
                                        value={draftMyCashOffered} 
                                        disabled={isTradeActionLoading}
                                        onChange={e => setDraftMyCashOffered(Number(e.target.value))} 
                                        className={`w-12 md:w-16 bg-background border border-white/10 rounded px-1 py-0.5 text-[10px] font-bold text-green-500 text-right outline-none ${isTradeActionLoading && 'opacity-50'}`}
                                    />
                                </div>
                            ) : (
                                <span className="text-xs font-black text-green-500">{currencySym}{draftMyCashOffered.toLocaleString()}</span>
                            )}
                        </div>
                    </div>

                    {/* Right: THEIR OFFER */}
                    <div className="flex flex-col bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-2 bg-white/5 border-b border-white/5 text-center shrink-0">
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-purple-400">{t('theirItem')}</p>
                        </div>
                        <div className="p-2 space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                            {theirFullItems.map(item => renderItemSmall(item, false))}
                            {theirFullItems.length === 0 && (
                                <div className="text-center p-2 opacity-30 text-[9px] uppercase font-black">{t('none')}</div>
                            )}
                        </div>
                        <div className="p-2 bg-white/5 border-t border-white/5 shrink-0 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{t('requestCash')}</span>
                            {isEditing ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-blue-500">{currencySym}</span>
                                    <input 
                                        type="number" 
                                        value={draftMyCashRequested} 
                                        disabled={isTradeActionLoading}
                                        onChange={e => setDraftMyCashRequested(Number(e.target.value))} 
                                        className={`w-12 md:w-16 bg-background border border-white/10 rounded px-1 py-0.5 text-[10px] font-bold text-blue-500 text-right outline-none ${isTradeActionLoading && 'opacity-50'}`}
                                    />
                                </div>
                            ) : (
                                <span className="text-xs font-black text-blue-500">{currencySym}{draftMyCashRequested.toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="shrink-0 pt-2 border-t border-white/5">
                    {trade?.status === 'pending' || trade?.status === 'countered' ? (
                        isEditing ? (
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setIsEditing(false)} 
                                    disabled={isTradeActionLoading}
                                    className="py-2.5 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('cancel')}
                                </button>
                                <button 
                                    onClick={submitCounterOffer} 
                                    disabled={isTradeActionLoading} 
                                    className="py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTradeActionLoading ? <Loader2 size={14} className="animate-spin" /> : t('sendOffer')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <button 
                                    onClick={() => statusMutation.mutate({ id: tradeId, status: 'cancelled' })}
                                    disabled={isTradeActionLoading}
                                    className="py-2.5 rounded-xl border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {statusMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    {t('cancel')}
                                </button>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    disabled={isTradeActionLoading}
                                    className="py-2.5 rounded-xl bg-primary/20 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Edit3 size={14} />
                                    {t('counterOffer')}
                                </button>
                                {isReceiver && (
                                    <button 
                                        onClick={() => statusMutation.mutate({ id: tradeId, status: 'accepted' })}
                                        disabled={isTradeActionLoading}
                                        className="col-span-2 md:col-span-1 py-2.5 rounded-xl bg-green-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {statusMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                        {t('acceptOffer')}
                                    </button>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted/20 rounded-xl">
                            {t('tradeOffer')} {t(trade?.status)}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Interface (Integrated) */}
            <div className="flex-1 flex flex-col bg-background relative overflow-hidden min-h-[300px] border-t border-white/10">
                <div className="p-3 bg-card/10 border-b border-white/10 flex items-center gap-2 shrink-0">
                    <MessageCircle className="text-primary w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('negotiationRoom')}</span>
                </div>

                {/* Chat List */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-none bg-black/5">
                    {isLoadingMessages ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                    ) : messages.length > 0 ? (
                        messages.map((msg, idx) => {
                            const isMe = msg.sender_email === me?.email;
                            const isSystem = msg.type === 'system';
                            
                            if (isSystem) {
                                return (
                                    <div key={msg._id} className="flex justify-center my-2">
                                        <span className="px-3 py-1 bg-muted/50 rounded-full text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                            {translateSystemMessage(msg.content)}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mt-1`}>
                                    <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-2.5 shadow-sm rounded-2xl transition-all ${
                                            isMe 
                                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                            : 'bg-card text-card-foreground border border-white/5 rounded-tl-sm'
                                        }`}>
                                            {msg.type === 'image' ? (
                                                <ImageWithFallback src={msg.content} alt="" className="w-full max-w-[180px] rounded-xl" />
                                            ) : msg.type === 'voice' ? (
                                                <audio controls src={msg.content} className="w-full max-w-[160px] h-8 filter invert dark:invert-0" />
                                            ) : msg.type === 'offer' || msg.type === 'counter' || msg.type === 'cancelled' ? (
                                                <div className="flex items-center gap-2 opacity-80">
                                                    <HeartHandshake size={14} />
                                                    <p className="text-[10px] font-black uppercase tracking-wide">{translateSystemMessage(msg.content)}</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold leading-relaxed">{msg.content}</p>
                                            )}
                                        </div>
                                        <span className="text-[7px] font-black mt-0.5 opacity-30">
                                            {(() => {
                                                try {
                                                    const date = msg.createdAt ? new Date(msg.createdAt) : new Date();
                                                    return isNaN(date.getTime()) ? '' : format(date, 'p');
                                                } catch (e) {
                                                    return '';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 opacity-20">
                            <Send size={32} />
                            <p className="font-black text-[10px] uppercase mt-2 tracking-tighter">{t('startConversation')}</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-white/10 bg-background shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={() => fileInputRef.current.click()} className="p-2 text-muted-foreground hover:bg-muted hover:text-primary rounded-xl transition-all">
                            <ImageIcon size={18} />
                        </button>
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                value={messageContent}
                                onChange={handleTyping}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={t('typeAMessage')}
                                className="w-full bg-muted/40 border-none px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs font-bold transition-all"
                            />
                        </div>
                        {messageContent.trim() ? (
                            <button 
                                onClick={handleSendMessage} 
                                disabled={sendMessageMutation.isLoading}
                                className="p-2 bg-primary text-white rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {sendMessageMutation.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        ) : (
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
        </div>
      </motion.div>

      {/* Item Details Popup */}
      <ItemDetailsModal 
        isOpen={isItemDetailsOpen} 
        onClose={() => setIsItemDetailsOpen(false)} 
        item={selectedItemForDetails} 
      />
    </div>
  );
}
