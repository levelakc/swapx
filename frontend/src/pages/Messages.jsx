import io from 'socket.io-client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversations, getMessages, sendMessage, getMe, uploadMessageMedia, startSupportChat } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Send, Image, Mic, Check, CheckCheck, HeartHandshake, X, MessageCircle, Link as LinkIcon, ChevronLeft, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import AudioRecorder from '../components/common/AudioRecorder';
import MakeOfferModal from '../components/trade/MakeOfferModal';
import ShareItemModal from '../components/trade/ShareItemModal';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

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

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => getMessages(selectedConversationId),
    enabled: !!selectedConversationId && !!me,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const messages = useMemo(() => Array.isArray(messagesData) ? messagesData : [], [messagesData]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(convo => {
        const otherParticipant = convo.participants.find(p => p !== me?.email) || '';
        return otherParticipant.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, me?.email]);

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
    
    const content = `Proposed a trade: ${itemsCount} items${cashText}`;
    
    sendMessageMutation.mutate({ 
        conversation_id: selectedConversationId,
        content: content, 
        type: 'offer', 
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
        // Check for duplicates (e.g. from optimistic update or API response)
        if (oldData.some(m => m._id === newMessage._id || (m._id.length < 20 && m.content === newMessage.content))) {
            return oldData.map(m => m.content === newMessage.content && m._id.length < 20 ? newMessage : m);
        }
        return [...oldData, newMessage];
      });
      queryClient.invalidateQueries(['conversations']);
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
  }, [queryClient, me?.email]); // Reconnect only if user changes

  // Join/Leave Conversation
  useEffect(() => {
    if (selectedConversationId && socket.current) {
      socket.current.emit('joinConversation', { conversationId: selectedConversationId });

      const unreadMessages = messages.filter(m => m.sender_email !== me?.email && !m.read);
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(m => m._id);
        socket.current.emit('markAsRead', { conversationId: selectedConversationId, messageIds });
      }

      return () => {
        socket.current.emit('leaveConversation', { conversationId: selectedConversationId });
      };
    }
  }, [selectedConversationId, me]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSelectConversation = (id) => {
      setSelectedConversationId(id);
      setShowList(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] bg-background border rounded-none md:rounded-lg overflow-hidden transition-all duration-300">
      
      {/* Conversation List */}
      <div className={`w-full md:w-1/3 border-r flex flex-col bg-card ${!showList && 'hidden md:flex'}`}>
        <div className="p-4 border-b space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="text-primary" />
                {t('messages', 'Messages')}
            </h2>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder={t('searchConversations', 'Search...')}
                    className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-grow overflow-y-auto">
            {isLoadingConversations ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : filteredConversations.length > 0 ? (
                filteredConversations.map(convo => {
                    const otherParticipant = convo.participants.find(p => p !== me?.email);
                    const isOnline = onlineUsers.some(u => u.email === otherParticipant);
                    const isSelected = selectedConversationId === convo._id;
                    const unreadCount = convo.unread_count?.[me?.email] || 0;

                    return (
                        <div 
                            key={convo._id}
                            onClick={() => handleSelectConversation(convo._id)}
                            className={`p-4 cursor-pointer border-b transition-all relative ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/30 border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <p className={`font-bold ${unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{otherParticipant}</p>
                                    {isOnline && <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>}
                                </div>
                                <p className="text-[10px] text-muted-foreground/70">{format(new Date(convo.last_message_at), 'p')}</p>
                            </div>
                            
                            <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {convo.last_message || t('noMessagesYet', 'No messages yet')}
                            </p>

                            {unreadCount > 0 && (
                                <div className="absolute right-4 bottom-4 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                                    {unreadCount}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                    <p className="text-muted-foreground text-sm">{t('noConversations', 'No conversations found.')}</p>
                    <button 
                        onClick={() => {
                            startSupportChat().then(convo => {
                                queryClient.invalidateQueries(['conversations']);
                                setSelectedConversationId(convo._id);
                                setShowList(false);
                            }).catch(err => toast.error('Failed to start chat'));
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
                    >
                        <MessageCircle size={16}/> {t('contactSupport')}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Message Area */}
      <div className={`flex-1 flex flex-col bg-background ${showList && 'hidden md:flex'}`}>
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center gap-3 bg-card/50">
                <button onClick={() => setShowList(true)} className="md:hidden p-2 hover:bg-muted rounded-full transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <p className="font-bold">{conversations.find(c => c._id === selectedConversationId)?.participants.find(p => p !== me?.email)}</p>
                    {isTyping && <p className="text-[10px] text-primary animate-pulse">{t('typing', 'typing...')}</p>}
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-muted/5">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>
              ) : messages.length > 0 ? (
                messages.map(msg => {
                    const isMe = msg.sender_email === me?.email;
                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground border rounded-tl-none'}`}>
                                {msg.type === 'image' ? (
                                    <img src={msg.content} alt="shared" className="w-full h-auto rounded-lg mb-1" />
                                ) : msg.type === 'voice' ? (
                                    <audio controls src={msg.content} className="w-full max-w-[240px] h-8" />
                                ) : (
                                    <p className="whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>
                                )}
                                <div className="flex items-center justify-end mt-1 gap-1">
                                    <p className={`text-[9px] opacity-70 ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{format(new Date(msg.createdAt), 'p')}</p>
                                    {isMe && (
                                        msg.read ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} className="opacity-50" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
                    <MessageCircle size={48} className="mb-2" />
                    <p>{t('noMessagesYet', 'No messages yet')}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t bg-card">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                  <div className="flex items-center gap-1">
                      <button onClick={() => setIsOfferModalOpen(true)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title={t('makeOffer')}><HeartHandshake size={20} /></button>
                      <button onClick={() => setIsShareModalOpen(true)} className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors" title="Share Item"><LinkIcon size={20} /></button>
                      <button onClick={() => fileInputRef.current.click()} className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors" title={t('sendImage')}><Image size={20} /></button>
                  </div>
                  
                  <div className="flex-grow relative">
                      <input 
                        type="text" 
                        value={messageContent}
                        onChange={handleTyping}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('typeAMessage', 'Type a message...')}
                        className="w-full bg-muted/50 p-2.5 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                      {messageContent.trim() && (
                          <button onClick={handleSendMessage} className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-1.5 rounded-full hover:scale-105 active:scale-95 transition-all">
                              <Send size={16} />
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
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={40} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{t('yourMessages', 'Your Messages')}</h3>
            <p className="max-w-xs">{t('selectConversationPrompt', 'Select a conversation from the list to start messaging')}</p>
          </div>
        )}
      </div>

      <MakeOfferModal isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)} onSubmit={handleSendOffer} />
      <ShareItemModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onSubmit={handleShareItem} />
    </div>
  );
}

