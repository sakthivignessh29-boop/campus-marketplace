import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: String) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<String | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/users/me');
      // getUserProfile returns user, badges, listings, impact. We extract user
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: String) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: jwtToken, user: loggedUser } = response.data;
      
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(loggedUser);
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.response?.data || 'Failed to authenticate user');
    }
  };

  const register = async (data: any) => {
    try {
      await api.post('/api/auth/register', data);
    } catch (error: any) {
      throw new Error(error.response?.data || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const response = await api.get('/api/users/me');
        setUser(response.data.user);
      } catch (e) {
        console.error('Failed to refresh user', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token: token as string | null,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
