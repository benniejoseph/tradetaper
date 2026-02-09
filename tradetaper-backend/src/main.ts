// trading-journal-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  try {
    console.log('🚀 TradeTaper Backend Starting...');
    console.log(
      `📊 Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`,
    );

    const app = await NestFactory.create(AppModule);

    // SECURITY: Enable cookie parsing for HTTP-only auth cookies
    app.use(cookieParser());
    console.log('🍪 Cookie parser enabled');

    const port = process.env.PORT || 3000;
    console.log(`🔧 Using port: ${port}`);

    // CORS configuration
    const corsOptions: CorsOptions = {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
        'https://tradetaper-frontend.vercel.app',
        'https://tradetaper-admin.vercel.app',
        'https://api.tradetaper.com',
        'https://tradetaper.com',
        'https://www.tradetaper.com',
        'https://api.tradetaper.com',
        process.env.FRONTEND_URL || 'https://tradetaper.com', // Provide a sensible default
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    };

    app.enableCors(corsOptions);

    // Set global prefix
    app.setGlobalPrefix('api/v1');

    // Global validation pipe with detailed error messages
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
          const messages = errors.map(error => ({
            field: error.property,
            errors: Object.values(error.constraints || {}),
          }));
          console.error('🚨 Validation failed:', JSON.stringify(messages, null, 2));
          return new BadRequestException(messages);
        },
      }),
    );

    console.log(`🔧 Starting server on port ${port}...`);
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 TradeTaper Backend is running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`❤️ Health: http://0.0.0.0:${port}/health`);
    console.log(`📊 API: http://0.0.0.0:${port}/api/v1`);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('❌ STARTUP FAILED:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

void bootstrap();
