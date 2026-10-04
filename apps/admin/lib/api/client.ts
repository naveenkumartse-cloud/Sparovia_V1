export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5043/api/v1';
  }

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
    if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
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
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
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
