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
          // Cloud Run production configuration using Unix socket
          console.log('🔧 Using Unix socket for Cloud Run');
          
          const config = {
            type: 'postgres' as const,
            host: '/cloudsql/trade-taper:us-central1:trade-taper-postgres',
            port: 5432,
            database:
              configService.get<string>('DB_NAME') ||
              configService.get<string>('DATABASE_NAME'),
            username:
              configService.get<string>('DB_USER') ||
              configService.get<string>('DATABASE_USERNAME'),
            password:
              configService.get<string>('DB_PASSWORD') ||
              configService.get<string>('DATABASE_PASSWORD'),
            autoLoadEntities: true,
            synchronize: false,
            logging: ['error', 'warn'] as any,
            retryAttempts: 10,
            retryDelay: 5000,
            connectTimeoutMS: 60000,
          };

          console.log('🔧 Final database config:', {
            type: config.type,
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            hasPassword: !!config.password,
          });

          return config;
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
