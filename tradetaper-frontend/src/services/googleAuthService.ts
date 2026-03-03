import { store } from '../store/store';
import { authSuccess } from '../store/features/authSlice';
import { UserResponseDto } from '../types/user';

// Use NEXT_PUBLIC_API_URL which already includes /api/v1
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1').trim();

export class GoogleAuthService {
  static initiateGoogleLogin(): void {
    // Redirect to backend Google OAuth endpoint
    const redirectUrl = `${API_BASE_URL}/auth/google`;
    window.location.href = redirectUrl;
  }

  static async handleGoogleCallback(
    searchParams: URLSearchParams,
    hashFragment?: string,
  ): Promise<boolean> {
    try {
      const hashParams = new URLSearchParams(
        hashFragment?.startsWith('#')
          ? hashFragment.slice(1)
          : (hashFragment ?? ''),
      );
      const token = hashParams.get('token') ?? searchParams.get('token');
      const user = hashParams.get('user') ?? searchParams.get('user');
      const error = searchParams.get('error') ?? hashParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        return false;
      }

      if (token && user) {
        // Parse user data
        const userData = this.parseUserPayload(user);
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

        // Don't clean up URL here - let the redirect handle it
        // The new page load will have a clean URL
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error handling Google callback:', error);
      return false;
    }
  }

  private static parseUserPayload(rawUserPayload: string): UserResponseDto {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawUserPayload);
    } catch {
      parsed = JSON.parse(decodeURIComponent(rawUserPayload));
    }

    if (!this.isUserResponseDto(parsed)) {
      throw new Error('Invalid OAuth user payload');
    }

    return parsed;
  }

  private static isUserResponseDto(value: unknown): value is UserResponseDto {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as UserResponseDto).id === 'string' &&
      typeof (value as UserResponseDto).email === 'string'
    );
  }
} 
