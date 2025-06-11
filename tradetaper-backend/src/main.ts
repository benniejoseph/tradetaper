// trading-journal-backend/src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'; // Import this
import { join } from 'path'; // Import join from path
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ProductionLoggerService } from './common/services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || process.env.PORT || 3000;

  // Enhanced CORS for production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  // Add pattern matching for deployment platforms
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? [...allowedOrigins, /vercel\.app$/, /railway\.app$/, /onrender\.com$/]
      : allowedOrigins;

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Get services for global providers
  const productionLogger = app.get(ProductionLoggerService);

  // Configure global filters and interceptors
  app.useGlobalFilters(new GlobalExceptionFilter(productionLogger, configService));
  app.useGlobalInterceptors(
    new LoggingInterceptor(productionLogger),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // --- ADD STATIC ASSETS SERVING ---
  // This makes files in the 'uploads' directory (at the project root)
  // accessible via the '/uploads' route prefix.
  // e.g., if a file is at 'uploads/users/123/trades/images/abc.png',
  // it will be accessible at 'http://localhost:3000/uploads/users/123/trades/images/abc.png'
  // (assuming your API prefix /api/v1 doesn't conflict, which it shouldn't for static assets)
  const uploadsPath = join(__dirname, '..', 'uploads'); // Resolve path relative to dist/main.js
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/', // URL prefix
  });
  console.log(`Serving static assets from ${uploadsPath} at /uploads/`);
  // --- END STATIC ASSETS SERVING ---

  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for deployment
  console.log(`Tradetaper Backend is running on: ${await app.getUrl()}`);
  console.log(`Current NODE_ENV: ${configService.get<string>('NODE_ENV')}`);
  console.log(`Port: ${port}`);
}
void bootstrap();
