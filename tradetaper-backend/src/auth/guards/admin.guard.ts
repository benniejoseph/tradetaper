import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // First, verify JWT authentication
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      this.logger.warn('Admin access denied: User not authenticated');
      throw new UnauthorizedException('Authentication required for admin access');
    }

    // Get the authenticated user from request
    const user = request.user;

    if (!user) {
      this.logger.warn('Admin access denied: No user found in request');
      throw new UnauthorizedException('User not found in request');
    }

    // Check if user has admin role
    // SECURITY: Admin emails should be stored in environment variables or database
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

    // Fallback to hardcoded list only in development
    if (adminEmails.length === 0 && process.env.NODE_ENV === 'development') {
      this.logger.warn('Using fallback admin emails - configure ADMIN_EMAILS in production');
      adminEmails.push(
        'tradetaper@gmail.com',
        'benniejoseph.r@gmail.com',
      );
    }

    const isAdmin = adminEmails.includes(user.email?.toLowerCase());

    if (!isAdmin) {
      this.logger.warn(`Admin access denied for user: ${user.email}`);
      throw new ForbiddenException('Admin privileges required');
    }

    this.logger.log(`Admin access granted for user: ${user.email}`);
    return true;
  }
}
