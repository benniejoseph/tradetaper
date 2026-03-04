// src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { RootState } from '@/store/store';
import { csrfService } from './csrf';

// Use environment variable with fallback to GCP backend
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  'https://api.tradetaper.com/api/v1').trim();

// Default instance for public routes
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Ensure cookies (like CSRF) are sent/received
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instance for authenticated routes
export const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Ensure cookies (like CSRF) are sent/received
  headers: {
    'Content-Type': 'application/json',
  },
});

// SECURITY: Setup CSRF protection interceptors
csrfService.setupInterceptors(apiClient);
csrfService.setupInterceptors(authApiClient);

export default authApiClient;

let authInterceptorsConfigured = false;
let refreshPromise: Promise<void> | null = null;
let onAuthFailureHandler: (() => void) | undefined;

interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/admin/auth/login') ||
    url.includes('/admin/auth/logout')
  );
}

async function refreshAuthSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post(
        '/auth/refresh',
        {},
        {
          skipAuthRefresh: true,
        } as RetryableAxiosRequestConfig,
      )
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function setupAuthInterceptors(
  getState: () => RootState,
  onAuthFailure?: () => void,
) {
  void getState;
  if (onAuthFailure) {
    onAuthFailureHandler = onAuthFailure;
  }
  if (authInterceptorsConfigured) {
    return;
  }
  authInterceptorsConfigured = true;

  authApiClient.interceptors.request.use(
    (config: any) => config,
    (error: any) => Promise.reject(error),
  );

  authApiClient.interceptors.response.use((response: any) => response, async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      await refreshAuthSession();
      return authApiClient.request(originalRequest);
    } catch (refreshError) {
      if (onAuthFailureHandler) {
        onAuthFailureHandler();
      }
      return Promise.reject(refreshError);
    }
  });
}

/**
 * Initialize CSRF protection
 * Should be called on app startup
 */
export async function initializeApiSecurity(): Promise<void> {
  try {
    await csrfService.initialize();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // Keep local development usable if CSRF endpoint is unavailable.
    console.error('Failed to initialize API security:', error);
  }
}
