const { Client } = require('pg');

async function fixDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Add plan column to subscriptions
    console.log('🔧 Adding plan column to subscriptions table...');
    await client.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';`);
    console.log('✅ Plan column added/exists');

    // Drop and recreate usage_tracking table
    console.log('🗑️ Dropping usage_tracking table...');
    await client.query(`DROP TABLE IF EXISTS usage_tracking CASCADE;`);
    console.log('✅ Usage_tracking table dropped');

    console.log('🔧 Creating usage_tracking table...');
    await client.query(`
      CREATE TABLE usage_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        trades INTEGER DEFAULT 0,
        accounts INTEGER DEFAULT 0,
        "periodStart" TIMESTAMP NOT NULL,
        "periodEnd" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT usage_tracking_user_period_unique UNIQUE ("userId", "periodStart")
      );
    `);
    console.log('✅ Usage_tracking table created');

    console.log('🔧 Creating index...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking ("userId", "periodStart");`);
    console.log('✅ Index created');

    // Update existing subscriptions
    console.log('🔧 Updating existing subscriptions...');
    const result = await client.query(`UPDATE subscriptions SET plan = 'free' WHERE plan IS NULL;`);
    console.log(`✅ Updated ${result.rowCount} subscriptions`);

    console.log('🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabase(); 