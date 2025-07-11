import { apiClient } from './apiClient';

export const psychologyService = {
  getProfile: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get(`/psychological-profile?${params.toString()}`);
    return response.data;
  },

  getProfileSummary: async () => {
    const response = await apiClient.get('/psychological-profile/summary');
    return response.data;
  },

  analyzeNote: async (noteId: string) => {
    const response = await apiClient.post(`/notes/${noteId}/psychological-insights/analyze`);
    return response.data;
  },
}; 