import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, getMe, uploadMessageMedia } from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Send, Image, Mic, Phone, HeartHandshake, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import AudioRecorder from '../components/common/AudioRecorder';
import MakeOfferModal from '../components/trade/MakeOfferModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessageScreen() {
  const { id: conversationId } = useParams();
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const { data: messages = [], isLoading: isLoadingMessages, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!user,
    refetchInterval: 3000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const messageMutation = useMutation({
    mutationFn: (messageData) => sendMessage(conversationId, messageData),
    onSuccess: (newMessage) => {
      setMessage('');
      // Manually update the query cache to include the new message
      queryClient.setQueryData(['messages', conversationId], (oldMessages = []) => {
          // If the server returns all messages, use them, otherwise append
          if (Array.isArray(newMessage)) return newMessage;
          return [...oldMessages, newMessage];
      });
      queryClient.invalidateQueries(['messages', conversationId]);
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
    if (message.trim() === '' || !user) return;
    messageMutation.mutate({ content: message, type: 'text', sender: user.email });
  };

  const handleSendOffer = (offerData) => {
    // Construct a readable offer message
    const itemsCount = offerData.offeredItems.length;
    const cashText = offerData.cash.amount > 0 
        ? (offerData.cash.type === 'add' ? ` + ${offerData.cash.amount} cash` : ` asking for ${offerData.cash.amount} cash`) 
        : '';
    
    const content = `Proposed a trade: ${itemsCount} items${cashText}`;
    
    messageMutation.mutate({ 
        content: content, 
        type: 'offer', 
        sender: user.email, 
        trade_data: offerData 
    });
    toast.success(t('offerSent'));
  };

  if (isLoadingUser || isLoadingMessages) {
    return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">{t('errorLoadingMessages')}: {error.message}</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-0 md:p-4 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-grow bg-background md:rounded-2xl md:shadow-xl border border-border overflow-hidden flex flex-col relative">
        
        {/* Chat Header (Optional - could show recipient info) */}
        
        {/* Messages Area */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-muted/20">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground mt-10">
                    <p>{t('startConversation', 'Start the conversation!')}</p>
                </div>
            )}
            {messages.map((msg) => {
                const isMe = msg.sender_email === user.email;
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
                                <img src={msg.content} alt="shared" className="w-full max-w-sm rounded-lg cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(msg.content, '_blank')} />
                            ) : msg.type === 'voice' ? (
                                <div className="flex items-center gap-2 min-w-[200px]">
                                    <audio controls src={msg.content} className="w-full h-8" />
                                </div>
                            ) : msg.type === 'offer' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-bold border-b border-primary-foreground/20 pb-1 mb-1">
                                        <HeartHandshake size={18} />
                                        <span>{t('tradeOffer', 'Trade Offer')}</span>
                                    </div>
                                    <p className="text-sm">{msg.content}</p>
                                    {!isMe && (
                                        <div className="flex gap-2 mt-2">
                                            <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs font-bold flex items-center justify-center gap-1">
                                                <Check size={12}/> Accept
                                            </button>
                                            <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs font-bold flex items-center justify-center gap-1">
                                                <X size={12}/> Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>
                            )}
                            <div className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
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
                        className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
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
    </div>
  );
}
