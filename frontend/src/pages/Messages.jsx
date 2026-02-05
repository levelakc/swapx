import io from 'socket.io-client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversations, getMessages, sendMessage, getMe, uploadMessageMedia } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Send, Image, Mic, Check, CheckCheck, HeartHandshake, X, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import AudioRecorder from '../components/common/AudioRecorder';
import MakeOfferModal from '../components/trade/MakeOfferModal';
import ShareItemModal from '../components/trade/ShareItemModal';

export default function Messages() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
    enabled: !!selectedConversationId,
  });

  const messages = Array.isArray(messagesData) ? messagesData : [];

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage) => sendMessage(newMessage.conversation_id, newMessage),
    onSuccess: (data) => {
        setMessageContent('');
        if (Array.isArray(data)) {
            queryClient.setQueryData(['messages', selectedConversationId], data);
        } else {
            queryClient.invalidateQueries(['messages', selectedConversationId]);
        }
        queryClient.invalidateQueries(['conversations']);
    }
  });

  const mediaMutation = useMutation({
    mutationFn: (mediaData) => uploadMessageMedia(mediaData),
    onSuccess: (data) => {
      const fileType = data.url.endsWith('.mp3') || data.url.endsWith('.wav') || data.url.endsWith('.ogg') ? 'voice' : 'image';
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
    e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate({
        conversation_id: selectedConversationId,
        content: messageContent,
    });
  };

  useEffect(() => {
    if (selectedConversationId) {
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
  }, [selectedConversationId, messages, me]);

  useEffect(() => {
    const newSocket = io('http://localhost:8000', {
      auth: {
        token: JSON.parse(localStorage.getItem('base44_user'))?.token,
      },
    });

    socket.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('newMessage', (newMessage) => {
      queryClient.setQueryData(['messages', newMessage.conversation_id], (oldData) => {
        if (!oldData) return [newMessage];
        return [...oldData, newMessage];
      });
      queryClient.invalidateQueries(['conversations']);
    });

    newSocket.on('conversationCreated', (newConversation) => {
      queryClient.invalidateQueries(['conversations']);
    });

    newSocket.on('typing', ({ user }) => {
      console.log(`${user} is typing...`);
      setIsTyping(true);
    });

    newSocket.on('stopTyping', () => {
      console.log('stopTyping event received');
      setIsTyping(false);
    });

    newSocket.on('messagesRead', ({ messageIds }) => {
      queryClient.setQueryData(['messages', selectedConversationId], (oldData) => {
        if (!oldData) return [];
        return oldData.map(message => {
          if (messageIds.includes(message._id)) {
            return { ...message, read: true };
          }
          return message;
        });
      });
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [queryClient, selectedConversationId]);

  const handleTyping = (e) => {
    setMessageContent(e.target.value);

    if (socket.current) {
      socket.current.emit('typing', { conversationId: selectedConversationId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket.current) {
        socket.current.emit('stopTyping', { conversationId: selectedConversationId });
      }
    }, 2000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-background border rounded-lg">
      {/* Conversation List */}
      <div className="w-1/3 border-r overflow-y-auto">
        {isLoadingConversations ? <Loader2 className="m-4 animate-spin"/> : (
          conversations.map(convo => (
            <div 
              key={convo._id}
              onClick={() => setSelectedConversationId(convo._id)}
              className={`p-4 cursor-pointer border-b ${selectedConversationId === convo._id ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold">{convo.participants.find(p => p !== me?.email)}</p>
                {onlineUsers.some(u => u.email === convo.participants.find(p => p !== me?.email)) && (
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                )}
              </div>
              {convo.related_item_id && (
                <p className="text-sm text-muted-foreground">Item: {convo.related_item_id.title}</p>
              )}
              {convo.related_trade_id && (
                <p className="text-sm text-muted-foreground">Trade Status: {convo.related_trade_id.status}</p>
              )}
              <p className="text-sm text-muted-foreground truncate">{convo.last_message}</p>
              <p className="text-xs text-right text-muted-foreground">{format(new Date(convo.last_message_at), 'p')}</p>
            </div>
          ))
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            <div className="flex-grow p-4 overflow-y-auto">
              {isLoadingMessages ? <Loader2 className="m-auto animate-spin"/> : messages.length > 0 ? (
                messages.map(msg => (
                  <div key={msg._id} className={`flex ${msg.sender_email === me?.email ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={`max-w-lg p-3 rounded-lg ${msg.sender_email === me?.email ? 'bg-primary text-primary-content' : 'bg-muted'}`}>
                      {msg.type === 'image' ? (
                        <img src={msg.content} alt="message" className="w-full h-auto rounded-lg" />
                      ) : msg.type === 'voice' ? (
                        <audio controls src={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                      <div className="flex items-center justify-end mt-1">
                        <p className="text-xs text-right opacity-70 mr-1">{format(new Date(msg.createdAt), 'p')}</p>
                        {msg.sender_email === me?.email && (
                          msg.read ? <CheckCheck size={16} className="text-blue-500" /> : <Check size={16} />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <MessageCircle size={48} className="mb-2" />
                    <p>{t('noMessages', 'No messages yet. Say hello!')}</p>
                </div>
              )}
              {isTyping && (
                <div className="text-muted-foreground text-sm p-2">
                  Typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setIsOfferModalOpen(true)} 
                className="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition-colors"
                title={t('makeOffer')}
              >
                <HeartHandshake className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => setIsShareModalOpen(true)} 
                className="bg-green-100 text-green-600 p-2 rounded-full hover:bg-green-200 transition-colors"
                title="Share Item"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                className="bg-purple-100 text-purple-600 p-2 rounded-full hover:bg-purple-200 transition-colors"
                title={t('sendImage')}
              >
                <Image className="w-5 h-5" />
              </button>
              
              <input 
                type="text" 
                value={messageContent}
                onChange={handleTyping}
                placeholder={t('typeMessagePlaceholder', 'Type a message...')}
                className="flex-grow bg-input p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
              />
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />

              {messageContent.trim() ? (
                <button onClick={handleSendMessage} className="bg-primary text-primary-content p-2 rounded-full hover:bg-primary/90 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <AudioRecorder onRecordingComplete={handleAudioRecorded} isUploading={mediaMutation.isLoading} />
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t('selectConversationPrompt', 'Select a conversation to start messaging')}
          </div>
        )}
      </div>
      <MakeOfferModal 
        isOpen={isOfferModalOpen} 
        onClose={() => setIsOfferModalOpen(false)} 
        onSubmit={handleSendOffer}
      />
      <ShareItemModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        onSubmit={handleShareItem} 
      />
    </div>
  );
}
