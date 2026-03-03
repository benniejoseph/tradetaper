import axios from 'axios';
import { randomBytes, timingSafeEqual } from 'crypto';
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
import { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  AuthRateLimit,
  RateLimitGuard,
  StrictRateLimit,
} from '../common/guards/rate-limit.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth') // Route prefix /api/v1/auth
@UseGuards(RateLimitGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
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
  @AuthRateLimit()
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
  async googleAuth(@Res() res: Response) {
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
      const state = randomBytes(32).toString('hex');
      const secureCookie = this.configService.get<string>('NODE_ENV') === 'production';
      res.cookie('oauth_state', state, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        path: '/api/v1/auth/google/callback',
        maxAge: 10 * 60 * 1000,
      });

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;

      this.logger.log('Redirecting to Google OAuth provider');
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
  async googleCallback(
    @Query() query: Record<string, string>,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    try {
      const { code, error, state } = query;
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';

      if (error) {
        this.logger.error(`Google OAuth error: ${error}`);
        throw new BadRequestException(`Google OAuth error: ${error}`);
      }

      if (!code) {
        throw new BadRequestException('No authorization code received');
      }
      const storedState = req.cookies?.oauth_state as string | undefined;
      res.clearCookie('oauth_state', {
        path: '/api/v1/auth/google/callback',
      });
      if (!state || !storedState) {
        throw new BadRequestException('Invalid OAuth state');
      }
      const received = Buffer.from(state);
      const expected = Buffer.from(storedState);
      if (
        received.length !== expected.length ||
        !timingSafeEqual(received, expected)
      ) {
        throw new BadRequestException('Invalid OAuth state');
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

      // Send auth data in URL fragment to avoid leaking tokens in server/referrer logs.
      const redirectUrl = `${frontendUrl}/auth/google/callback#token=${encodeURIComponent(result.accessToken)}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback error', error);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const errorMessage = this.getPublicOAuthErrorMessage(error);
      const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(errorUrl);
    }
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    if (!clientId || !clientSecret || !callbackUrl) {
      throw new HttpException(
        'Google OAuth not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const form = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    });

    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        form.toString(),
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

  private getPublicOAuthErrorMessage(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (response as { message?: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
        if (Array.isArray(message)) {
          return message.join(', ');
        }
      }
      return error.message;
    }
    return 'Authentication failed';
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @StrictRateLimit()
  async getMe(@Request() req): Promise<UserResponseDto> {
    const user = await this.usersService.findOneByEmail(req.user.email);
    if (!user) {
      // Fallback
      return req.user;
    }

    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Fetch fresh subscription explicitly
    try {
      userResponse.subscription =
        await this.authService.getSubscriptionSnapshot(user.id);
    } catch (e) {
      this.logger.warn(
        `Failed to attach subscription to /me payload for user ${user.id}: ${
          e instanceof Error ? e.message : 'unknown error'
        }`,
      );
    }

    return userResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @StrictRateLimit()
  getProfile(@Request() req): UserResponseDto {
    return req.user;
  }
}
