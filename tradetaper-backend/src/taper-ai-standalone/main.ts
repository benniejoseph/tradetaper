// src/taper-ai-standalone/main.ts
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TaperAiAppModule } from './taperai-app.module';

/**
 * Entry point for the standalone TaperAI Desk service (Cloud Run service
 * `taperai-desk`). Bearer-token auth only — no cookies, so no CSRF layer.
 */
async function bootstrap() {
  const logger = new Logger('TaperAiBootstrap');
  const app = await NestFactory.create(TaperAiAppModule);

  app.enableCors({
    origin: [
      'https://tradetaper.com',
      'https://www.tradetaper.com',
      /^https:\/\/tradetaper-frontend-[a-z0-9-]+\.vercel\.app$/,
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = process.env.PORT || 8080;
  await app.listen(port);
  logger.log(`TaperAI Desk service listening on :${port}`);
}

void bootstrap();
