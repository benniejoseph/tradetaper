import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * AdminGuard - requires a valid JWT AND an admin email.
 *
 * Admin emails are configured via the ADMIN_EMAILS env var
 * (comma-separated). If the variable is unset, ALL admin access is
 * denied (fail closed). There are no development bypasses.
 */
@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(context);
    const isAuthenticated =
      typeof result === 'boolean' ? result : await (result as Promise<boolean>);
    if (!isAuthenticated) {
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    const email: string | undefined = request.user?.email?.toLowerCase();

    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!email || adminEmails.length === 0 || !adminEmails.includes(email)) {
      this.logger.warn(
        `Admin access denied for ${email ?? 'unknown user'} on ${request.method} ${request.url}`,
      );
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
