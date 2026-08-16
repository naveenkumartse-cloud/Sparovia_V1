'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserResponse } from '@/lib/api/types';
import { getCurrentUser } from '@/lib/api/auth';
import { getStoredToken, getStoredUser, setStoredSession, clearStoredSession } from '@/lib/auth/session';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      const cachedUser = getStoredUser();

      if (storedToken) {
        setToken(storedToken);
        if (cachedUser) {
          setUser(cachedUser);
        }
        try {
          const freshUser = await getCurrentUser();
          setUser(freshUser);
          setStoredSession(storedToken, freshUser);
        } catch {
          // Token expired or invalid
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = (newToken: string, newUser: UserResponse) => {
    setToken(newToken);
    setUser(newUser);
    setStoredSession(newToken, newUser);
  };

  const logout = () => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const freshUser = await getCurrentUser();
      setUser(freshUser);
      setStoredSession(token, freshUser);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
