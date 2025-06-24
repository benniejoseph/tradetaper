import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class GoogleOAuthController {
  constructor(private configService: ConfigService) {}

  @Get('google-test')
  async googleTest() {
    return {
      message: 'Google OAuth test endpoint working',
      timestamp: new Date().toISOString(),
      hasClientId: !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
      hasClientSecret: !!this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      hasCallbackUrl: !!this.configService.get<string>('GOOGLE_CALLBACK_URL'),
      callbackUrl: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    };
  }

  @Get('google-manual')
  async googleManual(@Res() res) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    
    if (!clientId || !callbackUrl) {
      return res.status(500).json({ error: 'Missing Google OAuth configuration' });
    }
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    return res.redirect(googleAuthUrl);
  }
} 