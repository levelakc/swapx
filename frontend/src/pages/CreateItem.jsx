import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, createItem as apiCreateItem, getItem, updateItem as apiUpdateItem } from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Info, X, Type, FileText, Tag, DollarSign, Image as ImageIcon, Plus, Briefcase, Package, Globe, Instagram, Facebook, Map, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ImageWithFallback from '../components/common/ImageWithFallback';

export default function CreateItem({ id: propsId, onSuccess }) {
  const { id: paramId } = useParams();
  const id = propsId || paramId;
  const isEdit = !!id;
  const isModal = !!propsId;
  const { register, handleSubmit, control, setValue, reset, formState: { errors, isDirty } } = useForm();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]); // Array of { file, preview, isMain, isExisting }
  const [originalImages, setOriginalImages] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [listingType, setListingType] = useState('item'); // 'item' or 'service'

  // Fetch item data for editing
  const { data: itemToEdit, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id),
    enabled: isEdit,
  });

  // Correctly populate form data when item is loaded
  useEffect(() => {
    if (isEdit && itemToEdit) {
        reset({
            title: itemToEdit.title,
            description: itemToEdit.description,
            category: itemToEdit.category?._id || itemToEdit.category,
            estimated_value: itemToEdit.estimated_value,
            condition: itemToEdit.condition,
            location: itemToEdit.location,
            looking_for: itemToEdit.looking_for || [],
            cash_flexibility: itemToEdit.cash_flexibility,
            open_to_other_offers: itemToEdit.open_to_other_offers,
            website: itemToEdit.website,
            social_instagram: itemToEdit.social_instagram,
            social_facebook: itemToEdit.social_facebook,
            google_reviews_link: itemToEdit.google_reviews_link,
        });
        setListingType(itemToEdit.listing_type || 'item');
        const existingImages = (itemToEdit.images || []).map((img, i) => ({
            file: img,
            preview: img,
            isMain: i === 0,
            isExisting: true
        }));
        setImages(existingImages);
        setOriginalImages(JSON.stringify(existingImages.map(img => img.preview)));
    }
  }, [isEdit, itemToEdit, reset]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isMain: images.length === 0, // First image is main by default
      isExisting: false
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Ensure first image is main if we have images
      if (newImages.length > 0) {
        return newImages.map((img, i) => ({ ...img, isMain: i === 0 }));
      }
      return newImages;
    });
  };

  const moveImage = (index, direction) => {
    setImages(prev => {
      const newImages = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      
      // Keep main image as the first one
      return newImages.map((img, i) => ({ ...img, isMain: i === 0 }));
    });
  };

  const setMainImage = (index) => {
    if (index === 0) return;
    moveImage(index, -index); // Move to front
  };

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (newlyCreatedCategory) => {
      toast.success(t('categoryCreated', 'Category created successfully!'));
      queryClient.invalidateQueries(['categories']);
      setNewCategory('');
      setValue('category', newlyCreatedCategory._id);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create category');
    }
  });

  const handleAddCategory = () => {
    if (newCategory.trim() === '') {
      toast.error(t('categoryNameEmpty', 'Category name cannot be empty'));
      return;
    }
    createCategoryMutation.mutate({
      name: newCategory.trim().toLowerCase(),
      label_en: newCategory.trim(),
      active: true,
      order: categories.length + 1
    });
  };

  const saveMutation = useMutation({
    mutationFn: (itemData) => isEdit ? apiUpdateItem(id, itemData) : apiCreateItem(itemData),
    onSuccess: (newItem) => {
      toast.success(isEdit ? t('itemUpdatedSuccess', 'Item updated successfully!') : t('itemListedSuccess', 'Item listed successfully!'));
      queryClient.invalidateQueries(['items', 'my']);
      queryClient.invalidateQueries(['item', id]);
      
      if (!isEdit && newItem && newItem.category) {
        document.cookie = `last_category_search=${newItem.category}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      
      if (onSuccess) {
          onSuccess(newItem);
      } else {
          navigate('/my-items');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save item');
    }
  });

  const onSubmit = (data) => {
    if (images.length === 0) {
      toast.error(t('mainImageRequiredError', 'Please upload at least one image for your item.'));
      return;
    }

    // Sort images so main is first, then extract either the File or the existing string URL
    const sortedImages = [...images].sort((a, b) => b.isMain - a.isMain).map(img => img.file);
    
    const itemData = {
      ...data,
      estimated_value: Number(data.estimated_value),
      images: sortedImages,
      listing_type: listingType,
      price_type: listingType === 'service' ? 'hourly' : 'fixed',
    };

    saveMutation.mutate(itemData);
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const currentImagesStr = JSON.stringify(images.map(img => img.preview));
      if (isDirty || currentImagesStr !== originalImages) {
        if (!isModal) {
            e.preventDefault();
            e.returnValue = '';
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, images, originalImages, isModal]);

  const conditionOptions = ['new', 'like_new', 'excellent', 'good', 'fair'];
  const cashOptions = ['can_add', 'can_receive', 'can_add_or_receive', 'prefer_exchange'];  
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  if (isEdit && isLoadingItem) {
    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="animate-spin w-12 h-12 text-primary" />
        </div>
    );
  }

  return (
    <motion.div 
      initial={isModal ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 20 }}
      animate={isModal ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }}
      className={`${isModal ? 'w-full' : 'max-w-3xl mx-auto py-8 px-4'}`}
    >
      <div className={`${isModal ? '' : 'bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden'}`}>
        <div className={`${isModal ? 'p-0' : 'p-8 md:p-10'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              {isEdit ? <Save size={32} /> : <Plus size={32} />}
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {isEdit ? t('editItem', 'Edit Item') : t('listYourItem')}
              </h1>
              <p className="text-muted-foreground">{isEdit ? t('editItemSubtitle', 'Update your listing details') : t('createItemSubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Listing Type Toggle */}
            {!isEdit && (
                <div className="flex justify-center">
                    <div className="bg-secondary/50 p-1 rounded-xl flex gap-1">
                        <button
                            type="button"
                            onClick={() => setListingType('item')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${listingType === 'item' ? 'bg-primary text-primary-content shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Package size={18} /> {t('item')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setListingType('service')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${listingType === 'service' ? 'bg-primary text-primary-content shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Briefcase size={18} /> {t('service')}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Basic Info Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText size={16} /> {t('basicInfo')}
              </h3>
              
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('title')}</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input 
                      id="title" 
                      placeholder={t('newOfferTitlePlaceholder')}
                      {...register('title', { required: t('titleRequired') })} 
                      className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 pl-10"
                    />
                  </div>
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('description')}</label>
                  <textarea 
                    id="description" 
                    placeholder={t('newOfferDescriptionPlaceholder')}
                    {...register('description')} 
                    rows="4" 
                    className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl p-4"
                  />
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Tag size={16} /> {t('itemDetails')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('category')}</label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: t('categoryRequired') }}
                    render={({ field }) => (
                      <select {...field} className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 px-4">
                        <option value="">{t('selectCategory')}</option>
                        {isLoadingCategories ? <option>{t('loading')}</option> : categories.map(c => <option key={c._id} value={c._id}>{c[`label_${language}`] || c.label_en}</option>)}
                      </select>
                    )}
                  />
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                  
                  {/* Inline Add Category */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 bg-secondary/30 border-transparent rounded-lg py-2 px-3 text-sm"
                      placeholder={t('newCategoryName')}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={createCategoryMutation.isLoading}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 rounded-lg text-xs font-bold"
                    >
                      {createCategoryMutation.isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : t('addCategory')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {listingType === 'service' ? t('hourlyRate') : t('estimatedValue')} ({currencySymbol})
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input 
                      type="number" 
                      placeholder="0"
                      {...register('estimated_value', { required: t('valueRequired'), min: { value: 1, message: t('minimumValue') } })} 
                      className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 pl-10"
                    />
                  </div>
                  {errors.estimated_value && <p className="text-red-500 text-xs mt-1">{errors.estimated_value.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">{t('condition')}</label>
                    <Controller
                      name="condition"
                      control={control}
                      rules={{ required: t('conditionRequired') }}
                      render={({ field }) => (
                        <select {...field} className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 px-4">
                            <option value="">{t('selectCondition')}</option>
                            {conditionOptions.map(opt => <option key={opt} value={opt}>{t(opt)}</option>)}
                        </select>
                      )}
                    />
                    {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('location')}</label>
                  <input 
                    placeholder={t('locationPlaceholder')}
                    {...register('location')} 
                    className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 px-4"
                  />
                </div>
              </div>
            </div>

            {/* Service Specific Fields */}
            {listingType === 'service' && (
                <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Globe size={16} /> Online Presence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Website</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <input {...register('website')} placeholder="https://..." className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 pl-10"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Instagram</label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <input {...register('social_instagram')} placeholder="@username" className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 pl-10"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Facebook</label>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <input {...register('social_facebook')} placeholder="Profile URL" className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 pl-10"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Google Reviews Link</label>
                            <div className="relative">
                                <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <input {...register('google_reviews_link')} placeholder="https://maps.app.goo.gl/..." className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 pl-10"/>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ImageIcon size={16} /> {t('media')}
              </h3>

              <div className="space-y-4">
                <div className="relative group cursor-pointer">
                  <div className="border-2 border-dashed border-muted hover:border-primary/50 hover:bg-muted/50 rounded-2xl p-10 transition-all flex flex-col items-center justify-center text-center">
                    <UploadCloud className="h-12 w-12 text-muted-foreground mb-3 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-black text-primary uppercase tracking-widest">{t('uploadFiles')}</p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase font-bold">{t('orDragAndDrop')}</p>
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple onChange={handleImageChange} accept="image/*" />
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, i) => (
                      <div key={i} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${img.isMain ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/5'}`}>
                        <ImageWithFallback src={img.preview} alt="" className="w-full h-full object-cover" />
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 px-2">
                          <div className="flex gap-2 w-full justify-center">
                              {i > 0 && (
                                <button type="button" onClick={() => moveImage(i, -1)} className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors">
                                  <ChevronLeft size={16} />
                                </button>
                              )}
                              {i < images.length - 1 && (
                                <button type="button" onClick={() => moveImage(i, 1)} className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-all">
                                  <ChevronRight size={16} />
                                </button>
                              )}
                          </div>
                          
                          {!img.isMain && (
                            <button 
                              type="button"
                              onClick={() => setMainImage(i)}
                              className="w-full py-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                              Make Main
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => removeImage(i)}
                            className="w-full py-1.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        {img.isMain && (
                          <div className="absolute top-2 left-2 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-xl border border-white/20 z-10">
                            ★ Main Photo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trading Preferences */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Info size={16} /> {t('tradingPreferences')}
                </h3>

                <div className="grid gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-medium">{t('lookingForOptional')}</label>
                            <span className="text-xs text-muted-foreground">({t('lookingForHelp')})</span>
                        </div>
                        <Controller
                        name="looking_for"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => {
                            const selectedIds = field.value || [];
                            const handleAdd = (e) => {
                                const id = e.target.value;
                                if (id && !selectedIds.includes(id)) {
                                    field.onChange([...selectedIds, id]);
                                }
                                e.target.value = "";
                            };
                            const handleRemove = (idToRemove) => {
                                field.onChange(selectedIds.filter(id => id !== idToRemove));
                            };

                            return (
                                <div className="space-y-3">
                                    <select 
                                        onChange={handleAdd} 
                                        className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 px-4"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>{t('selectLookingFor')}</option>
                                        {isLoadingCategories ? <option>{t('loading')}</option> : 
                                            categories
                                                .filter(c => !selectedIds.includes(c._id))
                                                .map(c => <option key={c._id} value={c._id}>{c[`label_${language}`] || c.label_en}</option>)
                                        }
                                    </select>

                                    {selectedIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-xl border border-dashed border-white/10">
                                            {selectedIds.map(id => {
                                                const cat = categories.find(c => c._id === id);
                                                const label = cat ? (cat[`label_${language}`] || cat.label_en) : id;
                                                return (
                                                    <div key={id} className="flex items-center gap-1 bg-primary text-primary-content px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                                        <span>{label}</span>
                                                        <button type="button" onClick={() => handleRemove(id)} className="hover:text-red-200 transition-colors"><X size={14} /></button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">{t('cashFlexibility')}</label>
                        <Controller
                        name="cash_flexibility"
                        control={control}
                        defaultValue="prefer_exchange"
                        render={({ field }) => (
                            <select {...field} className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 px-4">
                                {cashOptions.map(opt => <option key={opt} value={opt}>{t(opt)}</option>)}
                            </select>
                        )}
                        />
                    </div>

                    <div className="bg-secondary/30 p-4 rounded-2xl border border-dashed border-white/10">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                {...register('open_to_other_offers')}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
                            />
                            <div className="flex-1">
                                <span className="block text-sm font-bold group-hover:text-primary transition-colors">{t('openToOtherOffers')}</span>
                                <span className="block text-xs text-muted-foreground">{t('openToOtherOffersDesc')}</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={saveMutation.isLoading} 
                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg shadow-primary/25 text-lg font-bold text-white bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98]"
              >
                {saveMutation.isLoading ? <Loader2 className="animate-spin" /> : (isEdit ? t('saveChanges', 'Save Changes') : t('listMyItem'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
