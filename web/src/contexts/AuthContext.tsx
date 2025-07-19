/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { useSnackbar } from 'notistack';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const userData = await authService.getProfile();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login method
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      const { user, accessToken, refreshToken } = response;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set user state
      setUser(user);
      
      // Show success message
      enqueueSnackbar('Login successful!', { variant: 'success' });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Login failed', { variant: 'error' });
      throw error;
    }
  }, [navigate, enqueueSnackbar]);

  // Register method
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await authService.register(email, password, name);
      const { user, accessToken, refreshToken } = response;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set user state
      setUser(user);
      
      // Show success message
      enqueueSnackbar('Registration successful!', { variant: 'success' });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Registration failed', { variant: 'error' });
      throw error;
    }
  }, [navigate, enqueueSnackbar]);

  // Logout method
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      
      // Show message
      enqueueSnackbar('Logged out successfully', { variant: 'info' });
      
      // Navigate to login
      navigate('/login');
    }
  }, [navigate, enqueueSnackbar]);

  // Refresh token method
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem('accessToken', response.accessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  }, [logout]);

  // Check if user has permission
  const hasPermission = useCallback((permission: string) => {
    return user?.permissions.includes(permission) || false;
  }, [user]);

  // Check if user has role
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = authService.setupInterceptor(refreshToken);
    return () => {
      authService.removeInterceptor(interceptor);
    };
  }, [refreshToken]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshToken,
    hasPermission,
    hasRole,
  };

  // @ts-ignore
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};