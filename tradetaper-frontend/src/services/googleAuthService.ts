import { store } from '../store/store';
import { authSuccess } from '../store/features/authSlice';

// Use NEXT_PUBLIC_API_URL which already includes /api/v1
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1').trim();

/**
 * Utility to read a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
}

export class GoogleAuthService {
  static initiateGoogleLogin(): void {
    // Redirect to backend Google OAuth endpoint
    const redirectUrl = `${API_BASE_URL}/auth/google`;
    console.log('Initiating Google Login, redirecting to:', redirectUrl);
    console.log('API_BASE_URL from env:', process.env.NEXT_PUBLIC_API_URL);
    window.location.href = redirectUrl;
  }

  /**
   * SECURITY FIX: Updated to read auth token from HTTP-only cookie instead of URL parameters
   * This prevents token exposure in browser history, logs, and referrer headers
   */
  static async handleGoogleCallback(searchParams: URLSearchParams): Promise<boolean> {
    try {
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      console.log('Google callback parameters:', {
        success: success,
        error: error,
        allParams: Object.fromEntries(searchParams.entries())
      });

      if (error) {
        console.error('OAuth error:', error);
        return false;
      }

      if (success === 'true') {
        // SECURITY: Auth token is now in HTTP-only cookie (not accessible to JavaScript)
        // The token will be automatically sent with API requests via Axios withCredentials

        // Read user data from non-HTTP-only cookie
        const userDataCookie = getCookie('user_data');

        if (!userDataCookie) {
          console.error('No user data found in cookies');
          return false;
        }

        try {
          // Parse user data from cookie
          const userData = JSON.parse(decodeURIComponent(userDataCookie));
          console.log('Parsed user data from cookie:', userData);

          // SECURITY NOTE: We no longer store the token in localStorage
          // The token is kept in HTTP-only cookie for security
          // We only need to update Redux with user data
          store.dispatch(authSuccess({
            token: 'cookie', // Placeholder - actual token is in HTTP-only cookie
            user: userData
          }));

          // Store user data in localStorage for persistence (non-sensitive)
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(userData));
            // SECURITY: No longer storing token in localStorage
            // Token is managed by HTTP-only cookie
          }

          console.log('Google OAuth authentication successful (cookie-based)');
          return true;
        } catch (parseError) {
          console.error('Error parsing user data from cookie:', parseError);
          return false;
        }
      }

      console.log('OAuth callback did not indicate success');
      return false;
    } catch (error) {
      console.error('Error handling Google callback:', error);
      return false;
    }
  }
} 