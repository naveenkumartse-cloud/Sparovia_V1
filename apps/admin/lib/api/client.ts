export class ApiClient {
  private baseUrl: string;

  constructor() {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl && envUrl.trim()) {
      this.baseUrl = envUrl.trim();
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      this.baseUrl = 'https://sparovia-api.onrender.com/api/v1';
    } else {
      this.baseUrl = 'http://localhost:5043/api/v1';
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  setToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (token && token.trim()) {
        localStorage.setItem('accessToken', token.trim());
      } else {
        localStorage.removeItem('accessToken');
      }
    } catch {}
  }

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
    const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include', // Automatically send secure HttpOnly auth cookie
        headers,
      });
    } catch (networkErr: any) {
      throw new Error(
        'Unable to connect to the server. Please check your network connection and try again.'
      );
    }

    if (!response.ok) {
      let errorMsg = '';
      try {
        const errorData = await response.json();
        if (typeof errorData?.error === 'string' && errorData.error.trim()) {
          errorMsg = errorData.error.trim();
        } else if (typeof errorData?.error?.message === 'string' && errorData.error.message.trim()) {
          errorMsg = errorData.error.message.trim();
        } else if (typeof errorData?.message === 'string' && errorData.message.trim()) {
          errorMsg = errorData.message.trim();
        } else if (errorData?.errors && typeof errorData.errors === 'object') {
          // ASP.NET Core ValidationProblemDetails dictionary
          const errorEntries = Object.values(errorData.errors) as any[];
          const flattened = errorEntries.flat().filter(Boolean);
          if (flattened.length > 0) {
            errorMsg = flattened.join(' ');
          }
        } else if (typeof errorData?.title === 'string' && errorData.title.trim()) {
          errorMsg = errorData.title.trim();
        }
      } catch {
        // Response body was not JSON
      }

      if (!errorMsg) {
        if (response.status === 401) {
          errorMsg = 'Your session has expired. Please sign in again.';
        } else if (response.status === 403) {
          errorMsg = 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMsg = 'The requested resource was not found.';
        } else if (response.status === 409) {
          errorMsg = 'A conflict occurred. Please refresh and try again.';
        } else if (response.status === 415) {
          errorMsg = 'Unsupported media format. Please upload a standard JPG, PNG, or WebP image.';
        } else if (response.status === 429) {
          errorMsg = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status >= 500) {
          errorMsg = 'A temporary server error occurred. Please try again.';
        } else {
          errorMsg = `Request failed (${response.status} ${response.statusText || 'Error'}).`;
        }
      }

      throw new Error(errorMsg);
    }

    // Return null if status is 204 No Content
    if (response.status === 204) {
      return null as any;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  }

  async put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async postFormData<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }
}

export const apiClient = new ApiClient();
