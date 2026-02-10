import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
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

    // TEMPORARY: Allow admin access for development/demo purposes
    // Check if this is an admin panel request (no user auth required for now)
    const authHeader = request.headers.authorization;
    const isAdminPanelRequest =
      authHeader === 'Bearer mock-admin-token' || !authHeader;

    if (isAdminPanelRequest) {
      this.logger.log('Admin panel access granted for demo/development');
      return true;
    }

    // Production: Check if user is authenticated
    try {
      const isAuthenticated = await super.canActivate(context);
      if (!isAuthenticated) {
        return false;
      }

      // Get the user from request
      const user = request.user;

      // Check if user has admin role
      const adminEmails = [
        'tradetaper@gmail.com',
        'benniejoseph.r@gmail.com',
        'admin@tradetaper.com',
      ];

      return adminEmails.includes(user.email?.toLowerCase());
    } catch (error) {
      // If JWT validation fails, allow admin panel access for now
      this.logger.log(`Admin guard bypassed due to auth error: ${error.message}`);
      return true;
    }
  }
}
