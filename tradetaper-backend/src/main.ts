// trading-journal-backend/src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'; // Import this
import { join } from 'path'; // Import join from path

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // Use NestExpressApplication
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: ['http://localhost:3001'], // Your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1'); // Optional: set a global API prefix

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties not defined in DTOs
      transform: true, // Automatically transforms payloads to DTO instances
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector))); // Add this

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

  await app.listen(port);
  console.log(`Tradetaper Backend is running on: ${await app.getUrl()}`);
  console.log(`Current NODE_ENV: ${configService.get<string>('NODE_ENV')}`);
}
void bootstrap();
