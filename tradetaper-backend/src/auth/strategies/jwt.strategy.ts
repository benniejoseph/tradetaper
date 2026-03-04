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
  sid?: string;
}

function getJwtSecret(configService: ConfigService): string {
  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (jwtSecret) {
    return jwtSecret;
  }

  if (configService.get<string>('NODE_ENV') === 'test') {
    return 'test-jwt-secret';
  }

  throw new Error('JWT_SECRET must be configured');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const cookieExtractor = (
      request?: Record<string, unknown>,
    ): string | null => {
      if (!request) {
        return null;
      }
      const cookies = request.cookies as Record<string, unknown> | undefined;
      const authToken = cookies?.auth_token;
      return typeof authToken === 'string' ? authToken : null;
    };

    // Construct the options object that matches StrategyOptionsWithoutRequest
    const strategyOptions: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
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
    if (payload.role === 'admin') {
      return {
        id: payload.sub,
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
    return payload.sid
      ? ({ ...user, sid: payload.sid } as UserResponseDto)
      : user;
  }
}
