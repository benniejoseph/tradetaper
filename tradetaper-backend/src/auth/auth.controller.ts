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

@Controller('auth') // Route prefix /api/v1/auth
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
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
