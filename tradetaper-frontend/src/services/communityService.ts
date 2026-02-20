import { apiClient, authApiClient } from './api';
import {
  CommunityPost,
  CommunitySettings,
  LeaderboardEntry,
  CommunityPerson,
  CommunityReply,
} from '@/types/community';

export interface CommunityFeedResponse {
  items: CommunityPost[];
  total: number;
  limit: number;
  offset: number;
}

export interface CommunityLeaderboardResponse {
  items: LeaderboardEntry[];
  total: number;
}

export interface CommunityPeopleResponse {
  items: CommunityPerson[];
}

export interface CommunityFollowingResponse {
  items: string[];
}

export interface CommunityRepliesResponse {
  items: CommunityReply[];
  total: number;
  limit: number;
  offset: number;
}

export interface CommunityUserSearchResponse {
  items: { id: string; username: string; displayName: string }[];
}

export const communityService = {
  getFeed: async (params: Record<string, any> = {}) => {
    const response = await apiClient.get<CommunityFeedResponse>('/community/feed', { params });
    return response.data;
  },

  getLeaderboard: async (params: Record<string, any> = {}) => {
    const response = await apiClient.get<CommunityLeaderboardResponse>('/community/leaderboard', { params });
    return response.data;
  },

  getPeople: async (params: Record<string, any> = {}) => {
    const response = await apiClient.get<CommunityPeopleResponse>('/community/people', { params });
    return response.data;
  },

  getSettings: async () => {
    const response = await authApiClient.get<CommunitySettings>('/community/settings');
    return response.data;
  },

  updateSettings: async (payload: Partial<CommunitySettings>) => {
    const response = await authApiClient.patch<CommunitySettings>('/community/settings', payload);
    return response.data;
  },

  createPost: async (payload: Record<string, any>) => {
    const response = await authApiClient.post<CommunityPost>('/community/posts', payload);
    return response.data;
  },

  follow: async (userId: string) => {
    const response = await authApiClient.post(`/community/follow/${userId}`);
    return response.data;
  },

  unfollow: async (userId: string) => {
    const response = await authApiClient.delete(`/community/follow/${userId}`);
    return response.data;
  },

  getFollowing: async () => {
    const response = await authApiClient.get<CommunityFollowingResponse>('/community/following');
    return response.data;
  },

  getReplies: async (postId: string, params: Record<string, any> = {}) => {
    const response = await apiClient.get<CommunityRepliesResponse>(`/community/posts/${postId}/replies`, { params });
    return response.data;
  },

  createReply: async (postId: string, payload: { content: string }) => {
    const response = await authApiClient.post<CommunityReply>(`/community/posts/${postId}/replies`, payload);
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await authApiClient.get<CommunityUserSearchResponse>('/community/users/search', {
      params: { query },
    });
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await authApiClient.post<{ url: string; filename: string; size: number; mimetype: string }>(
      '/files/upload/trade-image',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  },
};
