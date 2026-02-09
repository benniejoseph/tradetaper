import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

/**
 * CSRF token endpoint
 * Provides CSRF tokens to frontend clients for protected requests
 *
 * SECURITY: CSRF (Cross-Site Request Forgery) Protection
 * This endpoint generates tokens that must be included in state-changing requests
 * to verify that the request originated from the same site.
 */
@Controller('csrf-token')
export class CsrfController {
  /**
   * Get a CSRF token
   * Frontend should call this endpoint to get a token before making state-changing requests
   *
   * Usage:
   * 1. GET /api/v1/csrf-token
   * 2. Extract the token from the response
   * 3. Include in subsequent POST/PUT/DELETE/PATCH requests:
   *    Header: X-CSRF-Token: <token>
   *
   * The token is automatically generated and stored in a cookie by the CSRF middleware.
   * This endpoint extracts and returns that token for the frontend to use.
   */
  @Get()
  getCsrfToken(@Req() req: Request) {
    // The CSRF token is attached to the request by the doubleCsrf middleware
    // It's available in the request object after the middleware runs
    const token = (req as any).csrfToken?.();

    if (!token) {
      return {
        csrfToken: null,
        message: 'CSRF protection is not enabled',
      };
    }

    return {
      csrfToken: token,
    };
  }
}
