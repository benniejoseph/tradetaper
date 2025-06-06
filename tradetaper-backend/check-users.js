const { execSync } = require('child_process');

try {
  console.log('Checking users in database...');
  const result = execSync(`npx ts-node -e "
    import { AppDataSource } from './src/config/database.config';
    import { User } from './src/users/entities/user.entity';
    
    async function run() {
      await AppDataSource.initialize();
      const users = await AppDataSource.getRepository(User).find();
      console.log('Users found:', users.length);
      users.forEach(u => console.log(\`- \${u.email}\`));
      await AppDataSource.destroy();
    }
    
    run().catch(console.error);
  "`, { encoding: 'utf8' });
  
  console.log(result);
} catch (error) {
  console.log('Error:', error.message);
} 