// src/services/api.ts
import axios from 'axios';
import { RootState } from '@/store/store'; // Removed unused AppDispatch import

// TEMPORARILY HARDCODE PRODUCTION URL TO FIX DEPLOYMENT ISSUE
const API_BASE_URL = 'https://tradetaper-backend-production.up.railway.app/api/v1';

// Debug: Log the API URL being used
console.log('🔍 Frontend API_BASE_URL:', API_BASE_URL);
console.log('🔍 NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

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