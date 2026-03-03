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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin token is required');
    }

    const token = authHeader.slice(7).trim();
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
      }>(token, {
        secret: adminJwtSecret,
      });

      if (payload.role !== 'admin') {
        throw new ForbiddenException('Admin privileges are required');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch (error) {
      this.logger.warn(
        `Admin authentication rejected: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
