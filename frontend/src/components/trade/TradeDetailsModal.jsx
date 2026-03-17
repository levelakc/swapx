import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTradeById, updateTradeStatus, getItem } from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Loader2, X, ArrowRightLeft, DollarSign, Package, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TradeDetailsModal({ isOpen, onClose, tradeId, isReceiver }) {
  const { t } = useLanguage();
  const { currency, convertCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const { data: trade, isLoading, error } = useQuery({
    queryKey: ['trade', tradeId],
    queryFn: () => getTradeById(tradeId),
    enabled: isOpen && !!tradeId,
  });

  // Fetch details for all items in the trade
  const { data: offeredItems = [], isLoading: isLoadingOffered } = useQuery({
    queryKey: ['items', trade?.offered_items],
    queryFn: async () => {
      const items = await Promise.all(trade.offered_items.map(id => getItem(id)));
      return items;
    },
    enabled: !!trade?.offered_items?.length,
  });

  const { data: requestedItems = [], isLoading: isLoadingRequested } = useQuery({
    queryKey: ['items', trade?.requested_items],
    queryFn: async () => {
      const items = await Promise.all(trade.requested_items.map(id => getItem(id)));
      return items;
    },
    enabled: !!trade?.requested_items?.length,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTradeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['trade', tradeId]);
      queryClient.invalidateQueries(['messages']);
      toast.success(t('statusUpdated', 'Trade status updated!'));
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || t('failedToUpdateStatus', 'Failed to update status'));
    }
  });

  if (!isOpen) return null;

  const renderItemCard = (item) => {
    const displayValue = currency === 'ILS' ? convertCurrency(item.estimated_value, 'USD', 'ILS') : item.estimated_value;
    const currencySymbol = currency === 'ILS' ? '₪' : '$';
    
    return (
      <div key={item._id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border">
        <img src={item.images?.[0] || 'https://via.placeholder.com/150'} alt={item.title} className="w-12 h-12 object-cover rounded shadow-sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground">{currencySymbol}{displayValue.toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-muted/10">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
                <ArrowRightLeft className="text-primary w-5 h-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">{t('tradeOfferDetails', 'Trade Offer Details')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading || isLoadingOffered || isLoadingRequested ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">{t('loadingTradeDetails', 'Loading trade details...')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3 text-red-500">
                <AlertCircle size={40} />
                <p className="font-bold">{t('errorLoadingTrade', 'Error loading trade details')}</p>
                <p className="text-sm opacity-80">{error.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              
              {/* Divider for Desktop */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

              {/* Offered Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Package size={16} className="text-blue-500" /> {t('offered', 'Offered')}
                </h3>
                <div className="space-y-2">
                  {offeredItems.map(renderItemCard)}
                  {trade.cash_offered > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 text-green-600 rounded-lg border border-green-500/20 font-bold">
                        <DollarSign size={20} />
                        <span>+{currencySymbol}{ (currency === 'ILS' ? convertCurrency(trade.cash_offered, 'USD', 'ILS') : trade.cash_offered).toLocaleString()} Cash</span>
                    </div>
                  )}
                  {offeredItems.length === 0 && trade.cash_offered === 0 && (
                    <p className="text-sm text-muted-foreground italic">Nothing offered</p>
                  )}
                </div>
              </div>

              {/* Requested Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Package size={16} className="text-purple-500" /> {t('requested', 'Requested')}
                </h3>
                <div className="space-y-2">
                  {requestedItems.map(renderItemCard)}
                  {trade.cash_requested > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 text-blue-600 rounded-lg border border-blue-500/20 font-bold">
                        <DollarSign size={20} />
                        <span>+{currencySymbol}{ (currency === 'ILS' ? convertCurrency(trade.cash_requested, 'USD', 'ILS') : trade.cash_requested).toLocaleString()} Cash</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages from offer */}
          {trade?.messages?.length > 0 && (
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">{t('offerMessage', 'Offer Message')}</h4>
                  <p className="text-sm italic text-foreground/80">"{trade.messages[0].content}"</p>
              </div>
          )}

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('status', 'Status')}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter shadow-sm border ${
                  trade?.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  trade?.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                  trade?.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                  {t(trade?.status || 'pending')}
              </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t bg-muted/10">
          {isReceiver && trade?.status === 'pending' ? (
            <div className="flex gap-4">
              <button 
                onClick={() => statusMutation.mutate({ id: tradeId, status: 'rejected' })}
                disabled={statusMutation.isLoading}
                className="flex-1 border-2 border-red-500 text-red-500 hover:bg-red-50 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {statusMutation.isLoading ? <Loader2 className="animate-spin" /> : <><X size={20} /> {t('decline', 'Decline')}</>}
              </button>
              <button 
                onClick={() => statusMutation.mutate({ id: tradeId, status: 'accepted' })}
                disabled={statusMutation.isLoading}
                className="flex-1 bg-green-500 text-white hover:bg-green-600 py-3 rounded-xl font-black transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {statusMutation.isLoading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> {t('acceptOffer', 'Accept Offer')}</>}
              </button>
            </div>
          ) : (
            <button 
              onClick={onClose}
              className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-black hover:bg-secondary/80 transition-all active:scale-95"
            >
              {t('close', 'Close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
