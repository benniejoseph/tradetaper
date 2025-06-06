const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function deleteAllMT5Accounts() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_DATABASE || 'tradetaper',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, let's see what MT5 accounts exist
    const selectResult = await client.query('SELECT id, "accountName", server, login, "userId", "createdAt" FROM mt5_accounts ORDER BY "createdAt" DESC');
    console.log('\nCurrent MT5 accounts in database:');
    console.log('==================================');
    
    if (selectResult.rows.length === 0) {
      console.log('No MT5 accounts found in database.');
      return;
    }

    selectResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Account Name: ${row.accountName}`);
      console.log(`   Server: ${row.server}`);
      console.log(`   Login: ${row.login}`);
      console.log(`   User ID: ${row.userId}`);
      console.log(`   Created: ${row.createdAt}`);
      console.log('   ---');
    });

    console.log(`\nTotal MT5 accounts found: ${selectResult.rows.length}`);
    console.log('\n🚨 WARNING: This will delete ALL MT5 accounts from the database!');
    console.log('Note: Associated trades will NOT be deleted (trades will be orphaned as per recent fix).\n');

    // Since this is a script, we'll proceed with deletion
    // First, let's update trades to orphan them (set accountId to null)
    // Using explicit type casting to handle UUID/string comparison
    const orphanResult = await client.query('UPDATE trades SET "accountId" = NULL WHERE "accountId" IN (SELECT id::text FROM mt5_accounts)');
    console.log(`Orphaned ${orphanResult.rowCount} trades (set accountId to NULL)`);

    // Now delete all MT5 accounts
    const deleteResult = await client.query('DELETE FROM mt5_accounts');
    console.log(`✅ Successfully deleted ${deleteResult.rowCount} MT5 accounts`);

    // Verify deletion
    const verifyResult = await client.query('SELECT COUNT(*) FROM mt5_accounts');
    console.log(`Remaining MT5 accounts: ${verifyResult.rows[0].count}`);

    console.log('\n✅ All MT5 accounts have been successfully deleted from the database.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the deletion
deleteAllMT5Accounts().catch(console.error);