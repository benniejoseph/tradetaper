const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runStrategiesMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'create-strategies-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running strategies migration...');
    await client.query(migrationSQL);
    console.log('✅ Strategies migration completed successfully');

    // Verify the table was created
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'strategies' 
      ORDER BY ordinal_position;
    `);

    console.log('✅ Strategies table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check if strategyId was added to trades table
    const tradesResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trades' AND column_name = 'strategyid';
    `);

    if (tradesResult.rows.length > 0) {
      console.log('✅ strategyId column added to trades table');
    } else {
      console.log('❌ strategyId column not found in trades table');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Load environment variables
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

runStrategiesMigration();