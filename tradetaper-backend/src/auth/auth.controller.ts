import axios from 'axios';
import { randomBytes, timingSafeEqual } from 'crypto';
import {
  Controller,
  Request,
  Post,
  Delete,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UnauthorizedException,
  Res,
  Req,
  Query,
  HttpException,
  BadRequestException,
  Logger,
  Param,
} from '@nestjs/common';
import { Request as ExpressRequest, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  AuthRateLimit,
  RateLimit,
  RateLimitGuard,
  StrictRateLimit,
} from '../common/guards/rate-limit.guard';
import { ConfigService } from '@nestjs/config';
import { ObservabilityService } from '../common/services/observability.service';

@Controller('auth') // Route prefix /api/v1/auth
@UseGuards(RateLimitGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  private getRequestSessionContext(req: ExpressRequest): {
    ipAddress?: string;
    userAgent?: string;
  } {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0];
    const userAgentHeader = req.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader[0]
      : userAgentHeader;
    return {
      ipAddress: forwardedIp?.trim() || req.ip,
      userAgent,
    };
  }

  private extractEmailDomain(email: string): string {
    const domain = email.split('@')[1];
    return domain ? domain.toLowerCase() : 'unknown';
  }

  private resolveCookieSameSite(): CookieOptions['sameSite'] {
    const configured = this.configService
      .get<string>('AUTH_COOKIE_SAME_SITE')
      ?.toLowerCase();
    if (configured === 'strict') return 'strict';
    if (configured === 'none') return 'none';
    return 'lax';
  }

  private resolveCookieDomain(): string | undefined {
    const configuredCookieDomain =
      this.configService.get<string>('AUTH_COOKIE_DOMAIN');
    if (configuredCookieDomain) {
      return configuredCookieDomain;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      return undefined;
    }

    try {
      const hostname = new URL(frontendUrl).hostname.toLowerCase();
      if (hostname === 'localhost' || /^[\d.]+$/.test(hostname)) {
        return undefined;
      }
      const hostParts = hostname.split('.');
      if (hostParts.length < 2) {
        return undefined;
      }
      return `.${hostParts.slice(-2).join('.')}`;
    } catch {
      return undefined;
    }
  }

  private getAuthCookieOptions(): CookieOptions {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite = this.resolveCookieSameSite();
    const configuredMaxAge = Number(
      this.configService.get<string>('AUTH_COOKIE_MAX_AGE_MS'),
    );
    const maxAge =
      Number.isFinite(configuredMaxAge) && configuredMaxAge > 0
        ? configuredMaxAge
        : 15 * 60 * 1000;

    const options: CookieOptions = {
      httpOnly: true,
      secure: isProd || sameSite === 'none',
      sameSite,
      path: '/',
      maxAge,
    };

    const domain = this.resolveCookieDomain();
    if (domain) {
      options.domain = domain;
    }

    return options;
  }

  private getRefreshCookieOptions(): CookieOptions {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite = this.resolveCookieSameSite();
    const configuredMaxAge = Number(
      this.configService.get<string>('AUTH_REFRESH_COOKIE_MAX_AGE_MS'),
    );
    const configuredTtlMs = Number(
      this.configService.get<string>('AUTH_REFRESH_TOKEN_TTL_MS'),
    );
    const configuredTtlDays = Number(
      this.configService.get<string>('AUTH_REFRESH_TOKEN_TTL_DAYS'),
    );

    const defaultMaxAge =
      Number.isFinite(configuredTtlMs) && configuredTtlMs > 0
        ? configuredTtlMs
        : Number.isFinite(configuredTtlDays) && configuredTtlDays > 0
          ? configuredTtlDays * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
    const maxAge =
      Number.isFinite(configuredMaxAge) && configuredMaxAge > 0
        ? configuredMaxAge
        : defaultMaxAge;

    const options: CookieOptions = {
      httpOnly: true,
      secure: isProd || sameSite === 'none',
      sameSite,
      path: '/api/v1/auth',
      maxAge,
    };

    const domain = this.resolveCookieDomain();
    if (domain) {
      options.domain = domain;
    }

    return options;
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie('auth_token', token, this.getAuthCookieOptions());
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, this.getRefreshCookieOptions());
  }

  private setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    this.setAuthCookie(res, accessToken);
    this.setRefreshCookie(res, refreshToken);
  }

  private clearAuthCookie(res: Response): void {
    const options = this.getAuthCookieOptions();
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: options.secure,
      sameSite: options.sameSite,
      path: options.path,
      domain: options.domain,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const options = this.getRefreshCookieOptions();
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: options.secure,
      sameSite: options.sameSite,
      path: options.path,
      domain: options.domain,
    });
  }

  private clearSessionCookies(res: Response): void {
    this.clearAuthCookie(res);
    this.clearRefreshCookie(res);
  }

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
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    const user = await this.authService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    if (!user) {
      this.observabilityService.captureEvent(
        'auth_login_failed',
        'anonymous',
        {
          method: 'password',
          reason: 'invalid_credentials',
          emailDomain: this.extractEmailDomain(loginUserDto.email),
        },
      );
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(
      user,
      this.getRequestSessionContext(req),
    );
    this.observabilityService.captureEvent(
      'auth_login_success',
      result.user.id,
      {
        method: 'password',
        emailDomain: this.extractEmailDomain(result.user.email),
      },
    );
    this.setSessionCookies(res, result.accessToken, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
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
      const result = await this.authService.validateOrCreateGoogleUser(
        {
          email: userInfo.email,
          firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
          lastName:
            userInfo.family_name ||
            userInfo.name?.split(' ').slice(1).join(' ') ||
            '',
          googleId: userInfo.sub,
          picture: userInfo.picture,
        },
        this.getRequestSessionContext(req),
      );

      this.logger.log(`User authenticated successfully: ${result.user.email}`);
      this.observabilityService.captureEvent(
        'auth_login_success',
        result.user.id,
        {
          method: 'google',
          emailDomain: this.extractEmailDomain(result.user.email),
        },
      );
      this.setSessionCookies(res, result.accessToken, result.refreshToken);

      // Keep redirect clean to avoid token/user payload in URLs.
      const redirectUrl = `${frontendUrl}/auth/google/callback?status=success`;

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback error', error);
      this.observabilityService.captureEvent(
        'auth_login_failed',
        'anonymous',
        {
          method: 'google',
          reason: this.getPublicOAuthErrorMessage(error),
        },
      );
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Too many refresh attempts. Please try again shortly.',
  })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    const refreshToken =
      typeof req.cookies?.refresh_token === 'string'
        ? req.cookies.refresh_token
        : null;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const result = await this.authService.refreshSession(
        refreshToken,
        this.getRequestSessionContext(req),
      );
      this.setSessionCookies(res, result.accessToken, result.refreshToken);
      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    } catch (error) {
      this.clearSessionCookies(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const refreshToken =
      typeof req.cookies?.refresh_token === 'string'
        ? req.cookies.refresh_token
        : null;
    if (refreshToken) {
      await this.authService.revokeRefreshSession(refreshToken);
    }
    this.clearSessionCookies(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    await this.authService.revokeAllUserSessions(req.user.id);
    this.clearSessionCookies(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Request() req): Promise<{
    sessions: Array<{
      id: string;
      userAgent?: string | null;
      ipAddress?: string | null;
      createdAt: Date;
      lastUsedAt?: Date | null;
      expiresAt: Date;
      revokedAt?: Date | null;
      revokedReason?: string | null;
      isCurrent: boolean;
      isActive: boolean;
    }>;
  }> {
    const sessions = await this.authService.getUserSessions(
      req.user.id,
      req.user.sid,
    );
    return { sessions };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const revoked = await this.authService.revokeUserSessionById(
      req.user.id,
      sessionId,
    );
    if (revoked && req.user.sid && sessionId === req.user.sid) {
      this.clearSessionCookies(res);
    }
    return { success: revoked };
  }
}
