import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Account } from '../users/entities/account.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Usage } from '../subscriptions/entities/usage.entity';
import { SeedModule } from '../seed/seed.module';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminMfaCredential } from './entities/admin-mfa-credential.entity';
import { AdminAuthAuditLog } from './entities/admin-auth-audit-log.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      Account,
      Trade,
      Tag,
      MT5Account,
      Subscription,
      Usage,
      AdminMfaCredential,
      AdminAuthAuditLog,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('ADMIN_JWT_SECRET') ||
          configService.get<string>('JWT_SECRET');
        const adminAccessTokenTtl =
          configService.get<string>('ADMIN_ACCESS_TOKEN_TTL') || '8h';

        if (!secret) {
          if (configService.get<string>('NODE_ENV') === 'test') {
            return {
              secret: 'test-admin-jwt-secret',
              signOptions: { expiresIn: adminAccessTokenTtl },
            };
          }
          throw new Error(
            'ADMIN_JWT_SECRET (or JWT_SECRET) must be configured for admin authentication',
          );
        }

        return {
          secret,
          signOptions: { expiresIn: adminAccessTokenTtl },
        };
      },
    }),
    SeedModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
