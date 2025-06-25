import { store } from '../store/store';
import { authSuccess } from '../store/features/authSlice';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradetaper-backend-481634875325.us-central1.run.app';

export class GoogleAuthService {
  static initiateGoogleLogin(): void {
    // Redirect to backend Google OAuth endpoint
    const redirectUrl = `${BACKEND_URL}/api/v1/auth/google`;
    console.log('Initiating Google Login, redirecting to:', redirectUrl);
    console.log('BACKEND_URL from env:', process.env.NEXT_PUBLIC_BACKEND_URL);
    window.location.href = redirectUrl;
  }

  static async handleGoogleCallback(searchParams: URLSearchParams): Promise<boolean> {
    try {
      const token = searchParams.get('token');
      const user = searchParams.get('user');
      const error = searchParams.get('error');

      console.log('Google callback parameters:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        error: error,
        allParams: Object.fromEntries(searchParams.entries())
      });

      if (error) {
        console.error('OAuth error:', error);
        return false;
      }

      if (token && user) {
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(user));
        console.log('Parsed user data:', userData);
        
        // Update Redux state using authSuccess action
        store.dispatch(authSuccess({
          token: token,
          user: userData
        }));

        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('Google OAuth authentication successful');
        return true;
      }

      console.log('Missing token or user in callback parameters');
      return false;
    } catch (error) {
      console.error('Error handling Google callback:', error);
      return false;
    }
  }
} 