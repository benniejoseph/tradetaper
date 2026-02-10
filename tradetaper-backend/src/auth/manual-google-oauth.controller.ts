import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import axios from 'axios';

@Controller('auth/oauth') // Different prefix to avoid conflicts
export class ManualGoogleOAuthController {
  private readonly logger = new Logger(ManualGoogleOAuthController.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  @Get('google')
  async googleAuth(@Res() res) {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

      if (!clientId || !callbackUrl) {
        throw new HttpException(
          'Google OAuth not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `access_type=offline&` +
        `prompt=consent`;

      this.logger.log(`Redirecting to Google OAuth: ${googleAuthUrl}`);
      return res.redirect(googleAuthUrl);
    } catch (error) {
      this.logger.error('Google OAuth redirect error', error);
      throw new HttpException(
        'Failed to initiate Google OAuth',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res,
  ) {
    try {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';

      if (error) {
        this.logger.error(`Google OAuth error: ${error}`);
        const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error)}`;
        return res.redirect(errorUrl);
      }

      if (!code) {
        this.logger.error('No authorization code received');
        const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent('No authorization code received')}`;
        return res.redirect(errorUrl);
      }

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Get user info from Google
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Create or authenticate user
      const result = await this.authService.validateOrCreateGoogleUser({
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      // Redirect to frontend with token and user data
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback error', error);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message || 'Authentication failed')}`;
      return res.redirect(errorUrl);
    }
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
    });

    return response.data;
  }

  private async getUserInfo(accessToken: string) {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  }

  @Get('google/config')
  async getGoogleConfig() {
    return {
      hasClientId: !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
      hasClientSecret: !!this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      hasCallbackUrl: !!this.configService.get<string>('GOOGLE_CALLBACK_URL'),
      callbackUrl: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    };
  }
}
