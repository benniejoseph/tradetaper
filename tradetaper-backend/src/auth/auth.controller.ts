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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard'; // We'll create this
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // We'll create this
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto'; // Adjust path

@Controller('auth') // Route prefix /api/v1/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<UserResponseDto> {
    return this.authService.register(registerUserDto);
  }

  @Post('test-login')
  @HttpCode(HttpStatus.OK)
  async testLogin(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    const user = await this.authService.validateUser(loginUserDto.email, loginUserDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  // @UseGuards(LocalAuthGuard) // This guard will use LocalStrategy - temporarily disabled
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    const user = await this.authService.validateUser(loginUserDto.email, loginUserDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard) // This guard will use JwtStrategy
  @Get('profile')
  getProfile(@Request() req): UserResponseDto {
    // If JwtAuthGuard passes, req.user will be populated by JwtStrategy.validate()
    // which returns UserResponseDto
    return req.user;
  }
}
