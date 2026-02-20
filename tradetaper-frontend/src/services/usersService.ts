import { apiClient, authApiClient } from './api';
import { UserResponseDto } from '@/types/user';

export const usersService = {
  checkUsernameAvailability: async (username: string) => {
    const response = await apiClient.get<{ available: boolean }>(
      '/users/username-availability',
      { params: { username } },
    );
    return response.data;
  },

  updateUsername: async (username: string) => {
    const response = await authApiClient.patch<UserResponseDto>('/users/username', { username });
    return response.data;
  },
};
