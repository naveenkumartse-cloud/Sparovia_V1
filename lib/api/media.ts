import { apiClient } from './client';

export interface MediaAsset {
  id: string;
  title: string;
  category: string;
  url: string;
  uploadedAt: string;
}

export const mediaApi = {
  getMedia: (businessId: string) => 
    apiClient.get<MediaAsset[]>(`/businesses/${businessId}/media`),
    
  uploadMedia: async (businessId: string, file: File, category: string) => {
    // We cannot use standard JSON apiClient for FormData. Need custom fetch or use apiClient underlying fetch if exposed.
    // For now we'll do a custom fetch using the same token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const res = await fetch(`${API_URL}/businesses/${businessId}/media/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error('Failed to upload media');
    }
    
    return res.json() as Promise<MediaAsset>;
  }
};
