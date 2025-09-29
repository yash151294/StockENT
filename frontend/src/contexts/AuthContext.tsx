import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { logger } from '../utils/logger';

// Types
interface User {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  country?: string;
  profileImageUrl?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isFirstLogin?: boolean;
  companyProfile?: {
    id: string;
    businessLicense?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    website?: string;
    description?: string;
    certifications: string[];
  };
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  justLoggedIn: boolean;
  showFirstLoginMessage: boolean;
  loginMethod: 'email' | 'google' | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; isFirstLogin?: boolean; justLoggedIn?: boolean; loginMethod?: 'email' | 'google' } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_JUST_LOGGED_IN' }
  | { type: 'CLEAR_FIRST_LOGIN_MESSAGE' };

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  justLoggedIn: false,
  showFirstLoginMessage: false,
  loginMethod: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
        justLoggedIn: action.payload.justLoggedIn !== false, // Only set to true if explicitly true, default to true for new logins
        showFirstLoginMessage: action.payload.isFirstLogin || false,
        loginMethod: action.payload.loginMethod || null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        justLoggedIn: false,
        loginMethod: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_JUST_LOGGED_IN':
      return {
        ...state,
        justLoggedIn: false,
      };
    case 'CLEAR_FIRST_LOGIN_MESSAGE':
      return {
        ...state,
        showFirstLoginMessage: false,
      };
    default:
      return state;
  }
};

// Context
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (user: User, isFirstLogin?: boolean) => void;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  clearJustLoggedIn: () => void;
  clearFirstLoginMessage: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'BUYER' | 'SELLER';
  companyName: string;
  contactPerson: string;
  phone: string;
  country: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        logger.info('Checking authentication status...');
        const response = await authAPI.getCurrentUser();
        if (response.data.success) {
          const user = response.data.data;
          logger.info('User authenticated successfully:', user.email);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user,
              isFirstLogin: user.isFirstLogin || false,
              justLoggedIn: false, // This is a token validation, not a new login
            },
          });
        } else {
          // Not authenticated
          logger.info('User not authenticated - no valid session');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error: any) {
        // Don't log auth check failures as errors - this is normal for unauthenticated users
        logger.info('Authentication check failed:', error.response?.status || error.message);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []); // Empty dependency array to run only once

  // Listen for authentication logout events from API interceptor
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      logger.warn('Received auth logout event:', event.detail?.reason);
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('auth:logout', handleAuthLogout as EventListener);
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
    };
  }, []);


  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        const { user } = response.data.data;
        
        // Tokens are automatically set in cookies by the server
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, justLoggedIn: true, loginMethod: 'email' },
        });
        
        logger.info('User logged in successfully');
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      logger.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  }, []);

  const register = async (userData: RegisterData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }
      
      logger.info('User registered successfully');
    } catch (error: any) {
      logger.error('Registration error:', error);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      logger.info('Logging out user...');
      // Call logout API to clear server-side tokens and cookies
      await authAPI.logout();
      logger.info('Logout API call successful');
    } catch (error) {
      // Even if the API call fails, we should still clear the local state
      logger.error('Logout API call failed:', error);
    }
    
    // Clear any cached data and local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear React Query cache if available
    // You might want to clear React Query cache here
    
    // Always dispatch logout to clear local state
    dispatch({ type: 'LOGOUT' });
    logger.info('User logged out successfully');
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  const loginWithOAuth = useCallback((user: User, isFirstLogin?: boolean) => {
    // Debug: Log the user data being stored
    logger.info('Storing OAuth user data:', {
      id: user.id,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      contactPerson: user.contactPerson,
      companyName: user.companyName
    });

    // Tokens are already set in cookies by the server during OAuth callback
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, isFirstLogin, justLoggedIn: true, loginMethod: 'google' },
    });
    
    logger.info('User logged in with OAuth successfully');
  }, []);

  // Token refresh is now handled automatically by the API interceptor

  const clearJustLoggedIn = useCallback(() => {
    dispatch({ type: 'CLEAR_JUST_LOGGED_IN' });
  }, []);

  const clearFirstLoginMessage = useCallback(() => {
    dispatch({ type: 'CLEAR_FIRST_LOGIN_MESSAGE' });
  }, []);

  const value: AuthContextType = {
    state,
    login,
    loginWithOAuth,
    register,
    logout,
    updateUser,
    clearJustLoggedIn,
    clearFirstLoginMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
