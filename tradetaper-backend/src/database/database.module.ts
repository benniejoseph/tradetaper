import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        if (isProduction) {
          // Cloud Run production configuration using TCP connection
          const dbHost = configService.get<string>('DB_HOST') || '34.46.123.71';

          console.log('🔧 Using Cloud SQL TCP connection for Cloud Run');
          console.log(`📍 Database Host: ${dbHost}`);

          return {
            type: 'postgres',
            host: dbHost,
            port: 5432,
            username:
              configService.get<string>('DB_USER') ||
              configService.get<string>('DATABASE_USERNAME'),
            password:
              configService.get<string>('DB_PASSWORD') ||
              configService.get<string>('DATABASE_PASSWORD'),
            database:
              configService.get<string>('DB_NAME') ||
              configService.get<string>('DATABASE_NAME'),
            autoLoadEntities: true,
            synchronize: false, // Disabled after schema sync - use migrations for production
            logging: ['error', 'warn'],
            retryAttempts: 10,
            retryDelay: 5000,
            connectTimeoutMS: 60000,
            ssl: false,
            extra: {
              connectionTimeoutMillis: 60000,
              idle_in_transaction_session_timeout: 60000,
            },
          };
        } else {
          // Local development configuration
          console.log('🔧 Using local database connection');

          return {
            type: 'postgres',
            host:
              configService.get<string>('DB_HOST') ||
              configService.get<string>('DATABASE_HOST') ||
              'localhost',
            port: Number(
              configService.get<string>('DB_PORT') ||
                configService.get<string>('DATABASE_PORT') ||
                5432,
            ),
            username:
              configService.get<string>('DB_USERNAME') ||
              configService.get<string>('DATABASE_USERNAME') ||
              'postgres',
            password:
              configService.get<string>('DB_PASSWORD') ||
              configService.get<string>('DATABASE_PASSWORD') ||
              'postgres',
            database:
              configService.get<string>('DB_DATABASE') ||
              configService.get<string>('DATABASE_NAME') ||
              'tradetaper',
            autoLoadEntities: true,
            synchronize: false,
            logging: true,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
