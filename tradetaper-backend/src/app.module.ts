// tradetaper-backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TradesModule } from './trades/trades.module';
import { MarketDataModule } from './market-data/market-data.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST', 'localhost');
        const dbPortString = configService.get<string>('DB_PORT');
        const dbUsername = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD'); // Critical!
        const dbDatabase = configService.get<string>('DB_DATABASE');

        let dbPort = 5432; // Default port
        if (dbPortString) {
          dbPort = parseInt(dbPortString, 10);
        } else {
          console.warn(
            'DB_PORT environment variable is not set, using default 5432.',
          );
        }

        // Explicitly check for critical missing variables
        if (!dbUsername) {
          throw new Error(
            'CRITICAL: DB_USERNAME environment variable is not set. Database connection cannot proceed.',
          );
        }
        // Check if dbPassword is truly a string and not undefined
        if (typeof dbPassword !== 'string') {
          console.error(
            'CRITICAL: DB_PASSWORD environment variable is missing or not a string. Value received:',
            dbPassword,
          );
          throw new Error(
            'CRITICAL: DB_PASSWORD environment variable is not set or not a string. Database connection cannot proceed.',
          );
        }
        if (!dbDatabase) {
          throw new Error(
            'CRITICAL: DB_DATABASE environment variable is not set. Database connection cannot proceed.',
          );
        }

        // For debugging, you can log to see what's being used:
        // console.log('Attempting DB Connection with:', {
        //   host: dbHost,
        //   port: dbPort,
        //   username: dbUsername,
        //   passwordProvided: dbPassword ? 'Yes' : 'No (or empty string)',
        //   database: dbDatabase,
        // });

        return {
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword, // This must be a string and the correct password
          database: dbDatabase,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          autoLoadEntities: true,
          logging:
            configService.get<string>('NODE_ENV') === 'development'
              ? ['query', 'error']
              : ['error'],
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    TradesModule,
    MarketDataModule,
    SeedModule,
    FilesModule,
    // ... other modules will go here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
