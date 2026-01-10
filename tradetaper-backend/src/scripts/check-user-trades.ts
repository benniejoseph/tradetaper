
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Account } from '../users/entities/account.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Usage } from '../subscriptions/entities/usage.entity';
import { Strategy } from '../strategies/entities/strategy.entity';
import { Note } from '../notes/entities/note.entity';
import { NoteBlock } from '../notes/entities/note-block.entity';
import { NoteMedia } from '../notes/entities/note-media.entity';
import { PsychologicalInsight } from '../notes/entities/psychological-insight.entity';

async function run() {
  const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5434'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'tradetaper',
      entities: [
        User, Account, Trade, Tag, MT5Account, Subscription, Usage, Strategy, 
        Note, NoteBlock, NoteMedia, PsychologicalInsight
      ],
      synchronize: false,
      logging: false,
    });

  try {
    console.log('Initializing data source (standalone)...');
    await dataSource.initialize();
    
    console.log('Database connected.');

    const email = 'doreishtech@gmail.com';
    console.log(`Searching for user: ${email}`);
    const user = await dataSource.getRepository(User).findOne({ where: { email } });

    if (!user) {
      console.log(`❌ User with email ${email} NOT found.`);
      return;
    }

    console.log(`✅ Found user: ${user.id} (${user.email})`);
    
    const tradeRepo = dataSource.getRepository(Trade);
    const tradeCount = await tradeRepo.count({ where: { userId: user.id } });
    console.log(`📊 Total trades found: ${tradeCount}`);

    if (tradeCount > 0) {
      const trades = await tradeRepo.find({
        where: { userId: user.id },
        take: 3,
        order: { openTime: 'DESC' }
      });
      console.log('📝 Recent 3 trades:');
      trades.forEach(t => {
        console.log(` - ID: ${t.id}, Date: ${t.openTime}, Symbol: ${t.symbol}, Qty: ${t.quantity}, PnL: ${t.profitOrLoss}`);
      });
    } else {
        console.log('User has 0 trades.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    try {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (e) {
      // ignore
    }
  }
}

run();
