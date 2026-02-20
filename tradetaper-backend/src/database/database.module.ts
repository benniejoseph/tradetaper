import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        if (isProduction) {
          const instanceName = configService.get<string>(
            'INSTANCE_CONNECTION_NAME',
          );
          // Check for DB_SSL (default true in prod if not specified, safe for Cloud)
          const isSSL = configService.get<string>('DB_SSL') === 'true' || true;

          let hostConfig: Record<string, unknown> = {};
          if (instanceName) {
            logger.log('Using Unix socket for Cloud Run');
            hostConfig = {
              host: `/cloudsql/${instanceName}`,
            };
          } else {
            logger.log('Using Standard TCP Connection (IPv4)');
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
            type: 'postgres',
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
            logging: ['error', 'warn'] as ('error' | 'warn')[],
            retryAttempts: 10,
            retryDelay: 3000,
            // Connection Pool Settings for Cloud Run
            extra: {
              max: 10, // Max DB connections per container
              connectionTimeoutMillis: 5000, // 5s timeout for new connection
              idleTimeoutMillis: 5000, // Close idle connections after 5s to avoid cold starts
              query_timeout: 60000, // 60s query timeout
              keepAlive: true, // Internal keepalive
            },
          } as any;

          logger.log(`Final database config: type=${config.type}, database=${config.database}, username=${config.username}, hasPassword=${!!config.password}`);

          return config;
        } else {
          // Local development configuration
          logger.log('Using local database connection');

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
