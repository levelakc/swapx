import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, getMe, uploadMessageMedia, getConversation, createTrade } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Send, Image, HeartHandshake, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import AudioRecorder from '../components/common/AudioRecorder';
import MakeOfferModal from '../components/trade/MakeOfferModal';
import TradeNegotiationModal from '../components/trade/TradeNegotiationModal';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import ImageWithFallback from '../components/common/ImageWithFallback';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

export default function MessageScreen() {
  const { id: conversationId } = useParams();
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [isTradeDetailsOpen, setIsTradeDetailsOpen] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play error:', e));
    } catch (e) {
      console.log('Audio init error:', e);
    }
  };

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!user,
  });

  const { data: messages = [], isLoading: isLoadingMessages, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!user,
    // Polling as fallback, but socket is primary
    refetchInterval: 10000, 
  });

  useEffect(() => {
    if (messages.length > 0) {
        queryClient.invalidateQueries(['conversations']);
    }
  }, [messages, queryClient]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
  };

  // Socket setup
  useEffect(() => {
    const userData = localStorage.getItem('base44_user');
    if (!userData || !conversationId) return;
    const token = JSON.parse(userData)?.token;
    
    const newSocket = io(SOCKET_URL, { auth: { token } });
    socket.current = newSocket;
    
    newSocket.emit('joinConversation', { conversationId });

    newSocket.on('newMessage', (newMsg) => {
        if (newMsg.sender_email !== user?.email) {
            playNotificationSound();
        }

        if (newMsg.conversation_id === conversationId) {
            queryClient.setQueryData(['messages', conversationId], (old = []) => {
                // Ensure we are dealing with an array
                const currentMessages = Array.isArray(old) ? old : [];
                // Check if message already exists by ID
                const exists = currentMessages.some(m => m._id === newMsg._id);
                if (exists) return currentMessages;
                
                // Add new message and sort by creation time just in case
                const updated = [...currentMessages, newMsg];
                return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            });
            // Update conversation list unread counts/last message
            queryClient.invalidateQueries(['conversations']);
        } else if (newMsg.sender_email !== user?.email) {
            // Alert user about message in ANOTHER conversation
            toast(t('newMessageReceived'), {
                description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
                action: {
                    label: t('view'),
                    onClick: () => {
                        window.location.href = `/messages?id=${newMsg.conversation_id}`;
                    }
                }
            });
            queryClient.invalidateQueries(['conversations']);
        }
    });

    return () => newSocket.disconnect();
  }, [conversationId, queryClient]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [conversationId]); // Initial scroll on enter

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  const messageMutation = useMutation({
    mutationFn: (messageData) => sendMessage(conversationId, messageData),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversations']);
      playNotificationSound();
    },
    onError: (error) => {
      toast.error(error.message || t('failedToSendChatMessage'));
    }
  });

  const mediaMutation = useMutation({
    mutationFn: (mediaData) => uploadMessageMedia(mediaData),
    onSuccess: (data) => {
      const fileType = data.url.match(/\.(mp3|wav|ogg|webm)$/i) ? 'voice' : 'image';
      messageMutation.mutate({ content: data.url, type: fileType, sender: user.email });
    },
    onError: (error) => {
      toast.error(error.message || t('failedToUploadMedia'));
    }
  });

  const createTradeMutation = useMutation({
    mutationFn: (tradeData) => createTrade(tradeData),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversations']);
      toast.success(t('offerSent'));
    },
    onError: (error) => {
      toast.error(error.message || t('failedToSendOffer'));
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('media', file);
    mediaMutation.mutate(formData);
  };

  const handleAudioRecorded = (file) => {
    const formData = new FormData();
    formData.append('media', file);
    mediaMutation.mutate(formData);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !user || messageMutation.isLoading) return;
    const content = message;
    setMessage('');
    messageMutation.mutate({ content, type: 'text', sender: user.email });
  };

  const handleSendOffer = (offerData) => {
    if (!conversation || createTradeMutation.isLoading) return;

    const otherParticipant = conversation.participants.find(p => p !== user.email);
    const requestedItem = conversation.related_item_id?._id || conversation.related_item_id;

    if (!requestedItem) {
        toast.error("No item linked to this conversation to trade for");
        return;
    }

    const itemsCount = offerData.offeredItems.length;
    const itemsText = itemsCount === 1 ? t('item') : t('items');
    const cashText = offerData.cash.amount > 0 
        ? (offerData.cash.type === 'add' ? ` + ${offerData.cash.amount} ${t('cash')}` : ` ${t('askingFor')} ${offerData.cash.amount} ${t('cash')}`) 
        : '';
    
    const content = `${t('proposedTrade')}: ${itemsCount} ${itemsText}${cashText}`;
    
    createTradeMutation.mutate({
        receiver_email: otherParticipant,
        offered_items: offerData.offeredItems,
        requested_items: [requestedItem],
        cash_offered: offerData.cash.type === 'add' ? offerData.cash.amount : 0,
        cash_requested: offerData.cash.type === 'request' ? offerData.cash.amount : 0,
        message: content,
    });
  };

  if (isLoadingMessages) {
    return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">{t('errorLoadingMessages')}: {error.message}</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-0 md:p-4 h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex-grow bg-background md:rounded-2xl md:shadow-xl border border-border overflow-hidden flex flex-col relative">
        
        {/* Messages Area */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-muted/20">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground mt-10">
                    <p>{t('startConversation', 'Start the conversation!')}</p>
                </div>
            )}
            {messages.map((msg) => {
                const isMe = msg.sender_email === user?.email;
                return (
                    <motion.div 
                        key={msg._id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl shadow-sm ${
                            isMe 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-card text-card-foreground border border-border rounded-tl-none'
                        }`}>
                            {msg.type === 'image' ? (
                                <ImageWithFallback src={msg.content} alt="shared" className="w-full max-w-sm rounded-lg cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(msg.content, '_blank')} />
                            ) : msg.type === 'voice' ? (
                                <div className="flex items-center gap-2 min-w-[200px]">
                                    <audio controls src={msg.content} className="w-full h-8" />
                                </div>
                            ) : msg.type === 'offer' ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 font-bold border-b border-primary-foreground/20 pb-2 mb-1">
                                        <HeartHandshake size={20} />
                                        <span>{t('tradeOffer', 'Trade Offer')}</span>
                                    </div>
                                    <p className="text-[15px] font-medium leading-relaxed">{msg.content}</p>
                                    
                                    <button 
                                        onClick={() => {
                                            setSelectedTradeId(msg.trade_data?.trade_id);
                                            setIsTradeDetailsOpen(true);
                                        }}
                                        className={`w-full py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-sm ${
                                            isMe 
                                            ? 'bg-white/20 hover:bg-white/30 text-white' 
                                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        }`}
                                    >
                                        <Package size={16} /> {t('viewOffer', 'View Offer')}
                                    </button>
                                </div>
                            ) : msg.type === 'buttons' ? (
                                <div className="space-y-3">
                                    <p className="whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.buttons?.map((btn, i) => (
                                            <button
                                                key={i}
                                                onClick={() => messageMutation.mutate({ content: btn.payload || btn.text, type: 'text', sender: user.email })}
                                                className="px-3 py-1.5 bg-background text-foreground border border-border rounded-lg text-sm font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
                                            >
                                                {btn.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>
                            )}
                            <div className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                {format(new Date(msg.createdAt), 'p', { locale: language === 'he' ? he : enUS })}
                            </div>                        </div>
                    </motion.div>
                );
            })}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-background border-t border-border">
          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-full border border-border shadow-sm">
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 px-1">
                <button 
                    onClick={() => setIsOfferModalOpen(true)}
                    className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    title={t('makeOffer')}
                >
                    <HeartHandshake size={20} />
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-2 rounded-full text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    title={t('sendImage')}
                >
                    <Image size={20} />
                </button>
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
            />

            {/* Text Input */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('typeAMessage', 'Type a message...')}
              className="flex-grow bg-transparent text-foreground placeholder-muted-foreground px-2 py-2 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />

            {/* Audio & Send */}
            <div className="flex items-center gap-1">
                {message.trim() ? (
                    <button 
                        onClick={handleSendMessage} 
                        disabled={messageMutation.isLoading}
                        className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {messageMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                ) : (
                    <AudioRecorder onRecordingComplete={handleAudioRecorded} isUploading={mediaMutation.isLoading} />
                )}
            </div>
          </div>
        </div>
      </div>

      <MakeOfferModal 
        isOpen={isOfferModalOpen} 
        onClose={() => setIsOfferModalOpen(false)} 
        onSubmit={handleSendOffer}
      />

      {selectedTradeId && (
        <TradeNegotiationModal
          isOpen={isTradeDetailsOpen}
          onClose={() => setIsTradeDetailsOpen(false)}
          tradeId={selectedTradeId}
          conversationId={conversationId}
        />
      )}
    </div>
  );
}
