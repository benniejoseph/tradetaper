import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComprehensiveTestData1756000000002
  implements MigrationInterface
{
  name = 'AddComprehensiveTestData1756000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get the existing demo user
    const userResult = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'demouser@tradetaper.com'`,
    );

    if (userResult.length === 0) {
      console.log(
        '❌ Demo user not found, skipping comprehensive data addition',
      );
      return;
    }

    const userId = userResult[0].id;
    console.log(`✅ Found demo user with ID: ${userId}`);

    // Check if comprehensive data already exists
    const existingTrades = await queryRunner.query(
      `SELECT COUNT(*) as count FROM trades WHERE "userId" = '${userId}'`,
    );

    if (parseInt(existingTrades[0].count) > 10) {
      console.log('✅ Comprehensive test data already exists, skipping...');
      return;
    }

    console.log('🔄 Adding comprehensive test data to existing demo user...');

    // Create subscription for demo user if not exists
    const existingSubscription = await queryRunner.query(
      `SELECT id FROM subscriptions WHERE "userId" = '${userId}'`,
    );

    if (existingSubscription.length === 0) {
      await queryRunner.query(`
        INSERT INTO subscriptions (id, "userId", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", status, tier, plan, price, interval, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "canceledAt", "trialStart", "trialEnd", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '${userId}', null, null, null, 'active', 'professional', 'professional', 29.99, 'month', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', false, null, null, null, NOW(), NOW())
      `);
      console.log('✅ Created professional subscription');
    }

    // Add additional accounts (keep existing ones)
    const existingAccounts = await queryRunner.query(
      `SELECT COUNT(*) as count FROM accounts WHERE "userId" = '${userId}'`,
    );

    const accountsToAdd = [
      {
        name: 'Swing Trading Pro',
        balance: 25000,
        currency: 'USD',
        description: 'Advanced swing trading account with higher capital',
      },
      {
        name: 'Day Trading Scalper',
        balance: 15000,
        currency: 'USD',
        description: 'High-frequency day trading for scalping strategies',
      },
      {
        name: 'Crypto DeFi Portfolio',
        balance: 10000,
        currency: 'USD',
        description: 'Cryptocurrency and DeFi trading opportunities',
      },
    ];

    const accountIds: string[] = [];
    if (parseInt(existingAccounts[0].count) < 4) {
      for (const account of accountsToAdd) {
        const result = await queryRunner.query(`
          INSERT INTO accounts (id, "userId", name, balance, currency, description, "isActive", target, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), '${userId}', '${account.name}', ${account.balance}, '${account.currency}', '${account.description}', true, ${account.balance * 1.2}, NOW(), NOW())
          RETURNING id
        `);
        accountIds.push(result[0].id);
      }
      console.log(`✅ Added ${accountsToAdd.length} additional accounts`);
    }

    // Get all account IDs for trades
    const allAccounts = await queryRunner.query(
      `SELECT id FROM accounts WHERE "userId" = '${userId}'`,
    );
    const allAccountIds = allAccounts.map((acc) => acc.id);

    // Create MT5 accounts
    const existingMT5 = await queryRunner.query(
      `SELECT COUNT(*) as count FROM mt5_accounts WHERE "userId" = '${userId}'`,
    );

    if (parseInt(existingMT5[0].count) === 0) {
      const mt5Accounts = [
        {
          name: 'MetaTrader 5 Demo Pro',
          server: 'MetaQuotes-Demo',
          login: 'demo12345',
          balance: 10000,
        },
        {
          name: 'FTMO Challenge Account',
          server: 'FTMO-Server01',
          login: 'ftmo67890',
          balance: 100000,
        },
      ];

      for (const mt5Account of mt5Accounts) {
        await queryRunner.query(`
          INSERT INTO mt5_accounts (id, "userId", "accountName", server, login, password, "isActive", balance, "accountType", currency, "isRealAccount", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), '${userId}', '${mt5Account.name}', '${mt5Account.server}', '${mt5Account.login}', 'encrypted_password_demo', true, ${mt5Account.balance}, 'Demo', 'USD', false, NOW(), NOW())
        `);
      }
      console.log('✅ Created 2 MT5 demo accounts');
    }

    // Add comprehensive strategies (keep existing ones)
    const existingStrategies = await queryRunner.query(
      `SELECT COUNT(*) as count FROM strategies WHERE "userId" = '${userId}'`,
    );

    const strategiesToAdd = [
      {
        name: 'ICT Breaker Block Strategy',
        description:
          'Advanced ICT methodology focusing on breaker blocks and market structure',
        session: 'London',
        color: '#8b5cf6',
      },
      {
        name: 'Supply Demand Zones',
        description:
          'Trading institutional supply and demand zones with smart money concepts',
        session: 'New York',
        color: '#3b82f6',
      },
      {
        name: 'Fair Value Gap Trading',
        description:
          'Exploiting fair value gaps in price action for high probability entries',
        session: 'Asia',
        color: '#f59e0b',
      },
      {
        name: 'News Impact Analysis',
        description:
          'Trading around major economic news releases and market volatility',
        session: 'London-NY Overlap',
        color: '#ef4444',
      },
    ];

    const strategyIds: string[] = [];
    if (parseInt(existingStrategies[0].count) < 5) {
      for (const strategy of strategiesToAdd) {
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
            'advanced,tested,profitable', 
            '[{"id":"1","text":"Analyze market structure","completed":true,"order":0},{"id":"2","text":"Identify key institutional levels","completed":true,"order":1},{"id":"3","text":"Wait for confirmation signal","completed":false,"order":2},{"id":"4","text":"Set proper risk management","completed":true,"order":3}]'::json,
            NOW(), 
            NOW()
          )
          RETURNING id
        `);
        strategyIds.push(result[0].id);
      }
      console.log(`✅ Added ${strategiesToAdd.length} advanced strategies`);
    }

    // Get all strategy IDs
    const allStrategies = await queryRunner.query(
      `SELECT id FROM strategies WHERE "userId" = '${userId}'`,
    );
    const allStrategyIds = allStrategies.map((strat) => strat.id);

    // Create comprehensive tags
    const existingTags = await queryRunner.query(
      `SELECT COUNT(*) as count FROM tags WHERE "userId" = '${userId}'`,
    );

    const tagsToAdd = [
      { name: 'Profitable', color: '#10b981' },
      { name: 'Loss', color: '#ef4444' },
      { name: 'Breakeven', color: '#6b7280' },
      { name: 'Perfect Entry', color: '#8b5cf6' },
      { name: 'Early Exit', color: '#f59e0b' },
      { name: 'FOMO Trade', color: '#ef4444' },
      { name: 'Patient Entry', color: '#10b981' },
      { name: 'Good Discipline', color: '#3b82f6' },
      { name: 'Revenge Trading', color: '#dc2626' },
      { name: 'Risk Management', color: '#059669' },
      { name: 'Overtrading', color: '#dc2626' },
      { name: 'Market Analysis', color: '#7c3aed' },
    ];

    const tagIds: string[] = [];
    if (parseInt(existingTags[0].count) < 5) {
      for (const tag of tagsToAdd) {
        const result = await queryRunner.query(`
          INSERT INTO tags (id, name, "userId", color, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), '${tag.name}', '${userId}', '${tag.color}', NOW(), NOW())
          RETURNING id
        `);
        tagIds.push(result[0].id);
      }
      console.log(`✅ Created ${tagsToAdd.length} trading tags`);
    } else {
      // Get existing tag IDs
      const existingTagIds = await queryRunner.query(
        `SELECT id FROM tags WHERE "userId" = '${userId}'`,
      );
      tagIds.push(...existingTagIds.map((tag) => tag.id));
    }

    // Generate 100 comprehensive trades
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

    console.log('🔄 Generating 100 comprehensive trades...');

    // Generate 100 trades
    for (let i = 0; i < 100; i++) {
      const assetType =
        assetTypes[Math.floor(Math.random() * assetTypes.length)];
      const symbol =
        symbols[assetType][
          Math.floor(Math.random() * symbols[assetType].length)
        ];
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
      const status =
        i < 85
          ? 'Closed'
          : statuses[Math.floor(Math.random() * statuses.length)]; // 85% closed
      const session = sessions[Math.floor(Math.random() * sessions.length)];
      const ictConcept =
        ictConcepts[Math.floor(Math.random() * ictConcepts.length)];
      const strategyId =
        allStrategyIds[Math.floor(Math.random() * allStrategyIds.length)];
      const accountId =
        allAccountIds[Math.floor(Math.random() * allAccountIds.length)];

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

      // Generate realistic prices and calculate P&L
      let openPrice, closePrice, quantity, commission, pnl;

      switch (assetType) {
        case 'Stock':
          openPrice = 50 + Math.random() * 400;
          quantity = Math.floor(Math.random() * 500) + 10;
          commission = quantity * 0.005;
          break;
        case 'Forex':
          openPrice = 0.5 + Math.random() * 1.5;
          quantity = Math.floor(Math.random() * 100000) + 10000;
          commission = quantity * 0.00002;
          break;
        case 'Crypto':
          openPrice = 100 + Math.random() * 50000;
          quantity = Math.random() * 10;
          commission = openPrice * quantity * 0.001;
          break;
        case 'Futures':
          openPrice = 3000 + Math.random() * 2000;
          quantity = Math.floor(Math.random() * 10) + 1;
          commission = quantity * 2.5;
          break;
        case 'Options':
          openPrice = 0.5 + Math.random() * 20;
          quantity = Math.floor(Math.random() * 100) + 1;
          commission = quantity * 1.0;
          break;
      }

      if (status === 'Closed') {
        const priceChange = (Math.random() - 0.4) * 0.15; // Slight positive bias
        closePrice = openPrice * (1 + priceChange);

        if (direction === 'Long') {
          pnl = (closePrice - openPrice) * quantity - commission;
        } else {
          pnl = (openPrice - closePrice) * quantity - commission;
        }

        const stopLoss =
          direction === 'Long' ? openPrice * 0.98 : openPrice * 1.02;
        const riskAmount = Math.abs(openPrice - stopLoss) * quantity;
        const rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;

        await queryRunner.query(`
          INSERT INTO trades (
            id, "userId", "strategyId", "accountId", "isStarred", "assetType", symbol, side, status,
            "openTime", "openPrice", "closeTime", "closePrice", quantity, commission,
            notes, "profitOrLoss", "rMultiple", "stopLoss", "takeProfit", "ictConcept", session,
            "setupDetails", "mistakesMade", "lessonsLearned", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), '${userId}', '${strategyId}', '${accountId}', ${Math.random() > 0.9},
            '${assetType}', '${symbol}', '${direction}', '${status}',
            '${openTime.toISOString()}', ${openPrice}, '${closeTime.toISOString()}', ${closePrice}, ${quantity}, ${commission},
            'Comprehensive trade #${i + 1} - ${direction} ${symbol} using ${ictConcept} during ${session}',
            ${pnl.toFixed(2)}, ${rMultiple.toFixed(4)}, ${stopLoss.toFixed(8)}, ${(openPrice * (direction === 'Long' ? 1.06 : 0.94)).toFixed(8)},
            '${ictConcept}', '${session}',
            'Professional ${ictConcept} setup with comprehensive risk management and institutional analysis',
            '${pnl < 0 ? 'Could improve entry timing and confirmation signals' : 'Excellent execution and patience with setup'}',
            '${pnl > 0 ? 'Strategy working perfectly, continue with same methodology' : 'Need to refine entry criteria and market structure analysis'}',
            NOW(), NOW()
          )
        `);
      } else {
        // Open trade
        const stopLoss =
          direction === 'Long' ? openPrice * 0.98 : openPrice * 1.02;
        const takeProfit =
          direction === 'Long' ? openPrice * 1.06 : openPrice * 0.94;

        await queryRunner.query(`
          INSERT INTO trades (
            id, "userId", "strategyId", "accountId", "isStarred", "assetType", symbol, side, status,
            "openTime", "openPrice", quantity, commission, notes, "stopLoss", "takeProfit", 
            "ictConcept", session, "setupDetails", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), '${userId}', '${strategyId}', '${accountId}', ${Math.random() > 0.8},
            '${assetType}', '${symbol}', '${direction}', '${status}',
            '${openTime.toISOString()}', ${openPrice}, ${quantity}, ${commission},
            'Active ${direction} position on ${symbol} - monitoring ${ictConcept} development',
            ${stopLoss.toFixed(8)}, ${takeProfit.toFixed(8)}, '${ictConcept}', '${session}',
            'Current position based on professional ${ictConcept} analysis with tight risk controls',
            NOW(), NOW()
          )
        `);
      }
    }

    // Associate tags with trades
    const allTrades = await queryRunner.query(
      `SELECT id FROM trades WHERE "userId" = '${userId}' ORDER BY "createdAt" DESC LIMIT 100`,
    );

    for (const trade of allTrades) {
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

    // Create comprehensive trading notes
    const tradeNotesTemplates = [
      'Outstanding trade execution with perfect market structure analysis. Entry was timed perfectly at the institutional level.',
      'This trade showcases the power of patience and proper ICT methodology. Waited for perfect confirmation before entry.',
      'Excellent risk management prevented a larger loss. Stop loss placement was crucial in preserving capital.',
      'Professional-grade analysis led to this profitable outcome. Higher timeframe bias was perfectly aligned.',
      'Market volatility caught me off-guard but proper position sizing limited the damage. Learning experience.',
      'Textbook example of how institutional order flow works. Smart money concepts proved their effectiveness.',
      'Perfect storm of confluences: structure, order blocks, and fair value gaps all aligned beautifully.',
      'News volatility created unexpected price action. Need to be more aware of high-impact economic events.',
      'Exceptional trade management - held through minor drawdown and was rewarded with substantial profits.',
      'Stop loss was tested but held. This demonstrates the importance of proper level identification.',
    ];

    const selectedTradesToNote = allTrades.slice(0, 25); // Create notes for 25 recent trades
    for (const trade of selectedTradesToNote) {
      const noteContent =
        tradeNotesTemplates[
          Math.floor(Math.random() * tradeNotesTemplates.length)
        ];
      await queryRunner.query(`
        INSERT INTO notes (
          id, user_id, trade_id, title, content, tags, visibility, word_count, reading_time,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), '${userId}', '${trade.id}', 
          'Professional Trade Analysis', 
          '[{"id":"1","type":"text","content":{"text":"${noteContent}"},"position":0}]'::jsonb,
          '{analysis,professional,trading,review}', 'private', 
          ${noteContent.split(' ').length}, ${Math.ceil(noteContent.split(' ').length / 200)},
          NOW(), NOW()
        )
      `);
    }

    // Create comprehensive general trading notes
    const generalNotes = [
      {
        title: 'Advanced Risk Management Protocol',
        content:
          'Implementing institutional-grade risk management: 1) Maximum 1.5% risk per trade, 2) No more than 3 concurrent positions, 3) Daily loss limit 4%, 4) Weekly review mandatory. These rules ensure long-term capital preservation and consistent growth.',
        tags: [
          'risk-management',
          'professional',
          'capital-preservation',
          'institutional',
        ],
        isPinned: true,
      },
      {
        title: 'ICT Market Structure Mastery',
        content:
          'Deep dive into Inner Circle Trader concepts: Market structure shifts, order blocks, fair value gaps, and institutional order flow. Focus on higher timeframe bias (weekly/daily) for direction, 4H for structure, 1H for entries. This systematic approach has significantly improved win rate.',
        tags: ['ICT', 'market-structure', 'strategy', 'education'],
        isPinned: true,
      },
      {
        title: 'Monthly Performance Review - Exceptional Results',
        content:
          'This month achieved 23% account growth with 68% win rate. Key performance drivers: patience with setups, strict adherence to risk rules, and excellent trade management. Areas for improvement: reduce position size during high volatility news events.',
        tags: ['performance', 'review', 'monthly', 'growth'],
        isPinned: false,
      },
      {
        title: 'Psychology & Mindset Excellence',
        content:
          'Maintaining peak mental performance through: daily meditation, journaling after each trade, weekly goal setting, and monthly psychology review. Emotion is the biggest enemy of consistent profits. Discipline and patience are the cornerstones of professional trading.',
        tags: ['psychology', 'mindset', 'discipline', 'professional'],
        isPinned: true,
      },
      {
        title: 'Smart Money Concepts Deep Dive',
        content:
          'Advanced understanding of institutional behavior: liquidity grabs, stop hunts, accumulation phases, and distribution zones. Retail traders focus on patterns, professionals focus on where big money is flowing. This perspective shift has revolutionized my trading approach.',
        tags: ['smart-money', 'institutional', 'concepts', 'advanced'],
        isPinned: false,
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
          ${note.isPinned}, NOW(), NOW()
        )
      `);
    }

    console.log('✅ Comprehensive test data added successfully!');
    console.log(
      `   - Enhanced existing demo user with professional subscription`,
    );
    console.log(`   - Added 3 additional trading accounts (total: 4)`);
    console.log(`   - Created 2 MT5 demo accounts`);
    console.log(`   - Added 4 advanced trading strategies (total: 5)`);
    console.log(`   - Created 12 comprehensive trading tags`);
    console.log(`   - Generated 100 realistic trades (85 closed, 15 open)`);
    console.log(
      `   - Created 30 detailed notes (25 trade-specific, 5 professional)`,
    );
    console.log(
      `   - Associated tags with all trades for proper categorization`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get demo user ID
    const userResult = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'demouser@tradetaper.com'`,
    );

    if (userResult.length === 0) {
      console.log('❌ Demo user not found, nothing to clean up');
      return;
    }

    const userId = userResult[0].id;

    console.log('🔄 Cleaning up comprehensive test data...');

    // Delete in reverse order due to foreign key constraints
    await queryRunner.query(
      `DELETE FROM trade_tags WHERE "tradeId" IN (SELECT id FROM trades WHERE "userId" = '${userId}')`,
    );
    await queryRunner.query(`DELETE FROM notes WHERE user_id = '${userId}'`);
    await queryRunner.query(`DELETE FROM trades WHERE "userId" = '${userId}'`);
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

    console.log('✅ Comprehensive test data cleaned up successfully');
  }
}
