import { apiFetch } from './client';
import { BusinessResponse, CreateBusinessRequest, UpdateBusinessRequest } from './types';

export async function createBusiness(data: CreateBusinessRequest): Promise<BusinessResponse> {
  return apiFetch<BusinessResponse>('/api/businesses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyBusinesses(): Promise<BusinessResponse[]> {
  return apiFetch<BusinessResponse[]>('/api/businesses/me', {
    method: 'GET',
  });
}

export async function getBusinessById(id: string): Promise<BusinessResponse> {
  return apiFetch<BusinessResponse>(`/api/businesses/${id}`, {
    method: 'GET',
  });
}

export async function updateBusiness(id: string, data: UpdateBusinessRequest): Promise<BusinessResponse> {
  return apiFetch<BusinessResponse>(`/api/businesses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
