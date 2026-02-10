import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DataSource');
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

logger.log('data-source.ts module loaded');

const getDataSource = async (): Promise<DataSource> => {
  logger.log('Initializing data source...');

  if (process.env.NODE_ENV === 'test') {
    logger.log('Test environment detected. Using in-memory SQLite.');
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
    logger.log('CloudSqlConnector instantiated.');

    const driverOptions = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME!,
      ipType: IpAddressTypes.PRIVATE,
    });
    logger.log('Connector options received.');

    const dataSource = new DataSource({
      ...driverOptions,
      type: 'postgres',
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Recommended to be false in production
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      logging: ['error', 'warn'],
    });

    logger.log('DataSource object created. Initializing...');
    await dataSource.initialize();
    logger.log('Data source initialized successfully.');
    return dataSource;
  } catch (error) {
    logger.fatal('Error during data source initialization', error);
    throw error; // Re-throw to ensure the process exits
  }
};

export const AppDataSource = getDataSource();
