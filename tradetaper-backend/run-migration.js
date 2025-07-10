const { Client } = require('pg');

async function runAccountsMigration() {
  const client = new Client({
    host: '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
    user: 'tradetaper',
    password: 'TradeTaper2024',
    database: 'tradetaper',
    ssl: false,
  });

  try {
    await client.connect();
    console.log('Connected to Cloud SQL database');

    // Check if accounts table already exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts'
      );
    `);

    if (checkTable.rows[0].exists) {
      console.log('Accounts table already exists');
      return;
    }

    console.log('Creating accounts table...');

    // Create accounts table
    await client.query(`
      CREATE TABLE accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        name varchar(255) NOT NULL,
        balance decimal(19,2) DEFAULT 0 NOT NULL,
        currency varchar(3) DEFAULT 'USD' NOT NULL,
        description text,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create indices
    await client.query(`
      CREATE INDEX "IDX_accounts_userId" ON accounts ("userId");
    `);

    await client.query(`
      CREATE INDEX "IDX_accounts_isActive" ON accounts ("isActive");
    `);

    console.log('Accounts table created successfully');

  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await client.end();
  }
}

runAccountsMigration(); 