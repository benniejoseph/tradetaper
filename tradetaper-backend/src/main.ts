// trading-journal-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';

import helmet from 'helmet';
import { WsJwtAdapter } from './websocket/ws-jwt.adapter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    logger.log('TradeTaper Backend Starting...');
    logger.log(
      `Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`,
    );

    const app = await NestFactory.create(AppModule);

    // CORS configuration - MUST BE FIRST (before other middleware)
    const corsOptions: CorsOptions = {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://tradetaper.com',
        'https://www.tradetaper.com',
        'https://api.tradetaper.com',
        'https://tradetaper-frontend.vercel.app',
        'https://tradetaper-admin.vercel.app',
        ...(process.env.ALLOWED_ORIGINS
          ? process.env.ALLOWED_ORIGINS.split(',')
          : []),
        process.env.FRONTEND_URL || 'https://tradetaper.com',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'CSRF-Token',
        'x-csrf-token',
      ],
      credentials: true,
    };
    app.enableCors(corsOptions);
    logger.log(
      `CORS enabled for origins: ${JSON.stringify(corsOptions.origin)}`,
    );

    // SECURITY: Use JWT-authenticated WebSocket adapter
    app.useWebSocketAdapter(new WsJwtAdapter(app));
    logger.log('WebSocket JWT authentication enabled');

    // SECURITY: Add security headers to protect against common attacks
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api.tradetaper.com'],
          },
        },
        crossOriginEmbedderPolicy: false, // Allow embedding for OAuth
      }),
    );
    logger.log('Security headers enabled (Helmet.js)');

    // SECURITY: Enable cookie parsing for HTTP-only auth cookies
    app.use(cookieParser());
    logger.log('Cookie parser enabled');

    // SECURITY: CSRF protection for state-changing operations
    // Only enable in production or when explicitly enabled
    const enableCsrf =
      process.env.ENABLE_CSRF === 'true' ||
      process.env.NODE_ENV === 'production';
    if (enableCsrf) {
      const { doubleCsrfProtection } = doubleCsrf({
        getSecret: () =>
          process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
        cookieName: '__Host-csrf',
        cookieOptions: {
          httpOnly: true,
          sameSite: 'none', // Allow cross-site (subdomains/vercel)
          secure: true, // Must be true for sameSite: 'none'
          path: '/',
        },
        size: 64,
        ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
        getSessionIdentifier: (req) => {
          // Use session cookie or create a default identifier
          return req.cookies?.['connect.sid'] || req.cookies?.['session'] || '';
        },
        getCsrfTokenFromRequest: (req) => {
          return (req.headers['x-csrf-token'] ||
            req.headers['csrf-token'] ||
            req.body?._csrf ||
            req.query?._csrf) as string;
        },
      });

      // Custom middleware wrapper to exclude webhook endpoints from CSRF protection
      app.use((req: any, res: any, next: any) => {
        if (req.path && req.path.includes('/api/v1/webhook')) {
          next();
        } else {
          doubleCsrfProtection(req, res, next);
        }
      });

      logger.log('CSRF protection enabled');
    } else {
      logger.warn('CSRF protection disabled (set ENABLE_CSRF=true to enable)');
    }

    const port = process.env.PORT || 3000;
    logger.log(`Using port: ${port}`);

    // Set global prefix
    app.setGlobalPrefix('api/v1');

    // Global validation pipe with detailed error messages
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
          const messages = errors.map((error) => ({
            field: error.property,
            errors: Object.values(error.constraints || {}),
          }));
          logger.error(
            `Validation failed: ${JSON.stringify(messages, null, 2)}`,
          );
          return new BadRequestException(messages);
        },
      }),
    );

    logger.log(`Starting server on port ${port}...`);
    await app.listen(port, '0.0.0.0');

    logger.log(`TradeTaper Backend is running on port ${port}`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`Health: http://0.0.0.0:${port}/health`);
    logger.log(`API: http://0.0.0.0:${port}/api/v1`);
    logger.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error: unknown) {
    const err = error as Error;
    logger.fatal(`STARTUP FAILED: ${err.message}`, err.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal(`Uncaught Exception: ${error.message}`, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

void bootstrap();
