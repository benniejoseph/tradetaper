// src/services/api.ts
import axios from 'axios';
import { RootState } from '@/store/store';
import { csrfService } from './csrf';

// Use environment variable with fallback to GCP backend
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  'https://api.tradetaper.com/api/v1').trim();

console.log('🔧 API Configuration:', {
  env: process.env.NODE_ENV,
  apiUrl: API_BASE_URL,
  envVar: process.env.NEXT_PUBLIC_API_URL,
  timestamp: new Date().toISOString()
});

// Default instance for public routes
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // SECURITY: Enable sending cookies with requests for HTTP-only auth tokens
  withCredentials: true,
});

// Instance for authenticated routes
export const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // SECURITY: Enable sending cookies with requests for HTTP-only auth tokens
  withCredentials: true,
});

// SECURITY: Setup CSRF protection interceptors
csrfService.setupInterceptors(apiClient);
csrfService.setupInterceptors(authApiClient);

export default authApiClient;

export function setupAuthInterceptors(getState: () => RootState) { // removed unused dispatch parameter
    authApiClient.interceptors.request.use(
        (config: any) => {
            const state = getState();
            const token = state.auth.token;
            console.log('🔐 Auth State:', {
                hasToken: !!token,
                isAuthenticated: state.auth.isAuthenticated,
                hasUser: !!state.auth.user,
                url: config.url
            });

            // SECURITY NOTE: Authentication now uses HTTP-only cookies
            // The token is automatically sent via cookies (withCredentials: true)
            // We keep the Authorization header for backwards compatibility during transition
            if (token && token !== 'cookie') {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('✅ Added Bearer token to request (legacy mode)');
            } else if (state.auth.isAuthenticated) {
                console.log('✅ Using cookie-based authentication (secure mode)');
                // Token is in HTTP-only cookie, will be sent automatically
            } else {
                console.warn('⚠️ No authentication found!');
            }
            console.log('🚀 Making authenticated API request to:', config.baseURL + config.url);
            return config;
        },
        (error: any) => Promise.reject(error)
    );

    authApiClient.interceptors.response.use(
        (response: any) => response,
        (error: any) => {
            console.error('❌ API Request failed:', {
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                status: error.response?.status,
                message: error.message
            });
            if (error.response && error.response.status === 401) {
                console.log('Unauthorized from interceptor...');
                // Handle token refresh failure (e.g., redirect to login)
            }
            return Promise.reject(error);
        }
    );
    console.log('[API.TS] Auth interceptors configured.');
}

/**
 * Initialize CSRF protection
 * Should be called on app startup
 */
export async function initializeApiSecurity(): Promise<void> {
    try {
        await csrfService.initialize();
        console.log('✅ API security initialized (CSRF protection ready)');
    } catch (error) {
        console.error('❌ Failed to initialize API security:', error);
        // Don't throw in development mode to allow local testing
        if (process.env.NODE_ENV === 'production') {
            throw error;
        }
    }
}