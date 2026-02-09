import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

/**
 * SECURITY: CSRF (Cross-Site Request Forgery) protection middleware
 * Protects against CSRF attacks on state-changing operations (POST, PUT, DELETE, PATCH)
 *
 * How it works:
 * 1. Generates a CSRF token on first request
 * 2. Token is sent to client via cookie
 * 3. Client must include token in request headers for state-changing operations
 * 4. Server validates token matches cookie before processing request
 *
 * Frontend Integration:
 * - GET /api/v1/csrf-token to get token
 * - Include token in header: X-CSRF-Token: <token>
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private doubleCsrfProtection: any;
  private generateTokenFunc: any;

  constructor() {
    // Initialize CSRF protection with secure configuration
    const result = doubleCsrf({
      getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
      cookieName: '__Host-csrf-token',
      cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Safe methods don't need CSRF protection
      getSessionIdentifier: (req) => req.cookies?.['session_id'] || '',
      getCsrfTokenFromRequest: (req) => {
        // Check multiple locations for CSRF token
        return (
          req.headers['x-csrf-token'] as string ||
          req.headers['csrf-token'] as string ||
          req.body?._csrf ||
          req.query?._csrf as string
        );
      },
    });
    
    // Type assertion to bypass incorrect DoubleCsrfUtilities type definition
    const { doubleCsrfProtection, generateToken } = result as any;

    this.doubleCsrfProtection = doubleCsrfProtection;
    this.generateTokenFunc = generateToken;
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for WebSocket upgrade requests
    if (req.headers.upgrade === 'websocket') {
      return next();
    }

    // Skip CSRF for development/test environments if configured
    if (process.env.DISABLE_CSRF === 'true') {
      console.warn('⚠️  CSRF protection disabled (DISABLE_CSRF=true)');
      return next();
    }

    try {
      // Validate CSRF token
      this.doubleCsrfProtection(req, res, next);
    } catch (error) {
      console.error('CSRF validation failed:', error.message);
      throw new ForbiddenException('Invalid CSRF token');
    }
  }

  /**
   * Generate a new CSRF token for a request
   * This should be called by the CSRF token endpoint
   */
  generateToken(req: Request, res: Response): { token: string } {
    // Use the stored generateToken function instead of re-initializing
    const token = this.generateTokenFunc(req, res);
    return { token };
  }
}
