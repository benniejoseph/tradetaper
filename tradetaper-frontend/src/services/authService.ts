// src/services/authService.ts
import { apiClient } from './api';
import { authRequest, authSuccess, authFailure } from '@/store/features/authSlice';
import { AppDispatch } from '@/store/store'; // Correctly import AppDispatch
import { UserResponseDto } from '@/types/user';

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

interface AuthResponse {
  accessToken: string;
  user: UserResponseDto;
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
    // You might want a specific success action for registration that doesn't set isAuthenticated.
    return response.data; // Or handle navigation
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
    dispatch(authFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

export const loginUser = (payload: LoginPayload) => async (dispatch: AppDispatch) => {
  dispatch(authRequest());
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    dispatch(authSuccess({ token: response.data.accessToken, user: response.data.user }));
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
    dispatch(authFailure(errorMessage));
    throw new Error(errorMessage);
  }
};