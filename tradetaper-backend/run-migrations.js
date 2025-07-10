const { execSync } = require('child_process');

console.log('🔄 Running database migrations...');

try {
  // Set environment variables for production
  process.env.NODE_ENV = 'production';
  
  // Run migrations using the built JavaScript files
  execSync('npm run migration:run:prod', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} 