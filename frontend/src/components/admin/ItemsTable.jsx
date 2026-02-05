import { useQuery } from '@tanstack/react-query';
import { getAllItems } from '../../api/api';
import { Loader2 } from 'lucide-react';

const ItemsTable = () => {
    const { data: items = [], isLoading } = useQuery({ queryKey: ['admin', 'items'], queryFn: getAllItems });

    if(isLoading) return <Loader2 className="animate-spin"/>
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-background">
                <thead>
                    <tr>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estimated Value</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item._id}>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{item.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{item.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{item.status}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{item.estimated_value}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{item.created_by}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ItemsTable;
