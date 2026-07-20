import { authApiClient } from './api';

export interface PsychologyProfileParams {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  limit?: number;
  offset?: number;
}

export const psychologyService = {
  getProfile: async (params: PsychologyProfileParams = {}) => {
    const { startDate, endDate, accountId, limit, offset } = params;
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (accountId) query.append('accountId', accountId);
    if (typeof limit === 'number') query.append('limit', String(limit));
    if (typeof offset === 'number') query.append('offset', String(offset));
    const response = await authApiClient.get(`/psychological-profile?${query.toString()}`);
    return response.data;
  },

  getProfileSummary: async (params: Omit<PsychologyProfileParams, 'limit' | 'offset'> = {}) => {
    const { startDate, endDate, accountId } = params;
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (accountId) query.append('accountId', accountId);
    const response = await authApiClient.get(`/psychological-profile/summary?${query.toString()}`);
    return response.data;
  },
};
