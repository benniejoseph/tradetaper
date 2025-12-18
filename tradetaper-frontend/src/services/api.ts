// src/services/api.ts
import axios from 'axios';
import { RootState } from '@/store/store';

// Use environment variable with fallback to GCP backend
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 
  'https://tradetaper-backend-326520250422.us-central1.run.app/api/v1').trim();

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
});

// Instance for authenticated routes
export const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('✅ Added Bearer token to request');
            } else {
                console.warn('⚠️ No token found in Redux store!');
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