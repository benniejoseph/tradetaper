// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { SubscriptionService } from '../subscriptions/services/subscription.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'crypto';
import { AuthSession } from './entities/auth-session.entity';

interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

export interface AuthSessionSummary {
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
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
    @InjectRepository(AuthSession)
    private readonly authSessionsRepository: Repository<AuthSession>,
  ) {}

  private getAccessTokenTtl(): string {
    return this.configService.get<string>('AUTH_ACCESS_TOKEN_TTL') || '15m';
  }

  private getRefreshTokenTtlMs(): number {
    const configuredMs = Number(
      this.configService.get<string>('AUTH_REFRESH_TOKEN_TTL_MS'),
    );
    if (Number.isFinite(configuredMs) && configuredMs > 0) {
      return configuredMs;
    }

    const configuredDays = Number(
      this.configService.get<string>('AUTH_REFRESH_TOKEN_TTL_DAYS'),
    );
    const ttlDays =
      Number.isFinite(configuredDays) && configuredDays > 0
        ? configuredDays
        : 30;
    return ttlDays * 24 * 60 * 60 * 1000;
  }

  private hashRefreshTokenSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  private safeEqualHex(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private parseRefreshToken(
    refreshToken: string,
  ): { sessionId: string; secret: string } | null {
    const separator = refreshToken.indexOf('.');
    if (separator <= 0 || separator >= refreshToken.length - 1) {
      return null;
    }
    const sessionId = refreshToken.slice(0, separator);
    const secret = refreshToken.slice(separator + 1);
    if (!sessionId || !secret) {
      return null;
    }
    return { sessionId, secret };
  }

  private buildRefreshToken(sessionId: string, secret: string): string {
    return `${sessionId}.${secret}`;
  }

  private sanitizeSessionContext(
    sessionContext?: SessionContext,
  ): SessionContext {
    if (!sessionContext) {
      return {};
    }
    return {
      ipAddress: sessionContext.ipAddress?.slice(0, 64),
      userAgent: sessionContext.userAgent?.slice(0, 255),
    };
  }

  private signAccessToken(
    user: { id: string; email: string },
    sessionId?: string,
  ): string {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      sid: sessionId,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.getAccessTokenTtl(),
    });
  }

  private async createRefreshSession(
    userId: string,
    sessionContext?: SessionContext,
    options?: {
      familyId?: string;
      parentSessionId?: string;
    },
  ): Promise<{ session: AuthSession; refreshToken: string }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.getRefreshTokenTtlMs());
    const context = this.sanitizeSessionContext(sessionContext);
    const familyId = options?.familyId || randomUUID();

    const createdSession = this.authSessionsRepository.create({
      userId,
      tokenHash: '',
      familyId,
      parentSessionId: options?.parentSessionId || null,
      expiresAt,
      lastUsedAt: now,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });
    const persistedSession =
      await this.authSessionsRepository.save(createdSession);

    const secret = randomBytes(48).toString('base64url');
    persistedSession.tokenHash = this.hashRefreshTokenSecret(secret);
    await this.authSessionsRepository.save(persistedSession);

    return {
      session: persistedSession,
      refreshToken: this.buildRefreshToken(persistedSession.id, secret),
    };
  }

  private async attachSubscription(
    userResponse: UserResponseDto,
    userId: string,
    contextLabel: string,
  ): Promise<void> {
    try {
      const subscription =
        await this.subscriptionService.getOrCreateSubscription(userId);
      const plan = await this.subscriptionService.getPricingPlan(
        subscription.plan,
      );
      userResponse.subscription = {
        ...subscription,
        planDetails: plan,
      };
    } catch (subError) {
      this.logger.error(
        `Failed to fetch subscription for ${contextLabel} ${userId}: ${subError.message}`,
      );
    }
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async revokeSessionById(
    sessionId: string,
    reason: string,
    updateLastUsedAt = false,
  ): Promise<void> {
    const partial: Partial<AuthSession> = {
      revokedAt: new Date(),
      revokedReason: reason,
    };
    if (updateLastUsedAt) {
      partial.lastUsedAt = new Date();
    }
    await this.authSessionsRepository
      .createQueryBuilder()
      .update(AuthSession)
      .set(partial as any)
      .where('"id" = :sessionId', { sessionId })
      .andWhere('"revokedAt" IS NULL')
      .execute();
  }

  private async revokeSessionFamily(
    userId: string,
    familyId: string,
    reason: string,
  ): Promise<void> {
    await this.authSessionsRepository
      .createQueryBuilder()
      .update(AuthSession)
      .set({
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where('"userId" = :userId', { userId })
      .andWhere('"familyId" = :familyId', { familyId })
      .andWhere('"revokedAt" IS NULL')
      .execute();
  }

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
      this.logger.error(
        `Error validating user ${email}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async validateOrCreateGoogleUser(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    accessToken?: string;
    googleId?: string;
    refreshToken?: string;
  }, sessionContext?: SessionContext): Promise<AuthResult> {
    try {
      this.logger.log(`Google OAuth login attempt for: ${googleUser.email}`);

      // Check if user already exists
      let user = await this.usersService.findOneByEmail(googleUser.email);

      if (!user) {
        // Create new user for Google OAuth
        this.logger.log(
          `Creating new user from Google OAuth: ${googleUser.email}`,
        );
        user = await this.usersService.createGoogleUser({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
        });
      } else {
        this.logger.log(
          `Existing user found for Google OAuth: ${googleUser.email}`,
        );
      }

      // Update last login
      try {
        await this.usersService.updateLastLogin(user.id);
      } catch (error) {
        this.logger.warn(
          `Failed to update lastLoginAt for Google user ${user.id}: ${error.message}`,
        );
      }

      const { session, refreshToken } = await this.createRefreshSession(
        user.id,
        sessionContext,
      );
      const accessToken = this.signAccessToken(user, session.id);
      const userResponse = this.toUserResponse(user);
      await this.attachSubscription(userResponse, user.id, 'Google user');
      this.logger.log(`Google OAuth login successful for: ${user.email}`);
      return {
        accessToken,
        refreshToken,
        user: userResponse,
      };
    } catch (error) {
      this.logger.error(
        `Google OAuth login failed for ${googleUser.email}: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async login(
    user: User,
    sessionContext?: SessionContext,
  ): Promise<AuthResult> {
    try {
      this.logger.log(`Login attempt for user: ${user.email}`);

      // Skip re-fetching user since we already have it from validation
      // Try to update lastLoginAt, but don't fail if this fails
      try {
        await this.usersService.updateLastLogin(user.id);
        this.logger.log(`Updated lastLoginAt for user: ${user.id}`);
      } catch (error) {
        this.logger.warn(
          `Failed to update lastLoginAt for user ${user.id}: ${error.message}`,
        );
        // Continue with login process even if lastLoginAt update fails
      }

      const { session, refreshToken } = await this.createRefreshSession(
        user.id,
        sessionContext,
      );
      this.logger.log(`Creating JWT token for user: ${user.id}`);
      let accessToken: string;
      try {
        accessToken = this.signAccessToken(user, session.id);
        this.logger.log(`JWT token created successfully for user: ${user.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to sign JWT token for user ${user.id}: ${error.message}`,
          error.stack,
        );
        throw new UnauthorizedException('Error during token generation');
      }
      const userResponse = this.toUserResponse(user);
      await this.attachSubscription(userResponse, user.id, 'user');

      this.logger.log(`Login successful for user: ${user.email}`);
      return {
        accessToken,
        refreshToken,
        user: userResponse,
      };
    } catch (error) {
      this.logger.error(
        `Login failed for user ${user.email}: ${error.message}`,
        error.stack,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
    const createdUser = await this.usersService.create(registerUserDto);

    // Create default free subscription immediately upon registration
    try {
      await this.subscriptionService.getOrCreateSubscription(createdUser.id);
      this.logger.log(
        `Default free subscription created for new user: ${createdUser.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create default subscription for ${createdUser.email}: ${error.message}`,
      );
      // Non-blocking: user exists, subscription will be created on first login if this fails
    }

    return createdUser;
  }

  async getSubscriptionSnapshot(userId: string) {
    const subscription =
      await this.subscriptionService.getOrCreateSubscription(userId);
    const plan = await this.subscriptionService.getPricingPlan(subscription.plan);
    return {
      ...subscription,
      planDetails: plan,
    };
  }

  async refreshSession(
    refreshToken: string,
    sessionContext?: SessionContext,
  ): Promise<AuthResult> {
    const parsedToken = this.parseRefreshToken(refreshToken);
    if (!parsedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.authSessionsRepository.findOne({
      where: { id: parsedToken.sessionId },
    });
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashRefreshTokenSecret(parsedToken.secret);
    const hashMatches = this.safeEqualHex(tokenHash, session.tokenHash);

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.revokeSessionById(session.id, 'expired');
      throw new UnauthorizedException('Refresh token expired');
    }

    if (session.revokedAt) {
      // If a rotated (previously valid) token is reused, revoke the whole family.
      if (hashMatches && session.replacedBySessionId) {
        await this.revokeSessionFamily(
          session.userId,
          session.familyId,
          'reuse-detected',
        );
        throw new UnauthorizedException('Refresh token reuse detected');
      }
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!hashMatches) {
      // Token hash mismatch on a live session indicates possible tampering.
      await this.revokeSessionFamily(
        session.userId,
        session.familyId,
        'compromised',
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOneById(session.userId);
    if (!user) {
      await this.revokeSessionById(session.id, 'user-not-found');
      throw new UnauthorizedException('User not found');
    }

    const now = new Date();
    const rotated = await this.createRefreshSession(user.id, sessionContext, {
      familyId: session.familyId,
      parentSessionId: session.id,
    });
    session.revokedAt = now;
    session.revokedReason = 'rotated';
    session.replacedBySessionId = rotated.session.id;
    session.lastUsedAt = now;
    await this.authSessionsRepository.save(session);

    const accessToken = this.signAccessToken(user, rotated.session.id);
    const userResponse = this.toUserResponse(user);
    await this.attachSubscription(userResponse, user.id, 'user');

    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      user: userResponse,
    };
  }

  async revokeRefreshSession(refreshToken: string): Promise<void> {
    const parsedToken = this.parseRefreshToken(refreshToken);
    if (!parsedToken) {
      return;
    }

    const session = await this.authSessionsRepository.findOne({
      where: { id: parsedToken.sessionId },
    });
    if (!session || session.revokedAt) {
      return;
    }

    const tokenHash = this.hashRefreshTokenSecret(parsedToken.secret);
    if (!this.safeEqualHex(tokenHash, session.tokenHash)) {
      return;
    }

    session.revokedAt = new Date();
    session.revokedReason = 'logout';
    session.lastUsedAt = new Date();
    await this.authSessionsRepository.save(session);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.authSessionsRepository
      .createQueryBuilder()
      .update(AuthSession)
      .set({
        revokedAt: new Date(),
        revokedReason: 'logout-all',
      })
      .where('"userId" = :userId', { userId })
      .andWhere('"revokedAt" IS NULL')
      .execute();
  }

  async getUserSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<AuthSessionSummary[]> {
    const sessions = await this.authSessionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const now = Date.now();
    const sorted = sessions.sort((left, right) => {
      const leftTime = (left.lastUsedAt || left.createdAt).getTime();
      const rightTime = (right.lastUsedAt || right.createdAt).getTime();
      return rightTime - leftTime;
    });

    return sorted.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      revokedReason: session.revokedReason,
      isCurrent: !!currentSessionId && session.id === currentSessionId,
      isActive: !session.revokedAt && session.expiresAt.getTime() > now,
    }));
  }

  async revokeUserSessionById(
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    const session = await this.authSessionsRepository.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      return false;
    }
    if (!session.revokedAt) {
      session.revokedAt = new Date();
      session.revokedReason = 'manual';
      session.lastUsedAt = new Date();
      await this.authSessionsRepository.save(session);
    }
    return true;
  }
}
