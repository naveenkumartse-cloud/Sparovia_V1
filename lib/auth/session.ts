import { UserResponse } from '../api/types';

const TOKEN_KEY = 'sparovia_auth_token';
const USER_KEY = 'sparovia_auth_user';
const ACTIVE_BIZ_KEY = 'sparovia_active_business_id';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserResponse | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: UserResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACTIVE_BIZ_KEY);
}

export function getActiveBusinessId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_BIZ_KEY);
}

export function setActiveBusinessId(businessId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_BIZ_KEY, businessId);
}
