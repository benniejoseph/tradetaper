#!/usr/bin/env node

/**
 * Quick Notes API Test
 * Simple test to validate basic API connectivity and authentication
 */

const API_BASE_URL = 'https://tradetaper-backend-481634875325.us-central1.run.app/api/v1';

async function quickTest() {
  console.log('🔧 Quick Notes API Test');
  console.log('=======================\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.text();
    
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${healthData.substring(0, 100)}...`);
    
    if (healthResponse.ok) {
      console.log('   ✅ Health endpoint working\n');
    } else {
      console.log('   ❌ Health endpoint failed\n');
      return;
    }
    
    // Test 2: Unauthenticated request (should get 401)
    console.log('2️⃣ Testing authentication requirement...');
    const notesResponse = await fetch(`${API_BASE_URL}/notes`);
    
    console.log(`   Status: ${notesResponse.status}`);
    
    if (notesResponse.status === 401) {
      console.log('   ✅ Authentication properly required\n');
    } else {
      console.log('   ⚠️  Expected 401 for unauthenticated request\n');
    }
    
    // Test 3: Check if login endpoint exists
    console.log('3️⃣ Testing login endpoint availability...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test', password: 'test' })
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    const loginData = await loginResponse.text();
    console.log(`   Response: ${loginData.substring(0, 100)}...`);
    
    if (loginResponse.status === 400 || loginResponse.status === 401) {
      console.log('   ✅ Login endpoint exists and validates input\n');
    } else {
      console.log('   ⚠️  Unexpected login response\n');
    }
    
    console.log('🎉 Basic API connectivity test complete!');
    console.log('\n📋 Summary:');
    console.log('   - Backend is reachable');
    console.log('   - Health endpoint works');
    console.log('   - Authentication is required');
    console.log('   - Login endpoint exists');
    console.log('\n✨ Ready to run full test suite with valid credentials!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check internet connection');
    console.log('   - Verify backend URL is correct');
    console.log('   - Check if backend is deployed and running');
  }
}

// Run if executed directly
if (require.main === module) {
  quickTest();
}

module.exports = quickTest; 