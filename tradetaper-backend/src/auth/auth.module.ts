// src/auth/auth.module.ts
import { Module, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthSession } from './entities/auth-session.entity';

@Module({
  imports: [
    UsersModule, // To use UsersService
    SubscriptionsModule,
    PassportModule,
    ConfigModule, // To use ConfigService for JWT_SECRET
    TypeOrmModule.forFeature([AuthSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          if (configService.get<string>('NODE_ENV') === 'test') {
            return { secret: 'test-jwt-secret' };
          }
          throw new Error('JWT_SECRET must be configured');
        }

        const logger = new Logger('AuthModule');
        logger.log(
          `JWT Configuration - No Expiration: hasSecret=${!!jwtSecret}, secretLength=${jwtSecret.length}`,
        );

        // Remove signOptions entirely to avoid the expiresIn issue
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService], // If other modules need to inject AuthService
})
export class AuthModule {}
