// trading-journal-backend/src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  try {
    console.log('🚀 Starting TradeTaper Backend...');
    console.log(`📊 Node.js version: ${process.version}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
    
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['log', 'error', 'warn'],
    });
    
    console.log('✅ NestJS application created successfully');
    
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT') || process.env.PORT || 3000;

    // Simplified CORS for production
    app.enableCors({
      origin: true, // Allow all origins for now to avoid CORS issues
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
    });

    console.log('✅ CORS configured');

    // Add a simple health check before setting global prefix
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'tradetaper-backend' });
    });

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false, // More lenient for now
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Simplified global interceptors - remove custom logger for now
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    console.log('✅ Global pipes and interceptors configured');

    // Simplified static assets serving
    try {
      const uploadsPath = join(__dirname, '..', 'uploads');
      app.useStaticAssets(uploadsPath, {
        prefix: '/uploads/',
      });
      console.log(`📁 Static assets configured: ${uploadsPath}`);
    } catch (error) {
      console.log('⚠️  Static assets configuration skipped:', error.message);
    }

    console.log(`🔧 Starting server on port ${port}...`);
    console.log(`🔧 Binding to 0.0.0.0:${port}`);
    
    await app.listen(port, '0.0.0.0');
    
    console.log('🎉 TradeTaper Backend started successfully!');
    console.log(`🌐 Server URL: http://0.0.0.0:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔌 Port: ${port}`);
    console.log(`❤️  Health check: http://0.0.0.0:${port}/api/v1/health`);
    console.log(`🏓 Ping endpoint: http://0.0.0.0:${port}/api/v1/ping`);
    
    // Test the ping endpoint internally
    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:${port}/api/v1/ping`);
        const data = await response.json();
        console.log('✅ Internal ping test successful:', data);
      } catch (error) {
        console.log('❌ Internal ping test failed:', error.message);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to start TradeTaper Backend:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
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

void bootstrap();
