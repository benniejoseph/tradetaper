import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropFirmChallenge } from './entities/prop-firm-challenge.entity';
import { PropFirmService } from './prop-firm.service';
import { PropFirmController } from './prop-firm.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [TypeOrmModule.forFeature([PropFirmChallenge]), SubscriptionsModule],
  providers: [PropFirmService],
  controllers: [PropFirmController],
  exports: [PropFirmService],
})
export class PropFirmModule {}
