// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UsersModule, // To use UsersService
    PassportModule,
    ConfigModule, // To use ConfigService for JWT_SECRET
    CacheModule.register({
      ttl: 15 * 60 * 1000, // 15 minutes
      max: 1000, // maximum number of items in cache
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET') || 'temporary-fallback-jwt-secret-for-debugging-please-set-proper-secret-in-production-environment-12345';
        
        console.log('JWT Configuration - No Expiration:', {
          hasSecret: !!jwtSecret,
          secretLength: jwtSecret.length,
          skipExpiration: true,
        });
        
        // Remove signOptions entirely to avoid the expiresIn issue
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy], // Temporarily remove GoogleStrategy to test
  controllers: [AuthController],
  exports: [AuthService], // If other modules need to inject AuthService
})
export class AuthModule {}
