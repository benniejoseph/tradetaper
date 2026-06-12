// src/auth/auth.module.ts
import { Module, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule, // To use UsersService
    SubscriptionsModule,
    PassportModule,
    ConfigModule, // To use ConfigService for JWT_SECRET
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret || jwtSecret.length < 32) {
          throw new Error(
            'JWT_SECRET must be set to a strong value (>= 32 chars). Refusing to start.',
          );
        }

        const logger = new Logger('AuthModule');
        logger.log(`JWT configured, secretLength=${jwtSecret.length}`);

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
          },
        };
      },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService], // If other modules need to inject AuthService
})
export class AuthModule {}
