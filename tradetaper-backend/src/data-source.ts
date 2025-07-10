import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { Account } from './users/entities/account.entity';
import { Trade } from './trades/entities/trade.entity';
import { Tag } from './tags/entities/tag.entity';
import { MT5Account } from './users/entities/mt5-account.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { Usage } from './subscriptions/entities/usage.entity';
import { Strategy } from './strategies/entities/strategy.entity';
import { Note } from './notes/entities/note.entity';
import { NoteBlock } from './notes/entities/note-block.entity';
import { NoteMedia } from './notes/entities/note-media.entity';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';

console.log('📦 data-source.ts module loaded');

const getDataSource = async (): Promise<DataSource> => {
  console.log('🔧 Initializing data source...');

  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Test environment detected. Using in-memory SQLite.');
    return new DataSource({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    });
  }

  try {
    const connector = new Connector();
    console.log('☁️ CloudSqlConnector instantiated.');

    const driverOptions = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME!,
      ipType: IpAddressTypes.PRIVATE,
    });
    console.log('✅ Connector options received.');

    const dataSource = new DataSource({
      ...driverOptions,
      type: 'postgres',
      username: process.env.DB_USER,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Recommended to be false in production
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      logging: ['error', 'warn'],
    });

    console.log('➕ DataSource object created. Initializing...');
    await dataSource.initialize();
    console.log('🎉 Data source initialized successfully.');
    return dataSource;
  } catch (error) {
    console.error('❌ FATAL: Error during data source initialization:', error);
    throw error; // Re-throw to ensure the process exits
  }
};

export const AppDataSource = getDataSource();
