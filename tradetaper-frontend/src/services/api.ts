// src/services/api.ts
import axios from 'axios';
import { RootState } from '@/store/store';

// Use environment variable with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://tradetaper-backend-production.up.railway.app/api/v1'
    : 'http://localhost:3000/api/v1');

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
        (config) => {
            const token = getState().auth.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    authApiClient.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                console.log('Unauthorized from interceptor...');
                // Handle token refresh failure (e.g., redirect to login)
            }
            return Promise.reject(error);
        }
    );
    console.log('[API.TS] Auth interceptors configured.');
}