// trading-journal-backend/src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  try {
    console.log('🚀 TradeTaper Backend Starting...');
    console.log(`📊 Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`);
    
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log'], // Enable more logging for debugging
    });
    
    const port = process.env.PORT || 8080;
    console.log(`🔧 Using port: ${port}`);

    // Enable CORS
    app.enableCors({ 
      origin: true, 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    });

    // Add health endpoints
    const express = app.getHttpAdapter().getInstance();
    express.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV
      });
    });

    express.get('/', (req, res) => {
      res.json({ 
        message: 'TradeTaper Backend API',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    app.setGlobalPrefix('api/v1');

    // Add validation
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: false,
      transform: true
    }));

    console.log(`🔧 Starting server on port ${port}...`);
    await app.listen(port, '0.0.0.0');
    
    console.log('✅ TradeTaper Backend STARTED!');
    console.log(`🌐 Server: http://0.0.0.0:${port}`);
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
