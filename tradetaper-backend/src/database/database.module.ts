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
        const parsePositiveInt = (
          value: string | undefined,
          fallback: number,
        ): number => {
          const parsed = Number(value);
          return Number.isFinite(parsed) && parsed > 0
            ? Math.floor(parsed)
            : fallback;
        };
        const splitCsv = (value: string | undefined): string[] =>
          (value || '')
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);

        if (isProduction) {
          const instanceName = configService.get<string>(
            'INSTANCE_CONNECTION_NAME',
          );
          const sslRaw =
            configService.get<string>('DB_SSL')?.trim().toLowerCase() ?? 'true';
          const isSSL = ['true', '1', 'yes'].includes(sslRaw);

          const poolerHost = configService.get<string>('DB_POOLER_HOST')?.trim();
          const directHost = configService.get<string>('DB_HOST')?.trim();
          const poolerPort = parsePositiveInt(
            configService.get<string>('DB_POOLER_PORT'),
            6543,
          );
          const directPort = parsePositiveInt(
            configService.get<string>('DB_PORT'),
            5432,
          );

          const poolerCandidates = splitCsv(
            configService.get<string>('DB_USER_CANDIDATES'),
          );
          const poolerPreferredUser =
            poolerCandidates.find((candidate) => candidate.includes('.')) ||
            poolerCandidates[0];

          const selectedHost = poolerHost || directHost;
          const selectedPort = poolerHost ? poolerPort : directPort;
          const username = poolerHost
            ? poolerPreferredUser ||
              configService.get<string>('DB_USER') ||
              configService.get<string>('DB_USERNAME') ||
              configService.get<string>('DATABASE_USERNAME')
            : configService.get<string>('DB_USER') ||
              configService.get<string>('DB_USERNAME') ||
              configService.get<string>('DATABASE_USERNAME') ||
              poolerPreferredUser;

          if (!instanceName && !selectedHost) {
            throw new Error(
              'Database host is not configured. Set DB_POOLER_HOST or DB_HOST.',
            );
          }

          const connectionTimeoutMillis = parsePositiveInt(
            configService.get<string>('DB_CONNECTION_TIMEOUT_MS'),
            15000,
          );
          const idleTimeoutMillis = parsePositiveInt(
            configService.get<string>('DB_IDLE_TIMEOUT_MS'),
            30000,
          );
          const queryTimeoutMillis = parsePositiveInt(
            configService.get<string>('DB_QUERY_TIMEOUT_MS'),
            60000,
          );
          const maxPoolSize = parsePositiveInt(
            configService.get<string>('DB_POOL_MAX'),
            10,
          );

          const config = {
            type: 'postgres',
            host: instanceName ? `/cloudsql/${instanceName}` : selectedHost,
            port: selectedPort,
            ssl:
              instanceName || !isSSL ? false : { rejectUnauthorized: false },
            database:
              configService.get<string>('DB_DATABASE') ||
              configService.get<string>('DB_NAME') ||
              configService.get<string>('DATABASE_NAME'),
            username,
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
              max: maxPoolSize,
              connectionTimeoutMillis,
              idleTimeoutMillis,
              query_timeout: queryTimeoutMillis,
              statement_timeout: queryTimeoutMillis,
              keepAlive: true,
              keepAliveInitialDelayMillis: 10000,
            },
          } as any;

          logger.log(
            `Database connection mode=${instanceName ? 'cloudsql-socket' : poolerHost ? 'supabase-pooler' : 'tcp-direct'}, host=${config.host}, port=${config.port}, database=${config.database}, username=${config.username}, hasPassword=${!!config.password}`,
          );

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
