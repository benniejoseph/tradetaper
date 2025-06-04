import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check if user is authenticated
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    // Get the user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has admin role
    // TODO: Implement proper role checking based on your user entity
    // For now, we'll check if the user email is in an admin list
    const adminEmails = [
      'tradetaper@gmail.com',
      'benniejoseph.r@gmail.com',
      'admin@tradetaper.com',
      // Add more admin emails as needed
    ];

    return adminEmails.includes(user.email?.toLowerCase());
  }
} 