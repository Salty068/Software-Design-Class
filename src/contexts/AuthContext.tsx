import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Types
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'volunteer' | 'admin' | 'organizer';
  profileComplete: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, role?: 'volunteer' | 'admin' | 'organizer') => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isVolunteer: () => boolean;
  isAdmin: () => boolean;
  requireAuth: () => boolean;
  requireAdmin: () => boolean;
  requireRole: (role: 'volunteer' | 'admin' | 'organizer') => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAuthenticated = !!user;

  // Check for existing token on app load
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          // No token found, user is not authenticated
          setIsLoading(false);
          return;
        }
        
        // Verify token with server
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
          
          if (response.ok) {
            const userData = await response.json();
            const normalizedUser = {
              ...userData,
              role: userData.role.toLowerCase()
            };
            setUser(normalizedUser);
          } else {
            // Invalid token, remove it
            localStorage.removeItem('authToken');
          }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { user: userData, token } = await response.json();
      
      // Normalize role to lowercase for consistency
      const normalizedUser = {
        ...userData,
        role: userData.role.toLowerCase()
      };
      
      setUser(normalizedUser);
      localStorage.setItem('authToken', token);
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    setError(null);
    // Redirect to login page
    window.location.href = '/login';
  };

  const register = async (email: string, password: string, name: string, role: 'volunteer' | 'admin' | 'organizer' = 'volunteer'): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Capitalize role for backend API
      const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          name,
          role: capitalizedRole 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const { user: userData, token } = await response.json();
      
      // Normalize role to lowercase for consistency
      const normalizedUser = {
        ...userData,
        role: userData.role.toLowerCase()
      };
      
      setUser(normalizedUser);
      localStorage.setItem('authToken', token);
      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        const normalizedUser = {
          ...userData,
          role: userData.role.toLowerCase()
        };
        setUser(normalizedUser);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      logout();
    }
  };

  // Role checking functions
  const isVolunteer = () => user?.role === 'volunteer';
  const isAdmin = () => user?.role === 'organizer';

  const requireAuth = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return false;
    }
    return true;
  };

  const requireAdmin = () => {
    if (!requireAuth()) return false;
    if (!isAdmin()) {
      setError('Admin access required');
      return false;
    }
    return true;
  };

  const requireRole = (role: 'volunteer' | 'admin' | 'organizer') => {
    if (!requireAuth()) return false;
    if (user?.role !== role) {
      setError(`${role} access required`);
      return false;
    }
    return true;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshUser,
    isVolunteer,
    isAdmin,
    requireAuth,
    requireAdmin,
    requireRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
