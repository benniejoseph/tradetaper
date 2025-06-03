const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check subscriptions table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Subscriptions table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Check usage_tracking table structure
    const usageResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'usage_tracking' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Usage_tracking table columns:');
    if (usageResult.rows.length === 0) {
      console.log('❌ usage_tracking table does not exist');
    } else {
      usageResult.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });
    }

    // Check for any existing subscriptions
    const subCount = await client.query('SELECT COUNT(*) as count FROM subscriptions;');
    console.log(`\n👥 Existing subscriptions: ${subCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema(); 