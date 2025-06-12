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
  try {
    console.log('🚀 Starting TradeTaper Backend...');
    console.log(`📊 Node.js version: ${process.version}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    
    console.log('✅ NestJS application created successfully');
    
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

    console.log('✅ CORS configured');

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

    console.log('✅ Global pipes, filters, and interceptors configured');

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
    console.log(`📁 Serving static assets from ${uploadsPath} at /uploads/`);
    // --- END STATIC ASSETS SERVING ---

    console.log(`🔧 Starting server on port ${port}...`);
    await app.listen(port, '0.0.0.0'); // Listen on all interfaces for deployment
    
    console.log('🎉 TradeTaper Backend started successfully!');
    console.log(`🌐 Server running at: ${await app.getUrl()}`);
    console.log(`📊 Environment: ${configService.get<string>('NODE_ENV')}`);
    console.log(`🔌 Port: ${port}`);
    console.log(`❤️  Health check: /api/v1/health`);
    console.log(`🏓 Ping endpoint: /api/v1/ping`);
    console.log(`💾 Database URL configured: ${configService.get<string>('DATABASE_URL') ? 'Yes' : 'No'}`);
    console.log(`🔐 JWT Secret configured: ${configService.get<string>('JWT_SECRET') ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Failed to start TradeTaper Backend:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}
void bootstrap();
