// trading-journal-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DataSource } from 'typeorm';

async function runMigrations() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    console.log('🔄 Running database migrations...');
    
    const AppDataSource = new DataSource({
      type: 'postgres',
      host: '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
      username: 'tradetaper',
      password: 'TradeTaper2024',
      database: 'tradetaper',
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/migrations/*.js'],
      ssl: false,
      migrationsRun: true,
      synchronize: false,
    });

    try {
      await AppDataSource.initialize();
      await AppDataSource.runMigrations();
      console.log('✅ Migrations completed successfully');
      await AppDataSource.destroy();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      // Don't fail the app startup, just log the error
    }
  }
}

async function bootstrap() {
  try {
    console.log('🚀 TradeTaper Backend Starting...');
    console.log(`📊 Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`);
    
    // Run migrations first in production
    await runMigrations();

    const app = await NestFactory.create(AppModule);
    
    const port = process.env.PORT || 3000;
    console.log(`🔧 Using port: ${port}`);

    // CORS configuration
    const corsOptions: CorsOptions = {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002', 
        'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
        'https://tradetaper-admin.vercel.app',
        process.env.FRONTEND_URL || 'http://localhost:3000',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    };

    app.enableCors(corsOptions);

    // Add health endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
      whitelist: true, 
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    console.log(`🔧 Starting server on port ${port}...`);
    await app.listen(port, '0.0.0.0');
    
    console.log(`🚀 TradeTaper Backend is running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`❤️ Health: http://0.0.0.0:${port}/health`);
    console.log(`📊 API: http://0.0.0.0:${port}/api/v1`);
    
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
