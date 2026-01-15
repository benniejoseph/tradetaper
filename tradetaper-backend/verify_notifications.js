const axios = require('axios');

const BASE_URL = 'https://tradetaper-backend-326520250422.us-central1.run.app/api/v1';

async function testNotifications() {
  try {
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    const password = 'TestPassword123!';
    const firstName = 'Test';
    const lastName = 'User';

    console.log(`1. Registering new user: ${email}...`);
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email,
      password,
      firstName,
      lastName
    });
    console.log('   Registration successful. User ID:', registerResponse.data.id);

    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    const token = loginResponse.data.accessToken;
    console.log('   Login successful. Token obtained.');

    console.log('3. Triggering Test Notification...');
    const testResponse = await axios.get(`${BASE_URL}/notifications/test`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('   Test notification triggered successfully!');
    console.log('   Response:', JSON.stringify(testResponse.data, null, 2));

    console.log('\n✅ Notification System Verification Complete.');
    console.log('   Please check the logs in Cloud Run console to confirm email delivery attempt.');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testNotifications();
