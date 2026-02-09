import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { INestApplicationContext, Logger } from '@nestjs/common';

/**
 * SECURITY: WebSocket adapter that validates JWT tokens on connection
 * Extracts JWT from auth header or query parameter and validates before allowing connection
 */
export class WsJwtAdapter extends IoAdapter {
  private readonly logger = new Logger(WsJwtAdapter.name);
  private jwtService: JwtService;
  private configService: ConfigService;

  constructor(private app: INestApplicationContext) {
    super(app);
    this.jwtService = this.app.get(JwtService);
    this.configService = this.app.get(ConfigService);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    // SECURITY: Middleware to validate JWT on connection
    server.use(async (socket: any, next) => {
      try {
        // Extract token from auth header or query parameter
        let token: string | null = null;

        // Try auth header first (Bearer token)
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
          this.logger.debug('Token extracted from Authorization header');
        }

        // Fallback to query parameter (for browser clients)
        if (!token && socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
          this.logger.debug('Token extracted from auth.token');
        }

        // Fallback to query parameter (legacy)
        if (!token && socket.handshake.query?.token) {
          token = socket.handshake.query.token as string;
          this.logger.debug('Token extracted from query parameter');
        }

        // Try cookie as last resort (for cookie-based auth)
        if (!token && socket.handshake.headers.cookie) {
          const cookies = socket.handshake.headers.cookie.split('; ');
          const authCookie = cookies.find((c: string) =>
            c.startsWith('auth_token='),
          );
          if (authCookie) {
            token = authCookie.split('=')[1];
            this.logger.debug('Token extracted from cookie');
          }
        }

        if (!token) {
          this.logger.warn(
            `WebSocket connection rejected: No token provided from ${socket.handshake.address}`,
          );
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const jwtSecret = this.configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          this.logger.error('JWT_SECRET not configured');
          return next(new Error('Server configuration error'));
        }

        const payload = await this.jwtService.verifyAsync(token, {
          secret: jwtSecret,
        });

        // Attach user info to socket for use in handlers
        socket.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        };

        this.logger.log(
          `WebSocket authenticated: User ${payload.email} (${payload.sub})`,
        );
        next();
      } catch (error) {
        this.logger.warn(`WebSocket authentication failed: ${error.message}`);
        next(new Error('Invalid or expired token'));
      }
    });

    return server;
  }
}
