import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Account } from '../users/entities/account.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Usage } from '../subscriptions/entities/usage.entity';
import { Strategy } from '../strategies/entities/strategy.entity';
import { Note } from '../notes/entities/note.entity';
import { NoteBlock } from '../notes/entities/note-block.entity';
import { NoteMedia } from '../notes/entities/note-media.entity';

const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Database configuration (data-source.ts):', {
  isProduction,
  nodeEnv: process.env.NODE_ENV
});

let dbConfig: any = {};

// For production, use Cloud SQL with Unix socket
if (isProduction) {
  console.log('Using Cloud SQL configuration for production');
  
  dbConfig = {
    type: 'postgres' as const,
    host: '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
    username: 'tradetaper',
    password: 'TradeTaper2024',
    database: 'tradetaper',
    ssl: false,
    retryAttempts: 5,
    retryDelay: 3000,
    connectTimeoutMS: 60000,
    extra: {
      max: 10,
      connectionTimeoutMillis: 60000,
    }
  };
} else {
  // For development
  console.log('Using local database configuration for development');
  dbConfig = {
    type: 'postgres' as const,
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'tradetaper',
    ssl: false,
  };
}

console.log('FINAL DATABASE CONFIG (data-source.ts):', {
  isProduction,
  host: dbConfig.host,
  username: dbConfig.username,
  database: dbConfig.database,
  ssl: dbConfig.ssl,
  nodeEnv: process.env.NODE_ENV,
});

export const AppDataSource = new DataSource({
  ...dbConfig,
  entities: [User, Account, Trade, Tag, MT5Account, Subscription, Usage, Strategy, Note, NoteBlock, NoteMedia],
  migrations: [isProduction ? 'dist/migrations/*{.ts,.js}' : 'src/migrations/*{.ts,.js}'],
  synchronize: false, // Always false for production safety
  logging: process.env.NODE_ENV !== 'production',
});