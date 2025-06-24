import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import axios from 'axios';

@Controller('oauth') // Separate controller with different base route
export class GoogleOAuthController {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  @Get('google')
  async googleAuth(@Res() res) {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const callbackUrl = 'https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/oauth/google/callback';
      
      if (!clientId || !callbackUrl) {
        throw new HttpException('Google OAuth not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      console.log('Working Google OAuth - Redirecting to:', googleAuthUrl);
      return res.redirect(googleAuthUrl);
    } catch (error) {
      console.error('Working Google OAuth redirect error:', error);
      throw new HttpException('Failed to initiate Google OAuth', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Query('error') error: string, @Res() res) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

      if (error) {
        console.error('Working Google OAuth error:', error);
        const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error)}`;
        return res.redirect(errorUrl);
      }

      if (!code) {
        console.error('No authorization code received');
        const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent('No authorization code received')}`;
        return res.redirect(errorUrl);
      }

      console.log('Working Google OAuth - Received code:', code.substring(0, 20) + '...');

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      console.log('Working Google OAuth - Tokens received');
      
      // Get user info from Google
      const userInfo = await this.getUserInfo(tokens.access_token);
      console.log('Working Google OAuth - User info:', { email: userInfo.email, name: userInfo.name });
      
      // Create or authenticate user
      const result = await this.authService.validateOrCreateGoogleUser({
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      console.log('Working Google OAuth - User authenticated:', result.user.email);

      // Redirect to frontend with token and user data
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error('Working Google OAuth callback error:', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message || 'Authentication failed')}`;
      return res.redirect(errorUrl);
    }
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = 'https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/oauth/google/callback';

    console.log('Working OAuth - Exchanging code for tokens...');
    
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
    console.log('Working OAuth - Getting user info from Google...');
    
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  @Get('google/config')
  async getGoogleConfig() {
    return {
      message: 'Working Google OAuth Configuration!',
      hasClientId: !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
      hasClientSecret: !!this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackUrl: 'https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/oauth/google/callback',
      clientIdLength: this.configService.get<string>('GOOGLE_CLIENT_ID')?.length || 0,
      timestamp: new Date().toISOString(),
      status: 'WORKING SOLUTION',
    };
  }
}
