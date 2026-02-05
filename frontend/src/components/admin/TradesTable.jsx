import { useQuery } from '@tanstack/react-query';
import { getAllTrades } from '../../api/api';
import { Loader2 } from 'lucide-react';

const TradesTable = () => {
    const { data: trades = [], isLoading } = useQuery({ queryKey: ['admin', 'trades'], queryFn: getAllTrades });

    if(isLoading) return <Loader2 className="animate-spin"/>
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-background">
                <thead>
                    <tr>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trade ID</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Initiator</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Receiver</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cash Requested</th>
                        <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated At</th>
                    </tr>
                </thead>
                <tbody>
                    {trades.map(trade => (
                        <tr key={trade._id}>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{trade._id}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{trade.initiator_email}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{trade.receiver_email}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{trade.status}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{trade.cash_requested ? `$${trade.cash_requested.toFixed(2)}` : 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-500">{new Date(trade.updatedAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TradesTable;