'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BusinessResponse } from '@/lib/api/types';
import { getMyBusinesses } from '@/lib/api/business';
import { getActiveBusinessId, setActiveBusinessId as setStoredActiveId } from '@/lib/auth/session';
import { useAuth } from './AuthProvider';

interface BusinessContextType {
  businesses: BusinessResponse[];
  activeBusiness: BusinessResponse | null;
  isLoading: boolean;
  error: string | null;
  setActiveBusiness: (businessId: string) => void;
  reloadBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
  businesses: [],
  activeBusiness: null,
  isLoading: true,
  error: null,
  setActiveBusiness: () => {},
  reloadBusinesses: async () => {},
});

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<BusinessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setActiveBusinessState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const list = await getMyBusinesses();
      setBusinesses(list);

      const storedId = getActiveBusinessId();
      let active = list.find((b) => b.id === storedId) || list[0] || null;

      setActiveBusinessState(active);
      if (active) {
        setStoredActiveId(active.id);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to load business data.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const setActiveBusiness = (id: string) => {
    const found = businesses.find((b) => b.id === id);
    if (found) {
      setActiveBusinessState(found);
      setStoredActiveId(found.id);
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        isLoading,
        error,
        setActiveBusiness,
        reloadBusinesses: loadBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
