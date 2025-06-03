const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration SQL
    const migrationSQL = fs.readFileSync('./migration.sql', 'utf8');
    
    console.log('Running migration...');
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration(); 