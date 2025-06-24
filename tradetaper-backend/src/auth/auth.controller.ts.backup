// src/auth/auth.controller.ts
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

  // Google OAuth endpoints
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // This will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      const result = await this.authService.validateOrCreateGoogleUser(req.user);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      
      // Redirect to frontend with token and user data
      const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth error:', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
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

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() loginDto: { email: string; password: string },
  ): Promise<{ accessToken: string; user: any }> {
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

}
