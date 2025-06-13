// trading-journal-backend/src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  try {
    console.log('🚀 SIMPLIFIED START - TradeTaper Backend...');
    console.log(`📊 Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`);
    
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn'], // Minimal logging
    });
    
    const port = process.env.PORT || 3000;

    // Minimal CORS
    app.enableCors({ origin: true, credentials: true });

    app.setGlobalPrefix('api/v1');

    // Minimal validation
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: false 
    }));

    console.log(`🔧 Starting server on port ${port}...`);
    await app.listen(port, '0.0.0.0');
    
    console.log('✅ TradeTaper Backend STARTED!');
    console.log(`❤️ Health: http://0.0.0.0:${port}/health`);
    
  } catch (error) {
    console.error('❌ STARTUP FAILED:', error.message);
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
