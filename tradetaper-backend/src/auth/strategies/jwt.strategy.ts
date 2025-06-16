// src/auth/strategies/jwt.strategy.ts
import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt'; // Import StrategyOptionsWithoutRequest
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

function getJwtSecret(configService: ConfigService): string {
  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (!jwtSecret) {
    console.error(
      'WARNING: JWT_SECRET is not defined in environment variables. Using fallback secret for debugging.',
    );
    // Temporary fallback for debugging - should be replaced with proper secret
    return 'temporary-fallback-jwt-secret-for-debugging-please-set-proper-secret-in-production-environment-12345';
  }
  return jwtSecret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // Construct the options object that matches StrategyOptionsWithoutRequest
    const strategyOptions: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(configService),
      // passReqToCallback: false, // Explicitly setting to false
    };

    super(strategyOptions);
  }

  async validate(payload: JwtPayload): Promise<UserResponseDto> {
    this.logger.debug(
      `Validating JWT for user ID: ${payload.sub} and email: ${payload.email}`,
    );

    // Handle admin users
    if (payload.role === 'admin' && payload.sub === 'admin-user-id') {
      return {
        id: 'admin-user-id',
        email: payload.email,
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Handle regular users
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
      this.logger.warn(
        `JWT validation failed: User not found for ID ${payload.sub}`,
      );
      throw new UnauthorizedException('User not found or token invalid.');
    }
    return user;
  }
}
