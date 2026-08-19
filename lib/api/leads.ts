import { apiClient } from './client';

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface CreateLeadRequest {
  fullName: string;
  email?: string;
  phone: string;
  source?: string;
  notes?: string;
}

export const leadsApi = {
  getLeads: (businessId: string) => 
    apiClient.get<Lead[]>(`/businesses/${businessId}/leads`),
    
  createLead: (businessId: string, data: CreateLeadRequest) => 
    apiClient.post<Lead>(`/businesses/${businessId}/leads`, data),
    
  updateStatus: (businessId: string, leadId: string, status: string) => 
    apiClient.put<Lead>(`/businesses/${businessId}/leads/${leadId}/status`, { status }),
};
