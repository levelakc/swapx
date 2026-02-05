import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../api/api';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  // Check if user is authenticated (data exists and no error)
  // Also check localStorage as a fast fail-safe? 
  // getMe usually throws if token is invalid/missing.
  
  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
