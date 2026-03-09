import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { EconomicEventAlert } from '../market-intelligence/entities/economic-event-alert.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { UsersModule } from '../users/users.module';
import { MarketIntelligenceModule } from '../market-intelligence/market-intelligence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      EconomicEventAlert,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => MarketIntelligenceModule), // Added with forwardRef
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
