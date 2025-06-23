// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service'; // Adjust path
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity'; // Adjust path
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto'; // Adjust path
import { JwtPayload } from './strategies/jwt.strategy';

interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    try {
      this.logger.debug(`Validating user: ${email}`);
      const user = await this.usersService.findOneByEmail(email);
      
      if (!user) {
        this.logger.debug(`User not found: ${email}`);
        return null;
      }
      
      this.logger.debug(`User found, validating password for: ${email}`);
      const isPasswordValid = await user.validatePassword(pass);
      
      if (!isPasswordValid) {
        this.logger.debug(`Invalid password for user: ${email}`);
        return null;
      }
      
      this.logger.debug(`Password validated successfully for user: ${email}`);
      return user;
    } catch (error) {
      this.logger.error(`Error validating user ${email}: ${error.message}`, error.stack);
      return null;
    }
  }

  async login(
    user: User,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    try {
      this.logger.log(`Login attempt for user: ${user.email}`);
      
      // Skip re-fetching user since we already have it from validation
      // Try to update lastLoginAt, but don't fail if this fails
      try {
        await this.usersService.updateLastLogin(user.id);
        this.logger.log(`Updated lastLoginAt for user: ${user.id}`);
      } catch (error) {
        this.logger.warn(`Failed to update lastLoginAt for user ${user.id}: ${error.message}`);
        // Continue with login process even if lastLoginAt update fails
      }

      const payload: JwtPayload = {
        email: user.email,
        sub: user.id,
      };
      
      this.logger.log(`Creating JWT token for user: ${user.id}`);
      let accessToken: string;
      try {
        // Sign with explicit options that avoid the expiresIn issue
        accessToken = this.jwtService.sign(payload, { expiresIn: 86400 }); // 24 hours in seconds
        this.logger.log(`JWT token created successfully for user: ${user.id}`);
      } catch (error) {
        this.logger.error(`Failed to sign JWT token for user ${user.id}: ${error.message}`, error.stack);
        throw new UnauthorizedException('Error during token generation');
      }

      const userResponse: UserResponseDto = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      this.logger.log(`Login successful for user: ${user.email}`);
      return {
        accessToken,
        user: userResponse,
      };
    } catch (error) {
      this.logger.error(`Login failed for user ${user.email}: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
    const createdUser = await this.usersService.create(registerUserDto);
    // The create method in UsersService already returns UserResponseDto (or similar safe object)
    return createdUser;
  }
}
