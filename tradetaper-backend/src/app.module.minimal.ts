// Minimal app module for admin API deployment
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Remove envFilePath - Cloud Run provides env vars directly
    }),
    AdminModule, // Re-enabled for admin functionality
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}