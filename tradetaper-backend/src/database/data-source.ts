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
import { PsychologicalInsight } from '../notes/entities/psychological-insight.entity';
import { Connector } from '@google-cloud/cloud-sql-connector';

const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Database configuration (data-source.ts):', {
  isProduction,
  nodeEnv: process.env.NODE_ENV,
});

async function createDataSource() {
  const configService = new ConfigService();

  if (isProduction) {
    if (!process.env.INSTANCE_CONNECTION_NAME) {
      throw new Error('INSTANCE_CONNECTION_NAME is not defined.');
    }
    if (!process.env.DB_USER) {
      throw new Error('DB_USER is not defined.');
    }
    if (!process.env.DB_PASSWORD) {
      throw new Error('DB_PASSWORD is not defined.');
    }

    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
    });

    return new DataSource({
      ...clientOpts,
      type: 'postgres',
      database: process.env.DB_NAME || 'tradetaper',
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      entities: [
        User,
        Account,
        Trade,
        Tag,
        MT5Account,
        Subscription,
        Usage,
        Strategy,
        Note,
        NoteBlock,
        NoteMedia,
        PsychologicalInsight,
      ],
      migrations: ['dist/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: false,
    });
  } else {
    // Development configuration
    return new DataSource({
      type: 'postgres',
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get<string>('DB_USERNAME', 'postgres'),
      password: configService.get<string>('DB_PASSWORD', 'postgres'),
      database: configService.get<string>('DB_DATABASE', 'tradetaper'),
      entities: [
        User,
        Account,
        Trade,
        Tag,
        MT5Account,
        Subscription,
        Usage,
        Strategy,
        Note,
        NoteBlock,
        NoteMedia,
        PsychologicalInsight,
      ],
      migrations: ['src/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: true,
    });
  }
}

export const AppDataSource = createDataSource();
