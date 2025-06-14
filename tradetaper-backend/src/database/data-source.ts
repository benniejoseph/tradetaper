import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Usage } from '../subscriptions/entities/usage.entity';
import { Strategy } from '../strategies/entities/strategy.entity';

// Removed dotenv.config() as Cloud Run provides environment variables directly

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

console.log('FINAL DATABASE CONFIG (data-source.ts):', {
  isProduction,
  databaseUrl,
  ssl: false,
  nodeEnv: process.env.NODE_ENV,
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: isProduction && databaseUrl ? databaseUrl : undefined,
  host: isProduction ? undefined : process.env.DB_HOST || 'localhost',
  port: isProduction ? undefined : parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'tradetaper_dev',
  entities: [User, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false, // Always false for production safety
  logging: process.env.NODE_ENV !== 'production',
  ssl: false,
});