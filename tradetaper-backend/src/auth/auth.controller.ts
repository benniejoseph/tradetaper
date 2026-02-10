import axios from 'axios';
import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UnauthorizedException,
  UsePipes,
  Res,
  Req,
  Query,
  HttpException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  RateLimitGuard,
  AuthRateLimit,
  StrictRateLimit,
} from '../common/guards/rate-limit.guard';
import { EnhancedValidationPipe } from '../common/pipes/validation.pipe';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('auth') // Route prefix /api/v1/auth
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<UserResponseDto> {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    const user = await this.authService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  // Manual Google OAuth implementation
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

      const scope = 'email profile';
      const state = Math.random().toString(36).substring(7);

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;

      this.logger.log(`Redirecting to Google OAuth: ${googleAuthUrl}`);
      return res.redirect(googleAuthUrl);
    } catch (error) {
      this.logger.error('Error initiating Google OAuth', error);
      throw new HttpException(
        'Failed to initiate Google OAuth',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('google/callback')
  async googleCallback(@Query() query: Record<string, string>, @Res() res) {
    try {
      const { code, error, state } = query;

      if (error) {
        this.logger.error(`Google OAuth error: ${error}`);
        throw new BadRequestException(`Google OAuth error: ${error}`);
      }

      if (!code) {
        throw new BadRequestException('No authorization code received');
      }

      this.logger.log('Received authorization code, exchanging for tokens...');

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      this.logger.log('Successfully exchanged code for tokens');

      // Get user info from Google
      const userInfo = await this.getUserInfo(tokens.access_token);
      this.logger.log(`Retrieved user info from Google: ${userInfo.email}`);

      // Create or authenticate user
      const result = await this.authService.validateOrCreateGoogleUser({
        email: userInfo.email,
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
        lastName:
          userInfo.family_name ||
          userInfo.name?.split(' ').slice(1).join(' ') ||
          '',
        googleId: userInfo.sub,
        picture: userInfo.picture,
      });

      this.logger.log(`User authenticated successfully: ${result.user.email}`);

      // Redirect to frontend with success
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback error', error);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Token exchange error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to exchange code for tokens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'User info fetch error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to fetch user info from Google',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug/google-config')
  async debugGoogleConfig() {
    return {
      hasClientId: !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
      hasClientSecret: !!this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      hasCallbackUrl: !!this.configService.get<string>('GOOGLE_CALLBACK_URL'),
      callbackUrl: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    };
  }

  @Get('test-route')
  async testRoute() {
    return {
      message: 'Test route working',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() loginDto: { email: string; password: string },
  ): Promise<{ accessToken: string; user: Record<string, string> }> {
    // Demo admin credentials
    const adminCredentials = {
      email: 'admin@tradetaper.com',
      password: 'admin123',
    };

    if (
      loginDto.email !== adminCredentials.email ||
      loginDto.password !== adminCredentials.password
    ) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Create a JWT token for the admin user
    const payload = {
      email: adminCredentials.email,
      sub: 'admin-user-id',
      role: 'admin',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: 'admin-user-id',
        email: adminCredentials.email,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @StrictRateLimit()
  getProfile(@Request() req): UserResponseDto {
    return req.user;
  }

  @Get('test-oauth-routes')
  async testOauthRoutes() {
    return {
      message: 'OAuth routes test',
      routes: ['google', 'google-callback', 'debug/google-config'],
      timestamp: new Date().toISOString(),
    };
  }
}
