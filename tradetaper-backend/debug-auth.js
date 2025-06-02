const bcrypt = require('bcrypt');

async function testAuth() {
  console.log('🔍 Testing authentication components...');
  
  // Test bcrypt functionality
  const testPassword = 'password123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  console.log('✅ bcrypt hash created:', hashedPassword.substring(0, 20) + '...');
  
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log('✅ bcrypt compare result:', isValid);
  
  // Test environment variables
  console.log('🔧 Environment variables:');
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_EXPIRATION_TIME:', process.env.JWT_EXPIRATION_TIME);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_DATABASE:', process.env.DB_DATABASE);
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
}

testAuth().catch(console.error); 