export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BusinessResponse {
  id: string;
  name: string;
  slug: string;
  industry: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBusinessRequest {
  name: string;
  slug: string;
  industry: string;
  description?: string | null;
}

export interface UpdateBusinessRequest {
  name?: string;
  industry?: string;
  description?: string | null;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
