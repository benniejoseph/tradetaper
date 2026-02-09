import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SECURITY: Guard that only allows access to endpoints in development mode
 * Use this to protect debug/test endpoints from being accessible in production
 */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isDevelopment = !nodeEnv || nodeEnv === 'development';

    if (!isDevelopment) {
      throw new ForbiddenException(
        'This endpoint is only available in development mode',
      );
    }

    return true;
  }
}
