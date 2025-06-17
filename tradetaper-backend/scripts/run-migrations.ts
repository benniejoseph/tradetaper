/// <reference types="node" />
import { execSync } from 'child_process';

/**
 * Unified migration runner for both development and production.
 *
 * Usage:
 *  npx ts-node --esm scripts/run-migrations.ts [--prod]
 */

function runMigrations(isProd = false) {
  const env = { ...process.env };
  if (isProd) {
    env.NODE_ENV = 'production';
  }

  const cmd = isProd ? 'npm run migration:run:prod' : 'npm run migration:run';
  console.log(`🔄 Running database migrations (${isProd ? 'production' : 'development'})...`);

  try {
    execSync(cmd, { stdio: 'inherit', env });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', (error as Error).message);
    process.exit(1);
  }
}

const isProdFlag = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
runMigrations(isProdFlag); 