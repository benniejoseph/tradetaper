import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunitySettings } from './entities/community-settings.entity';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityFollow } from './entities/community-follow.entity';
import { CommunityPostReply } from './entities/community-post-reply.entity';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Account } from '../users/entities/account.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunitySettings,
      CommunityPost,
      CommunityFollow,
      CommunityPostReply,
      User,
      Trade,
      Account,
    ]),
    NotificationsModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
