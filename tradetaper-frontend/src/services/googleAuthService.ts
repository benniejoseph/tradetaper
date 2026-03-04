import { store } from '../store/store';
import { authSuccess } from '../store/features/authSlice';
import { UserResponseDto } from '../types/user';
import { authApiClient } from './api';
import { captureClientEvent } from '@/lib/observability/client';

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
        captureClientEvent('auth_login_failed', {
          method: 'google',
          reason: 'oauth_error',
        });
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
        captureClientEvent('auth_login_success', { method: 'google' });
        return true;
      }

      const meResponse = await authApiClient.get<UserResponseDto>('/auth/me');
      if (!meResponse.data) {
        return false;
      }
      store.dispatch(
        authSuccess({
          token: null,
          user: meResponse.data,
        }),
      );
      captureClientEvent('auth_login_success', { method: 'google' });
      return true;
    } catch (error) {
      console.error('Error handling Google callback:', error);
      captureClientEvent('auth_login_failed', {
        method: 'google',
        reason: 'callback_exception',
      });
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
