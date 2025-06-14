import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';

@Module({
  imports: [
    // TEMPORARY: Comment out for initial deployment to get admin endpoints working
    // TypeOrmModule.forFeature([User, Trade])
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
