import { apiClient } from './client';

export interface WebsiteContent {
  id: string;
  sectionName: string;
  sectionType: string;
  status: string;
  itemsCount: number;
}

export const websiteApi = {
  getContent: (businessId: string) => 
    apiClient.get<WebsiteContent[]>(`/businesses/${businessId}/website-content`),
};
