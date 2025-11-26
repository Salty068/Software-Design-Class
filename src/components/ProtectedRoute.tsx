import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  fallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  )
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, requireAuth, requireAdmin: requireAdminFn } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (requireAdmin) {
        requireAdminFn();
      } else {
        requireAuth();
      }
    }
  }, [isLoading, requireAuth, requireAdminFn, requireAdmin]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by requireAuth
  }

  if (requireAdmin && !isAdmin()) {
    return null; // Will be redirected by requireAdminFn
  }

  return <>{children}</>;
}

export default ProtectedRoute;