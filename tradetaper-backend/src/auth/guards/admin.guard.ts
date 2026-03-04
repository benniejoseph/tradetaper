import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private parseBooleanEnv(value: string | undefined): boolean | null {
    if (typeof value !== 'string') {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }
    return null;
  }

  private isAdminMfaRequired(): boolean {
    const explicitRequirement = this.parseBooleanEnv(
      this.configService.get<string>('ADMIN_REQUIRE_MFA'),
    );
    if (explicitRequirement !== null) {
      return explicitRequirement;
    }
    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;
    const cookieToken =
      typeof request.cookies?.admin_token === 'string'
        ? request.cookies.admin_token
        : null;
    const token = bearerToken || cookieToken;
    if (!token) {
      throw new UnauthorizedException('Admin token is required');
    }
    const adminJwtSecret =
      this.configService.get<string>('ADMIN_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    if (!adminJwtSecret) {
      throw new InternalServerErrorException(
        'Admin authentication is not configured',
      );
    }

    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role?: string;
        mfa?: boolean;
      }>(token, {
        secret: adminJwtSecret,
      });

      if (payload.role !== 'admin') {
        throw new ForbiddenException('Admin privileges are required');
      }
      if (this.isAdminMfaRequired() && payload.mfa !== true) {
        throw new UnauthorizedException('Admin MFA verification is required');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        mfa: payload.mfa === true,
      };
      return true;
    } catch (error) {
      this.logger.warn(
        `Admin authentication rejected: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
