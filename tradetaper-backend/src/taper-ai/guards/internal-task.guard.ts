// src/taper-ai/guards/internal-task.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Protects the Cloud Tasks delivery endpoint. Not a user-facing route — no
 * JWT is available (Cloud Tasks calls it directly) — so auth is a shared
 * secret set on both the Cloud Tasks task (DeskTaskQueueService) and this
 * service's own env (INTERNAL_TASK_SECRET), same pattern as other
 * service-to-service secrets already used in this codebase.
 */
@Injectable()
export class InternalTaskGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-internal-task-secret'];
    const expected = this.config.get<string>('INTERNAL_TASK_SECRET');

    if (!expected || !provided || provided !== expected) {
      throw new UnauthorizedException('Invalid internal task secret');
    }
    return true;
  }
}
