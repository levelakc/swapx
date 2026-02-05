import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/api';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Trash2, Edit, PlusCircle } from 'lucide-react';
import { useState } from 'react';

export default function CategoryManager() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [isEditing, setIsEditing] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries(['categories']);
      reset();
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({id, data}) => updateCategory(id, data),
    onSuccess: () => {
      toast.success('Category updated');
      queryClient.invalidateQueries(['categories']);
      setIsEditing(null);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries(['categories']);
    },
  });

  const onNewSubmit = (data) => createMutation.mutate(data);
  const onEditSubmit = (data) => updateMutation.mutate({id: isEditing._id, data});

  if(isLoading) return <Loader2 className="animate-spin"/>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat._id} className="flex justify-between items-center bg-muted p-2 rounded-md">
              <div>
                <p className="font-semibold">{cat.label_en} ({cat.name})</p>
                <p className="text-xs text-muted-foreground">Order: {cat.order}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setIsEditing(cat); reset(cat); }}><Edit className="w-4 h-4"/></button>
                <button onClick={() => deleteMutation.mutate(cat._id)}><Trash2 className="w-4 h-4 text-red-500"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Category' : 'Add New Category'}</h2>
        <form onSubmit={handleSubmit(isEditing ? onEditSubmit : onNewSubmit)} className="space-y-4 bg-muted p-4 rounded-lg">
          <input {...register('name', { required: true })} placeholder="Name (e.g. sports_cars)" className="w-full p-2 bg-background rounded"/>
          <input {...register('icon')} placeholder="Icon name (lucide-react)" className="w-full p-2 bg-background rounded"/>
          <input {...register('label_en', { required: true })} placeholder="English Label" className="w-full p-2 bg-background rounded"/>
          <input {...register('label_he')} placeholder="Hebrew Label" className="w-full p-2 bg-background rounded"/>
          <input {...register('label_ar')} placeholder="Arabic Label" className="w-full p-2 bg-background rounded"/>
          <input {...register('label_ru')} placeholder="Russian Label" className="w-full p-2 bg-background rounded"/>
          <input type="number" {...register('order')} placeholder="Order" className="w-full p-2 bg-background rounded"/>
          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register('active')} defaultChecked={true} />
            <span>Active</span>
          </label>
          <button type="submit" className="w-full bg-primary text-primary-content p-2 rounded-md">
            {isEditing ? 'Update' : 'Create'}
          </button>
          {isEditing && <button type="button" onClick={() => setIsEditing(null)} className="w-full bg-gray-500 text-white p-2 rounded-md mt-2">Cancel Edit</button>}
        </form>
      </div>
    </div>
  );
}
