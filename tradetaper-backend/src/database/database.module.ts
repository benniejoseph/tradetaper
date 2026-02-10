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
          const instanceName = configService.get<string>(
            'INSTANCE_CONNECTION_NAME',
          );
          // Check for DB_SSL (default true in prod if not specified, safe for Cloud)
          const isSSL = configService.get<string>('DB_SSL') === 'true' || true;

          let hostConfig: any = {};
          if (instanceName) {
            console.log('🔧 Using Unix socket for Cloud Run');
            hostConfig = {
              host: `/cloudsql/${instanceName}`,
            };
          } else {
            console.log('🔧 Using Standard TCP Connection (IPv4)');
            hostConfig = {
              host: configService.get<string>('DB_HOST'),
              port: Number(configService.get<string>('DB_PORT') || 5432),
              ssl: isSSL ? { rejectUnauthorized: false } : false,
              extra: {
                connectionTimeoutMillis: 60000,
                query_timeout: 60000,
              },
            };
          }

          const config = {
            type: 'postgres' as const,
            ...hostConfig,
            database:
              configService.get<string>('DB_DATABASE') ||
              configService.get<string>('DB_NAME') ||
              configService.get<string>('DATABASE_NAME'),
            username:
              configService.get<string>('DB_USER') ||
              configService.get<string>('DATABASE_USERNAME'),
            password:
              configService.get<string>('DB_PASSWORD') ||
              configService.get<string>('DATABASE_PASSWORD'),
            autoLoadEntities: true,
            synchronize: false, // CRITICAL: Never enable in production - use migrations instead
            migrationsRun: true,
            migrations: [__dirname + '/../migrations/*{.ts,.js}'],
            logging: ['error', 'warn'] as any,
            retryAttempts: 10,
            retryDelay: 5000,
            connectTimeoutMS: 60000,
          };

          console.log('🔧 Final database config:', {
            type: config.type,
            host: (config as any).host,
            database: config.database,
            username: config.username,
            hasPassword: !!config.password,
            ssl: !!(config as any).ssl,
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
            synchronize: true,
            logging: true,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
