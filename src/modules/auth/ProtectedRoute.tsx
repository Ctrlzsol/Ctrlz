
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'client' | 'technician';
}

export const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] text-[#0c2444] font-bold">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Role Check: Redirect to correct dashboard if role doesn't match
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'client') return <Navigate to="/client" replace />;
    if (user?.role === 'technician') return <Navigate to="/technician" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
