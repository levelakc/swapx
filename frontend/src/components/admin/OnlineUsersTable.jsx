import { useQuery } from '@tanstack/react-query';
import { getOnlineUsers } from '../../api/api'; // Correctly import getOnlineUsers from frontend api.js
import { Loader2 } from 'lucide-react';

const OnlineUsersTable = () => {
    const { data: onlineUsers = [], isLoading } = useQuery({ queryKey: ['admin', 'onlineUsers'], queryFn: getOnlineUsers });

    if(isLoading) return <Loader2 className="animate-spin"/>
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-background">
                <thead>
                    <tr>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Socket IDs</th>
                    </tr>
                </thead>
                <tbody>
                    {onlineUsers.map(user => (
                        <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{user.socketIds ? user.socketIds.join(', ') : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default OnlineUsersTable;