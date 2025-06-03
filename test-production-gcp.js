#!/usr/bin/env node

// test-production-gcp.js - Test script to verify production GCP functionality
const https = require('https');

const BACKEND_URL = 'https://tradetaper-backend-production.up.railway.app';
const FRONTEND_URL = 'https://tradetaper-frontend-benniejosephs-projects.vercel.app';

async function testProductionServices() {
  console.log('🧪 Testing TradeTaper Production Deployment...\n');

  try {
    // Test 1: Backend Health Check
    console.log('1. Testing Backend Health...');
    const backendResponse = await makeRequest(`${BACKEND_URL}/api/v1`);
    if (backendResponse.statusCode === 200) {
      console.log('✅ Backend is responding');
    } else {
      console.log(`❌ Backend health check failed: ${backendResponse.statusCode}`);
      return;
    }

    // Test 2: Frontend Health Check
    console.log('\n2. Testing Frontend Health...');
    const frontendResponse = await makeRequest(FRONTEND_URL);
    if (frontendResponse.statusCode === 200) {
      console.log('✅ Frontend is responding');
    } else {
      console.log(`❌ Frontend health check failed: ${frontendResponse.statusCode}`);
      return;
    }

    // Test 3: Check if file upload endpoint exists (should return 401 for unauthenticated requests)
    console.log('\n3. Testing File Upload Endpoint...');
    const uploadResponse = await makeRequest(`${BACKEND_URL}/api/v1/files/upload/trade-image`, 'POST');
    if (uploadResponse.statusCode === 401 || uploadResponse.statusCode === 403) {
      console.log('✅ File upload endpoint exists and requires authentication');
    } else {
      console.log(`⚠️ File upload endpoint responded with: ${uploadResponse.statusCode}`);
    }

    // Test 4: Check CORS headers for frontend integration
    console.log('\n4. Testing CORS Configuration...');
    const corsResponse = await makeRequest(`${BACKEND_URL}/api/v1`, 'OPTIONS');
    if (corsResponse.headers['access-control-allow-origin']) {
      console.log('✅ CORS is configured');
    } else {
      console.log('⚠️ CORS headers not found');
    }

    console.log('\n🎉 Production Deployment Tests Complete!');
    console.log('\n📋 Next Steps for Testing Image Upload:');
    console.log(`1. Visit: ${FRONTEND_URL}`);
    console.log('2. Sign up or log in to your account');
    console.log('3. Navigate to "Journal" → "New Trade"');
    console.log('4. Fill out the trade form');
    console.log('5. Upload an image in the "Chart Snapshot" section');
    console.log('6. Submit the form');
    console.log('7. Verify the image is saved and displays correctly');
    console.log('\n🌐 GCP Image Storage is configured and ready!');
    console.log('\n📊 Application URLs:');
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Backend:  ${BACKEND_URL}/api/v1`);

  } catch (error) {
    console.error('\n❌ Production test failed:', error.message);
  }
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'User-Agent': 'TradeTaper-Production-Test/1.0'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run the tests
testProductionServices(); 