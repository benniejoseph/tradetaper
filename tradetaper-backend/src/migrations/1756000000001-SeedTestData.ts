import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTestData1756000000001 implements MigrationInterface {
  name = 'SeedTestData1756000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check if demo user exists, if not create it
    const userExists = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'demouser@tradetaper.com'`,
    );

    let userId: string;
    if (userExists.length === 0) {
      // Create demo user
      const result = await queryRunner.query(`
        INSERT INTO users (email, password, "firstName", "lastName", "createdAt", "updatedAt")
        VALUES ('demouser@tradetaper.com', '$2b$10$rOzWPYjT8qmRHXpW4VPsXeQ8HG8HwXNzTc5OV4e3OlJ2mU2dZ9yGe', 'Demo', 'User', NOW(), NOW())
        RETURNING id
      `);
      userId = result[0].id;
    } else {
      userId = userExists[0].id;
    }

    // Create subscription for demo user
    await queryRunner.query(`
      INSERT INTO subscriptions (id, "userId", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", status, tier, plan, price, interval, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "canceledAt", "trialStart", "trialEnd", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), '${userId}', null, null, null, 'active', 'professional', 'professional', 29.99, 'month', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', false, null, null, null, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);

    // Create accounts for demo user
    const accounts = [
      {
        name: 'Main Trading Account',
        balance: 50000,
        currency: 'USD',
        description: 'Primary trading account with substantial capital',
      },
      {
        name: 'Swing Trading',
        balance: 25000,
        currency: 'USD',
        description: 'Account for longer-term swing trades',
      },
      {
        name: 'Day Trading',
        balance: 15000,
        currency: 'USD',
        description: 'High-frequency day trading account',
      },
      {
        name: 'Crypto Portfolio',
        balance: 10000,
        currency: 'USD',
        description: 'Cryptocurrency trading account',
      },
    ];

    const accountIds: string[] = [];
    for (const account of accounts) {
      const result = await queryRunner.query(`
        INSERT INTO accounts (id, "userId", name, balance, currency, description, "isActive", target, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '${userId}', '${account.name}', ${account.balance}, '${account.currency}', '${account.description}', true, ${account.balance * 1.2}, NOW(), NOW())
        RETURNING id
      `);
      accountIds.push(result[0].id);
    }

    // Create MT5 accounts
    const mt5Accounts = [
      {
        name: 'MetaTrader 5 Demo',
        server: 'MetaQuotes-Demo',
        login: 'demo001',
        balance: 10000,
      },
      {
        name: 'FTMO Challenge',
        server: 'FTMO-Server01',
        login: 'ftmo123',
        balance: 100000,
      },
    ];

    for (const mt5Account of mt5Accounts) {
      await queryRunner.query(`
        INSERT INTO mt5_accounts (id, "userId", "accountName", server, login, password, "isActive", balance, "accountType", currency, "isRealAccount", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '${userId}', '${mt5Account.name}', '${mt5Account.server}', '${mt5Account.login}', 'encrypted_password', true, ${mt5Account.balance}, 'Demo', 'USD', false, NOW(), NOW())
      `);
    }

    // Create strategies
    const strategies = [
      {
        name: 'Breakout Scalping',
        description:
          'Quick scalping strategy focusing on breakouts from consolidation',
        session: 'London',
        color: '#10b981',
      },
      {
        name: 'Trend Following',
        description: 'Following strong trends with proper risk management',
        session: 'New York',
        color: '#3b82f6',
      },
      {
        name: 'Range Trading',
        description: 'Trading within established support and resistance levels',
        session: 'Asia',
        color: '#f59e0b',
      },
      {
        name: 'News Trading',
        description: 'Trading economic news releases and market reactions',
        session: 'London-NY Overlap',
        color: '#ef4444',
      },
      {
        name: 'ICT Strategy',
        description:
          'Inner Circle Trader methodology with order blocks and fair value gaps',
        session: 'London',
        color: '#8b5cf6',
      },
    ];

    const strategyIds: string[] = [];
    for (const strategy of strategies) {
      const result = await queryRunner.query(`
        INSERT INTO strategies (id, "userId", name, description, "tradingSession", "isActive", color, tags, checklist, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(), 
          '${userId}', 
          '${strategy.name}', 
          '${strategy.description}', 
          '${strategy.session}', 
          true, 
          '${strategy.color}', 
          'profitable,tested,verified', 
          '[{"id":"1","text":"Check market structure","completed":true,"order":0},{"id":"2","text":"Identify key levels","completed":true,"order":1},{"id":"3","text":"Wait for confirmation","completed":false,"order":2}]'::json,
          NOW(), 
          NOW()
        )
        RETURNING id
      `);
      strategyIds.push(result[0].id);
    }

    // Create tags
    const tags = [
      { name: 'Profitable', color: '#10b981' },
      { name: 'Loss', color: '#ef4444' },
      { name: 'Breakeven', color: '#6b7280' },
      { name: 'Perfect Entry', color: '#8b5cf6' },
      { name: 'Early Exit', color: '#f59e0b' },
      { name: 'FOMO', color: '#ef4444' },
      { name: 'Patience', color: '#10b981' },
      { name: 'Discipline', color: '#3b82f6' },
      { name: 'Revenge Trading', color: '#dc2626' },
      { name: 'Good Risk Management', color: '#059669' },
      { name: 'Overtrading', color: '#dc2626' },
      { name: 'Market Analysis', color: '#7c3aed' },
    ];

    const tagIds: string[] = [];
    for (const tag of tags) {
      const result = await queryRunner.query(`
        INSERT INTO tags (id, name, "userId", color, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '${tag.name}', '${userId}', '${tag.color}', NOW(), NOW())
        RETURNING id
      `);
      tagIds.push(result[0].id);
    }

    // Generate 100+ trades with realistic data
    const assetTypes = ['Stock', 'Forex', 'Crypto', 'Futures', 'Options'];
    const symbols = {
      Stock: [
        'AAPL',
        'MSFT',
        'GOOGL',
        'AMZN',
        'TSLA',
        'NVDA',
        'META',
        'NFLX',
        'SPY',
        'QQQ',
      ],
      Forex: [
        'EURUSD',
        'GBPUSD',
        'USDJPY',
        'AUDUSD',
        'USDCAD',
        'NZDUSD',
        'EURGBP',
        'EURJPY',
      ],
      Crypto: [
        'BTCUSD',
        'ETHUSD',
        'ADAUSD',
        'SOLUSD',
        'DOGEUSDT',
        'BNBUSD',
        'XRPUSD',
        'MATICUSD',
      ],
      Futures: ['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', 'ZN'],
      Options: ['SPY', 'QQQ', 'AAPL', 'TSLA', 'AMD', 'NVDA', 'IWM', 'TLT'],
    };
    const directions = ['Long', 'Short'];
    const statuses = ['Closed', 'Open'];
    const sessions = [
      'London',
      'New York',
      'Asia',
      'London-NY Overlap',
      'Other',
    ];
    const ictConcepts = [
      'Fair Value Gap',
      'Order Block',
      'Breaker Block',
      'Liquidity Grab (BSL/SSL)',
      'Market Structure Shift (MSS)',
      'Other',
    ];

    // Generate 120 trades
    for (let i = 0; i < 120; i++) {
      const assetType =
        assetTypes[Math.floor(Math.random() * assetTypes.length)];
      const symbol =
        symbols[assetType][
          Math.floor(Math.random() * symbols[assetType].length)
        ];
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
      const status =
        i < 100
          ? 'Closed'
          : statuses[Math.floor(Math.random() * statuses.length)]; // Most trades closed
      const session = sessions[Math.floor(Math.random() * sessions.length)];
      const ictConcept =
        ictConcepts[Math.floor(Math.random() * ictConcepts.length)];
      const strategyId =
        strategyIds[Math.floor(Math.random() * strategyIds.length)];
      const accountId =
        accountIds[Math.floor(Math.random() * accountIds.length)];

      // Generate realistic dates (last 6 months)
      const daysAgo = Math.floor(Math.random() * 180);
      const openTime = new Date();
      openTime.setDate(openTime.getDate() - daysAgo);
      openTime.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
      );

      let closeTime = null;
      if (status === 'Closed') {
        closeTime = new Date(openTime);
        closeTime.setHours(
          closeTime.getHours() + Math.floor(Math.random() * 48),
        ); // Close within 48 hours
      }

      // Generate realistic prices based on asset type
      let openPrice, closePrice, quantity, commission;
      switch (assetType) {
        case 'Stock':
          openPrice = 50 + Math.random() * 400; // $50-450
          quantity = Math.floor(Math.random() * 500) + 10; // 10-500 shares
          commission = quantity * 0.005; // $0.005 per share
          break;
        case 'Forex':
          openPrice = 0.5 + Math.random() * 1.5; // 0.5-2.0 for forex pairs
          quantity = Math.floor(Math.random() * 100000) + 10000; // 10k-100k units
          commission = quantity * 0.00002; // 2 pips
          break;
        case 'Crypto':
          openPrice = 100 + Math.random() * 50000; // $100-50000
          quantity = Math.random() * 10; // 0.1-10 coins
          commission = openPrice * quantity * 0.001; // 0.1% fee
          break;
        case 'Futures':
          openPrice = 3000 + Math.random() * 2000; // 3000-5000 points
          quantity = Math.floor(Math.random() * 10) + 1; // 1-10 contracts
          commission = quantity * 2.5; // $2.5 per contract
          break;
        case 'Options':
          openPrice = 0.5 + Math.random() * 20; // $0.5-20 premium
          quantity = Math.floor(Math.random() * 100) + 1; // 1-100 contracts
          commission = quantity * 1.0; // $1 per contract
          break;
      }

      // Calculate realistic close price and P&L
      if (status === 'Closed') {
        const priceChange = (Math.random() - 0.45) * 0.1; // Slight positive bias
        closePrice = openPrice * (1 + priceChange);

        let pnl;
        if (direction === 'Long') {
          pnl = (closePrice - openPrice) * quantity - commission;
        } else {
          pnl = (openPrice - closePrice) * quantity - commission;
        }

        // Calculate R-multiple (simplified)
        const stopLoss =
          direction === 'Long' ? openPrice * 0.98 : openPrice * 1.02;
        const riskAmount = Math.abs(openPrice - stopLoss) * quantity;
        const rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;

        await queryRunner.query(`
          INSERT INTO trades (
            id, "userId", "strategyId", "accountId", "isStarred", "assetType", symbol, side, status,
            "openTime", "openPrice", "closeTime", "closePrice", quantity, commission,
            notes, "profitOrLoss", "rMultiple", "stopLoss", "takeProfit", "ictConcept", session,
            "setupDetails", "mistakesMade", "lessonsLearned", "imageUrl", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), '${userId}', '${strategyId}', '${accountId}', ${Math.random() > 0.9},
            '${assetType}', '${symbol}', '${direction}', '${status}',
            '${openTime.toISOString()}', ${openPrice}, '${closeTime.toISOString()}', ${closePrice}, ${quantity}, ${commission},
            'Trade #${i + 1} - ${direction} ${symbol} based on ${ictConcept} setup during ${session} session',
            ${pnl.toFixed(2)}, ${rMultiple.toFixed(4)}, ${stopLoss.toFixed(8)}, ${(openPrice * (direction === 'Long' ? 1.05 : 0.95)).toFixed(8)},
            '${ictConcept}', '${session}',
            'Identified strong ${ictConcept} formation with good risk/reward ratio',
            '${pnl < 0 ? 'Should have waited for better confirmation' : 'Good execution and patience'}',
            '${pnl > 0 ? 'Strategy worked well, continue with same approach' : 'Need to improve entry timing'}',
            null, NOW(), NOW()
          )
        `);
      } else {
        // Open trade
        const stopLoss =
          direction === 'Long' ? openPrice * 0.98 : openPrice * 1.02;
        const takeProfit =
          direction === 'Long' ? openPrice * 1.05 : openPrice * 0.95;

        await queryRunner.query(`
          INSERT INTO trades (
            id, "userId", "strategyId", "accountId", "isStarred", "assetType", symbol, side, status,
            "openTime", "openPrice", quantity, commission, notes, "stopLoss", "takeProfit", 
            "ictConcept", session, "setupDetails", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), '${userId}', '${strategyId}', '${accountId}', ${Math.random() > 0.8},
            '${assetType}', '${symbol}', '${direction}', '${status}',
            '${openTime.toISOString()}', ${openPrice}, ${quantity}, ${commission},
            'Open ${direction} position on ${symbol} - monitoring for ${ictConcept} completion',
            ${stopLoss.toFixed(8)}, ${takeProfit.toFixed(8)}, '${ictConcept}', '${session}',
            'Current open position based on ${ictConcept} with tight risk management',
            NOW(), NOW()
          )
        `);
      }
    }

    // Get all trade IDs for tag associations
    const tradeIds = await queryRunner.query(`
      SELECT id FROM trades WHERE "userId" = '${userId}'
    `);

    // Associate random tags with trades
    for (const trade of tradeIds) {
      const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per trade
      const selectedTags = [];

      for (let i = 0; i < numTags; i++) {
        const randomTag = tagIds[Math.floor(Math.random() * tagIds.length)];
        if (!selectedTags.includes(randomTag)) {
          selectedTags.push(randomTag);
          await queryRunner.query(`
            INSERT INTO trade_tags ("tradeId", "tagId")
            VALUES ('${trade.id}', '${randomTag}')
            ON CONFLICT DO NOTHING
          `);
        }
      }
    }

    // Create notes for some trades
    const noteTemplates = [
      'Excellent trade setup with perfect entry timing. The market respected the key level exactly as expected.',
      'Could have been better - entered too early before confirmation. Need to be more patient next time.',
      'Great risk management saved this trade. Market moved against me initially but stop loss was placed correctly.',
      'This trade demonstrates the importance of proper market analysis. The trend was clear from higher timeframes.',
      'Emotional trading led to this loss. Need to stick to the trading plan and avoid FOMO.',
      'Perfect example of how patience pays off. Waited for the right setup and was rewarded.',
      'Market structure was clean and the entry was textbook. This is exactly how the strategy should work.',
      'News event caused unexpected volatility. Need to be more aware of economic calendar.',
      'Good trade but could have held longer for bigger profits. Working on letting winners run.',
      'Stop loss was too tight for this market condition. Need to adjust for volatility.',
    ];

    const selectedTrades = tradeIds.slice(0, 30); // Create notes for 30 trades
    for (const trade of selectedTrades) {
      const noteContent =
        noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
      await queryRunner.query(`
        INSERT INTO notes (
          id, user_id, trade_id, title, content, tags, visibility, word_count, reading_time,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), '${userId}', '${trade.id}', 
          'Trade Analysis Note', 
          '[{"id":"1","type":"text","content":{"text":"${noteContent}"},"position":0}]'::jsonb,
          '{"analysis","reflection","trading"}', 'private', 
          ${noteContent.split(' ').length}, ${Math.ceil(noteContent.split(' ').length / 200)},
          NOW(), NOW()
        )
      `);
    }

    // Create general trading notes
    const generalNotes = [
      {
        title: 'Weekly Trading Review',
        content:
          'This week was challenging but educational. Market volatility increased significantly due to central bank announcements. Need to adjust position sizing for high-volatility periods.',
        tags: ['weekly-review', 'market-analysis', 'volatility'],
      },
      {
        title: 'Risk Management Improvements',
        content:
          'Implementing new risk management rules: 1) Maximum 2% risk per trade, 2) No more than 5 open positions, 3) Daily loss limit of 6%. These rules should help preserve capital during drawdown periods.',
        tags: ['risk-management', 'rules', 'capital-preservation'],
      },
      {
        title: 'Market Structure Analysis',
        content:
          'Studying higher timeframe market structure has improved trade selection significantly. Focus on weekly and daily charts for direction, then use 4H and 1H for entries.',
        tags: ['market-structure', 'timeframes', 'analysis'],
      },
      {
        title: 'Psychology Notes',
        content:
          'Noticed tendency to overtrade during winning streaks. Need to maintain discipline and stick to trading plan regardless of recent performance. Emotion is the enemy of consistent profits.',
        tags: ['psychology', 'discipline', 'overtrading'],
      },
      {
        title: 'Strategy Performance Review',
        content:
          'Breakout strategy performing well in trending markets but struggling in ranging conditions. Consider reducing position size or avoiding trades during low volatility periods.',
        tags: ['strategy-review', 'performance', 'market-conditions'],
      },
    ];

    for (const note of generalNotes) {
      await queryRunner.query(`
        INSERT INTO notes (
          id, user_id, title, content, tags, visibility, word_count, reading_time,
          is_pinned, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), '${userId}', '${note.title}',
          '[{"id":"1","type":"text","content":{"text":"${note.content}"},"position":0}]'::jsonb,
          '{${note.tags.join(',')}}', 'private',
          ${note.content.split(' ').length}, ${Math.ceil(note.content.split(' ').length / 200)},
          ${Math.random() > 0.7}, NOW(), NOW()
        )
      `);
    }

    console.log('✅ Test data seeded successfully for demouser@tradetaper.com');
    console.log(`   - Created user with professional subscription`);
    console.log(`   - Created 4 trading accounts`);
    console.log(`   - Created 2 MT5 accounts`);
    console.log(`   - Created 5 trading strategies`);
    console.log(`   - Created 12 tags`);
    console.log(`   - Created 120 trades (100 closed, 20 open)`);
    console.log(`   - Created 35 notes (30 trade-specific, 5 general)`);
    console.log(`   - Associated tags with all trades`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clean up test data for demo user
    const userResult = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'demouser@tradetaper.com'`,
    );

    if (userResult.length > 0) {
      const userId = userResult[0].id;

      // Delete in reverse order of creation due to foreign key constraints
      await queryRunner.query(
        `DELETE FROM trade_tags WHERE "tradeId" IN (SELECT id FROM trades WHERE "userId" = '${userId}')`,
      );
      await queryRunner.query(`DELETE FROM notes WHERE user_id = '${userId}'`);
      await queryRunner.query(
        `DELETE FROM trades WHERE "userId" = '${userId}'`,
      );
      await queryRunner.query(`DELETE FROM tags WHERE "userId" = '${userId}'`);
      await queryRunner.query(
        `DELETE FROM strategies WHERE "userId" = '${userId}'`,
      );
      await queryRunner.query(
        `DELETE FROM mt5_accounts WHERE "userId" = '${userId}'`,
      );
      await queryRunner.query(
        `DELETE FROM accounts WHERE "userId" = '${userId}'`,
      );
      await queryRunner.query(
        `DELETE FROM subscriptions WHERE "userId" = '${userId}'`,
      );
      await queryRunner.query(`DELETE FROM users WHERE id = '${userId}'`);

      console.log('✅ Test data cleaned up for demouser@tradetaper.com');
    }
  }
}
