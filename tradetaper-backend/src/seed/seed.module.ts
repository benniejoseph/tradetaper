// src/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { SeedService } from './seed.service';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { UsersModule } from '../users/users.module'; // Import UsersModule for UsersService

@Module({
  imports: [
    ConfigModule, // Make ConfigService available
    TypeOrmModule.forFeature([User, Trade]),
    UsersModule, // To inject UsersService into SeedService
  ],
  providers: [SeedService],
  exports: [SeedService], // Optional: if other modules might trigger seeding
})
export class SeedModule {}
