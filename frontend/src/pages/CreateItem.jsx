import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, createItem as apiCreateItem } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Info, X, Type, FileText, Tag, DollarSign, Image as ImageIcon, Plus, Briefcase, Package, Globe, Instagram, Facebook, Map } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CreateItem() {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [listingType, setListingType] = useState('item'); // 'item' or 'service'

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

  const createMutation = useMutation({
    mutationFn: (itemData) => apiCreateItem(itemData),
    onSuccess: () => {
      toast.success(t('itemListedSuccess', 'Item listed successfully!'));
      queryClient.invalidateQueries(['items', 'my']);
      navigate('/my-items');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to list item');
    }
  });
  
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    setMainImageFile(file);
    setMainImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAdditionalImageChange = (e) => {
    const files = Array.from(e.target.files);
    setAdditionalImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setAdditionalImagePreviews(previews);
  };

  const onSubmit = (data) => {
    if (!mainImageFile) {
      toast.error(t('mainImageRequiredError', 'Please upload a main image for your item.'));
      return;
    }

    const images = [mainImageFile, ...additionalImageFiles];
    
    const itemData = {
      ...data,
      estimated_value: Number(data.estimated_value),
      images,
      listing_type: listingType,
      price_type: listingType === 'service' ? 'hourly' : 'fixed',
    };

    createMutation.mutate(itemData);
  };

  const conditionOptions = ['new', 'like_new', 'excellent', 'good', 'fair'];
  const cashOptions = ['willing_to_add', 'willing_to_receive', 'both', 'trade_only'];
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-8 px-4"
    >
      <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Plus size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {t('listYourItem')}
              </h1>
              <p className="text-muted-foreground">{t('createItemSubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Listing Type Toggle */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('mainImageRequired')}</label>
                  <div className="relative group cursor-pointer">
                    <div className={`border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center text-center ${mainImagePreview ? 'border-primary/50 bg-primary/5' : 'border-muted hover:border-primary/50 hover:bg-muted/50'}`}>
                      {mainImagePreview ? (
                        <img src={mainImagePreview} alt="Main Preview" className="h-48 w-full object-cover rounded-lg shadow-md" />
                      ) : (
                        <>
                          <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-sm font-medium text-primary">{t('uploadAFile')}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('orDragAndDrop')}</p>
                        </>
                      )}
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleMainImageChange} accept="image/*" />
                    </div>
                  </div>
                  {errors.mainImage && <p className="text-red-500 text-xs mt-1">{errors.mainImage.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('additionalImagesOptional')}</label>
                  <div className="relative group cursor-pointer h-full">
                    <div className="border-2 border-dashed border-muted hover:border-primary/50 hover:bg-muted/50 rounded-xl p-8 h-full transition-colors flex flex-col items-center justify-center text-center">
                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-primary">{t('uploadFiles')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('orDragAndDrop')}</p>
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple onChange={handleAdditionalImageChange} accept="image/*" />
                    </div>
                  </div>
                </div>
              </div>
              
              {additionalImagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {additionalImagePreviews.map((src, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm border border-border">
                        <img src={src} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
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
                        defaultValue="trade_only"
                        render={({ field }) => (
                            <select {...field} className="w-full bg-secondary/50 border-transparent focus:border-primary focus:ring-primary rounded-xl py-3 px-4">
                                {cashOptions.map(opt => <option key={opt} value={opt}>{t(opt)}</option>)}
                            </select>
                        )}
                        />
                    </div>
                </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={createMutation.isLoading} 
                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg shadow-primary/25 text-lg font-bold text-white bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98]"
              >
                {createMutation.isLoading ? <Loader2 className="animate-spin" /> : t('listMyItem')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}