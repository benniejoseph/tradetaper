// src/services/csrf.ts
/**
 * CSRF Token Management Service
 *
 * Handles fetching, storing, and refreshing CSRF tokens for API requests.
 * CSRF tokens protect against Cross-Site Request Forgery attacks by ensuring
 * that state-changing requests originate from the same site.
 *
 * Usage:
 * - Call initializeCsrf() on app startup
 * - Token is automatically included in POST/PUT/PATCH/DELETE requests
 * - Token is automatically refreshed on 403 errors
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  'https://api.tradetaper.com/api/v1').trim();

class CsrfService {
  private csrfToken: string | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize CSRF protection by fetching a token from the server
   */
  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized && this.csrfToken) {
      return Promise.resolve();
    }

    this.initializationPromise = this._fetchToken()
      .then(() => {
        this.isInitialized = true;
        this.initializationPromise = null;
        console.log('🛡️ CSRF protection initialized');
      })
      .catch((error) => {
        this.initializationPromise = null;
        console.error('❌ Failed to initialize CSRF protection:', error);
        // Don't throw - allow app to continue without CSRF in development
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
      });

    return this.initializationPromise;
  }

  /**
   * Fetch a new CSRF token from the server
   */
  private async _fetchToken(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
        withCredentials: true, // Include cookies
      });

      if (response.data.csrfToken) {
        this.csrfToken = response.data.csrfToken;
        console.log('✅ CSRF token fetched successfully');
      } else {
        console.warn('⚠️ CSRF protection is not enabled on server');
        this.csrfToken = null;
      }
    } catch (error) {
      console.error('❌ Failed to fetch CSRF token:', error);
      throw error;
    }
  }

  /**
   * Refresh the CSRF token (e.g., after token expiration)
   */
  async refreshToken(): Promise<void> {
    console.log('🔄 Refreshing CSRF token...');
    await this._fetchToken();
  }

  /**
   * Get the current CSRF token
   */
  getToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Check if CSRF is initialized and has a valid token
   */
  isReady(): boolean {
    return this.isInitialized && !!this.csrfToken;
  }

  /**
   * Setup CSRF interceptors for an Axios instance
   * - Adds CSRF token to request headers for state-changing methods
   * - Automatically refreshes token on 403 errors
   */
  setupInterceptors(axiosInstance: AxiosInstance): void {
    // Request interceptor - add CSRF token to headers
    axiosInstance.interceptors.request.use(
      (config) => {
        // Only add CSRF token for state-changing methods
        const methodRequiresCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
          config.method?.toUpperCase() || ''
        );

        if (methodRequiresCsrf && this.csrfToken) {
          config.headers['X-CSRF-Token'] = this.csrfToken;
          console.log('🛡️ Added CSRF token to request:', config.method, config.url);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle CSRF token expiration
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Check if error is due to invalid CSRF token
        if (
          error.response?.status === 403 &&
          error.response?.data?.message?.toLowerCase().includes('csrf') &&
          !originalRequest._csrfRetry // Prevent infinite retry loop
        ) {
          console.warn('⚠️ CSRF token invalid, refreshing...');
          originalRequest._csrfRetry = true;

          try {
            // Refresh the CSRF token
            await this.refreshToken();

            // Update the request with the new token
            if (this.csrfToken) {
              originalRequest.headers['X-CSRF-Token'] = this.csrfToken;
              console.log('✅ Retrying request with new CSRF token');

              // Retry the original request
              return axiosInstance.request(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Failed to refresh CSRF token:', refreshError);
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );

    console.log('🛡️ CSRF interceptors configured for Axios instance');
  }
}

// Export singleton instance
export const csrfService = new CsrfService();

// Export function to initialize CSRF protection
export async function initializeCsrf(): Promise<void> {
  return csrfService.initialize();
}

// Export function to setup interceptors
export function setupCsrfInterceptors(axiosInstance: AxiosInstance): void {
  csrfService.setupInterceptors(axiosInstance);
}
