import { useQuery, useMutation } from '@tanstack/react-query';
import { getMe, getMyItems, createTrade } from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Loader2, Info, Plus, DollarSign, Send, Package, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import FuturisticTradeDeck from './FuturisticTradeDeck';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function ItemCarouselCard({ item, isSelected, onSelect }) {
    const { t } = useLanguage();
    const { currency, convertCurrency } = useCurrency();
    const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
    const currencySymbol = currency === 'ILS' ? '₪' : '$';

    return (
        <motion.div
            className={`relative flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-transparent hover:bg-muted'}`}
            onClick={() => onSelect(item._id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-sm">
                <img src={item.images?.[0] || 'https://via.placeholder.com/150'} alt={t(item.title)} className="w-full h-full object-cover" />
                {isSelected && (
                    <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                        <div className="bg-white text-purple-600 rounded-full p-1 shadow-sm">
                            <Plus size={16} strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>
            <h4 className="text-xs font-medium mt-2 text-center w-24 truncate">{t(item.title)}</h4>
            <p className="text-[10px] text-muted-foreground">{currencySymbol}{displayValue.toLocaleString()}</p>
        </motion.div>
    )
}

export default function TradeDeck({ isOpen, onClose, targetItem, onSubmit }) {
    const { t } = useLanguage();
    const { currency, convertCurrency } = useCurrency();
    const navigate = useNavigate();
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [cashMode, setCashMode] = useState('none'); // 'none', 'add', 'request'
    const [cashAmount, setCashAmount] = useState(0);
    const [message, setMessage] = useState('');
    const [showNewOfferForm, setShowNewOfferForm] = useState(false);
    const [newOffer, setNewOffer] = useState({ title: '', description: '', estimated_value: '', image: null });

    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: getMe,
        retry: false,
    });

    const { data: myItemsData, isLoading: isLoadingMyItems } = useQuery({
        queryKey: ['items', 'my', 'active'],
        queryFn: () => getMyItems(),
        enabled: !!user,
    });
    const myItems = myItemsData?.items || [];
    
    const tradeMutation = useMutation({
        mutationFn: (tradeData) => createTrade(tradeData),
        onSuccess: (data) => {
            toast.success(t('tradeOfferSentSuccessfully'));
            onSubmit();
            onClose();
            navigate(`/messages/${data.conversationId}`);
        },
        onError: (error) => {
            toast.error(error.message || t('failedToSendOffer'));
        }
    });

    const handleSelect = (itemId) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSubmit = () => {
        let currentOfferedItems = selectedItemIds;
        let currentCashOffered = cashMode === 'add' ? cashAmount : 0;
        let currentCashRequested = cashMode === 'request' ? cashAmount : 0;
        let currentNewOffer = (showNewOfferForm && newOffer.title) ? newOffer : null;
        
        let tradeType = 'item_only'; // Simplification for basic types, backend can refine

        const tradeData = {
            initiator_email: user.email,
            receiver_email: targetItem.created_by.email,
            offered_items: currentOfferedItems,
            requested_items: [targetItem._id],
            cash_offered: currentCashOffered,
            cash_requested: currentCashRequested,
            status: 'pending',
            messages: [{
                sender: user.email,
                content: message,
                type: 'text'
            }],
            new_offer: currentNewOffer,
            trade_type: tradeType, 
        };
        tradeMutation.mutate(tradeData);
    };

    const currencySymbol = currency === 'ILS' ? '₪' : '$';
    
    const quickCashOptions = [50, 100, 200, 500];

    return (
        <FuturisticTradeDeck isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">🤝 {t('makeOffer', 'Make an Offer')}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Trading for: <span className="font-medium text-foreground">{t(targetItem.title)}</span></p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Section 1: Select Items */}
                    <section>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <Package size={16} /> {t('yourItems', 'Your Items')}
                        </h3>
                        
                        {(isLoadingUser || isLoadingMyItems) ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
                        ) : myItems.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {myItems.map(item => (
                                    <ItemCarouselCard key={item._id} item={item} isSelected={selectedItemIds.includes(item._id)} onSelect={handleSelect} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-muted/30 rounded-xl border border-dashed">
                                <p className="text-sm text-muted-foreground">You don't have any items listed yet.</p>
                            </div>
                        )}

                        <button 
                            onClick={() => setShowNewOfferForm(!showNewOfferForm)}
                            className="mt-4 text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                            <Plus size={14} /> {showNewOfferForm ? 'Cancel Custom Item' : 'Or create a custom offer'}
                        </button>

                        <AnimatePresence>
                            {showNewOfferForm && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }} 
                                    animate={{ height: 'auto', opacity: 1 }} 
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-3 p-4 bg-muted/30 rounded-xl space-y-3 border">
                                        <input type="text" placeholder={t('title')} className="w-full bg-background p-2 rounded-lg text-sm border focus:ring-2 ring-purple-500 outline-none" onChange={e => setNewOffer({...newOffer, title: e.target.value})}/>
                                        <div className="flex gap-2">
                                            <input type="number" placeholder={t('estimatedValue')} className="w-1/3 bg-background p-2 rounded-lg text-sm border outline-none" onChange={e => setNewOffer({...newOffer, estimated_value: e.target.value})}/>
                                            <input type="file" className="flex-1 text-xs pt-1.5" onChange={e => setNewOffer({...newOffer, image: e.target.files[0]})}/>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    {/* Section 2: Cash Adjustment */}
                    <section>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <DollarSign size={16} /> {t('cashAdjustment', 'Cash Adjustment')}
                        </h3>
                        
                        <div className="flex p-1 bg-muted rounded-lg mb-4">
                            <button onClick={() => setCashMode('none')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${cashMode === 'none' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{t('none', 'None')}</button>
                            <button onClick={() => setCashMode('add')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${cashMode === 'add' ? 'bg-background shadow-sm text-green-600' : 'text-muted-foreground hover:text-foreground'}`}>{t('iAddCash', 'I Add Cash')}</button>
                            <button onClick={() => setCashMode('request')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${cashMode === 'request' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>{t('iRequestCash', 'I Request Cash')}</button>
                        </div>

                        <div className="min-h-[80px]">
                            <AnimatePresence mode="wait">
                                {cashMode !== 'none' && (
                                    <motion.div 
                                        key={cashMode}
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold text-foreground">{currencySymbol}</span>
                                            <input 
                                                type="number" 
                                                value={cashAmount} 
                                                onChange={(e) => setCashAmount(Number(e.target.value))}
                                                className="flex-1 text-2xl font-bold bg-transparent border-b-2 border-muted focus:border-purple-500 outline-none px-2 py-1 transition-colors"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {quickCashOptions.map(amount => (
                                                <button 
                                                    key={amount} 
                                                    onClick={() => setCashAmount(prev => prev + amount)}
                                                    className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full font-medium transition-colors"
                                                >
                                                    +{currencySymbol}{amount}
                                                </button>
                                            ))}
                                            <button onClick={() => setCashAmount(0)} className="px-3 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-full font-medium transition-colors ml-auto">{t('clear', 'Clear')}</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Section 3: Message */}
                    <section>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <MessageSquare size={16} /> {t('message', 'Message')}
                        </h3>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder={t('sendMessagePlaceholder', "Hey! I'm interested in your item...")}
                            className="w-full bg-muted/30 p-3 rounded-xl text-sm border focus:ring-2 ring-purple-500 outline-none resize-none h-24"
                        />
                    </section>

                </div>

                {/* Footer / Summary */}
                <div className="p-4 border-t bg-background">
                    <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground px-1">
                        <span>Offering: <b className="text-foreground">{selectedItemIds.length} items</b> {showNewOfferForm && '+ 1 custom'}</span>
                        {cashMode !== 'none' && cashAmount > 0 && (
                            <span className={cashMode === 'add' ? 'text-green-600 font-bold' : 'text-blue-600 font-bold'}>
                                {cashMode === 'add' ? '+' : '-'}{currencySymbol}{cashAmount.toLocaleString()}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={tradeMutation.isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {tradeMutation.isLoading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> {t('sendOffer', 'Send Offer')}</>}
                    </button>
                </div>
            </div>
        </FuturisticTradeDeck>
    );
}