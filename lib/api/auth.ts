import { apiFetch } from './client';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from './types';

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/auth/me', {
    method: 'GET',
  });
}
