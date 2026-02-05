import { useQuery } from '@tanstack/react-query';
import { getMyItems } from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, X, Package } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareItemModal({ isOpen, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [selectedItemId, setSelectedItemId] = useState(null);

  const { data: myItemsData, isLoading } = useQuery({
    queryKey: ['items', 'my'],
    queryFn: getMyItems,
    enabled: isOpen,
  });
  const myItems = myItemsData?.items || myItemsData || [];

  const handleSubmit = () => {
    if (selectedItemId) {
        const item = myItems.find(i => i._id === selectedItemId);
        onSubmit(item);
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                <h3 className="font-bold text-lg flex items-center gap-2"><Package size={20}/> Share an Item</h3>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X size={20}/></button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
                {isLoading ? <Loader2 className="mx-auto animate-spin" /> : myItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {myItems.map(item => (
                            <div 
                                key={item._id}
                                onClick={() => setSelectedItemId(item._id)}
                                className={`cursor-pointer border rounded-lg p-2 transition-all ${selectedItemId === item._id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}`}
                            >
                                <img src={item.images?.[0] || 'https://via.placeholder.com/150'} alt={item.title} className="w-full h-24 object-cover rounded-md mb-2"/>
                                <p className="text-sm font-medium truncate">{t(item.title)}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">No items to share.</p>
                )}
            </div>

            <div className="p-4 border-t bg-muted/20">
                <button 
                    onClick={handleSubmit}
                    disabled={!selectedItemId}
                    className="w-full bg-primary text-primary-content py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                    Share Item Link
                </button>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
