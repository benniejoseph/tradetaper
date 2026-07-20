// src/taper-ai-standalone/jwt.strategy.ts
import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

/**
 * Lightweight JWT validation for the standalone TaperAI service.
 *
 * Verifies signature + expiry against the same JWT_SECRET the main
 * TradeTaper backend signs with, without pulling in the UsersModule tree.
 * The desk only needs the user id from the token.
 */
@Injectable()
export class TaperAiJwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be configured for the TaperAI service');
    }
    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };
    super(options);
  }

  validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    // Shape matches what TaperAiController reads (req.user.id)
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
