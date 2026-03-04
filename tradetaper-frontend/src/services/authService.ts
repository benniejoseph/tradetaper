// src/services/authService.ts
import { apiClient } from './api';
import { authRequest, authSuccess, authFailure } from '@/store/features/authSlice';
import { AppDispatch } from '@/store/store'; // Correctly import AppDispatch
import { UserResponseDto } from '@/types/user';
import { captureClientEvent } from '@/lib/observability/client';

// Define interfaces for request payloads to match backend DTOs
interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface AuthResponse {
  accessToken: string;
  user: UserResponseDto;
}

export interface UserSession {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  revokedReason?: string | null;
  isCurrent: boolean;
  isActive: boolean;
}

export const registerUser = (payload: RegisterPayload) => async (dispatch: AppDispatch) => {
  dispatch(authRequest());
  try {
    const response = await apiClient.post<UserResponseDto>('/auth/register', payload);
    // For registration, backend directly returns UserResponseDto (no token yet, user needs to login)
    // You might want to automatically log them in or redirect to login.
    // For simplicity, let's assume registration means they still need to log in.
    // Or, if your backend's /register returns a token upon successful registration:
    // dispatch(authSuccess({ token: response.data.accessToken, user: response.data.user }));
    // For now, let's assume it doesn't auto-login:
    console.log('Registration successful, please login:', response.data);
    captureClientEvent('auth_register_success');
    // You might want a specific success action for registration that doesn't set isAuthenticated.
    return response.data; // Or handle navigation
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
    captureClientEvent('auth_register_failed');
    dispatch(authFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

export const loginUser = (payload: LoginPayload) => async (dispatch: AppDispatch) => {
  dispatch(authRequest());
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    dispatch(authSuccess({ token: response.data.accessToken, user: response.data.user }));
    captureClientEvent('auth_login_success', { method: 'password' });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
    captureClientEvent('auth_login_failed', { method: 'password' });
    dispatch(authFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', payload);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send reset email';
    throw new Error(errorMessage);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Best-effort cookie cleanup: local state is still cleared by auth slice logout action.
  }
};

export const logoutAllSessions = async (): Promise<void> => {
  await apiClient.post('/auth/logout-all');
};

export const getUserSessions = async (): Promise<UserSession[]> => {
  const response = await apiClient.get<{ sessions: UserSession[] }>(
    '/auth/sessions',
  );
  return response.data.sessions || [];
};

export const revokeUserSession = async (
  sessionId: string,
): Promise<boolean> => {
  const response = await apiClient.delete<{ success: boolean }>(
    `/auth/sessions/${sessionId}`,
  );
  return !!response.data?.success;
};
