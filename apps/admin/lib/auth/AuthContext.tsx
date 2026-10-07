'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  fullName: string;
  phoneNumber?: string;
  tenantId: string;
  isOnboardingConfirmed?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
  setAuthUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const setAuthUser = useCallback((userData: User | null) => {
    setUser(userData);
    setIsLoading(false);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // The API client automatically sends Authorization Bearer header if token exists, and credentials: 'include'
      const userData = await apiClient.get<User>('/auth/me');
      setUser(userData);
      return userData;
    } catch (error: any) {
      const isUnauthorized = error?.message?.includes('expired') || error?.message?.includes('401') || error?.message?.includes('sign in');
      if (isUnauthorized) {
        apiClient.setToken(null);
      }
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      // Ignore errors on logout
    } finally {
      apiClient.setToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout, checkAuth, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
