import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'volunteer' | 'admin';
  profileComplete: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, role?: 'volunteer' | 'admin') => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isVolunteer: () => boolean;
  isAdmin: () => boolean;
  requireAuth: () => boolean;
  requireAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const login = async (email: string, _password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, simulate a successful login
      const userData: UserData = {
        id: '1',
        email: email,
        name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'volunteer',
        profileComplete: true,
        createdAt: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('authToken', 'demo-token');
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
  };

  const register = async (email: string, _password: string, name: string, role: 'volunteer' | 'admin' = 'volunteer'): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, simulate successful registration
      const userData: UserData = {
        id: Math.random().toString(36).substring(7),
        email,
        name,
        role,
        profileComplete: false,
        createdAt: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('authToken', 'demo-token');
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
    // For now, just keep the current user
    return Promise.resolve();
  };

  const isVolunteer = () => user?.role === 'volunteer';
  const isAdmin = () => user?.role === 'admin';
  
  const requireAuth = () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return false;
    }
    return true;
  };

  const requireAdmin = () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return false;
    }
    if (!isAdmin()) {
      setError('Admin access required');
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
    requireAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}