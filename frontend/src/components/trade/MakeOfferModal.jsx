import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyItems } from '../../api/api';
import { Loader2, DollarSign, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function MakeOfferModal({ isOpen, onClose, onSubmit, targetItemName }) {
  const { t } = useLanguage();
  const [selectedItems, setSelectedItems] = useState([]);
  const [cashAmount, setCashAmount] = useState(0);
  const [cashType, setCashType] = useState('add'); // 'add' or 'request'

  const { data: myItems = [], isLoading } = useQuery({
    queryKey: ['items', 'my'],
    queryFn: getMyItems,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = () => {
    const offerData = {
      offeredItems: selectedItems,
      cash: {
        amount: Number(cashAmount),
        type: cashType,
      }
    };
    onSubmit(offerData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{t('makeOffer')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Item Selection */}
          <div>
            <h3 className="font-semibold mb-3">{t('selectItemsToOffer', 'Select items to offer')}</h3>
            {isLoading ? (
              <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : myItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('noItemsToList', 'You have no items listed yet.')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myItems.map(item => (
                  <div 
                    key={item._id} 
                    onClick={() => toggleItemSelection(item._id)}
                    className={`cursor-pointer border rounded-md p-2 flex flex-col gap-2 transition-all ${selectedItems.includes(item._id) ? 'border-primary ring-2 ring-primary bg-primary/10' : 'hover:border-primary/50'}`}
                  >
                    <img src={item.images[0]} alt={item.title} className="w-full h-24 object-cover rounded-md" />
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cash Adjustment */}
          <div>
            <h3 className="font-semibold mb-3">{t('cashAdjustment', 'Cash Adjustment')}</h3>
            <div className="flex gap-4 mb-2">
              <button 
                onClick={() => setCashType('add')}
                className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${cashType === 'add' ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-muted'}`}
              >
                {t('iWillAddCash', 'I will add cash')}
              </button>
              <button 
                onClick={() => setCashType('request')}
                className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${cashType === 'request' ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-muted'}`}
              >
                 {t('iRequestCash', 'I request cash')}
              </button>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="number" 
                min="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-input border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <button 
            onClick={handleSubmit}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-transform active:scale-95 shadow-md"
          >
            {t('sendOffer')}
          </button>
        </div>
      </div>
    </div>
  );
}
