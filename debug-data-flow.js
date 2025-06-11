// Debug script to test TradeTaper data flow
const axios = require('axios');

const API_BASE_URL = 'https://tradetaper-backend-production.up.railway.app/api/v1';

async function debugDataFlow() {
    console.log('🔍 TradeTaper Data Flow Debug');
    console.log('============================\n');

    // Test 1: Basic API connectivity
    console.log('1. Testing basic API connectivity...');
    try {
        const response = await axios.get(`${API_BASE_URL}/`);
        console.log('✅ Backend API is responding:', response.status);
    } catch (error) {
        console.log('❌ Backend API connectivity failed:', error.message);
        return;
    }

    // Test 2: Test authentication endpoint
    console.log('\n2. Testing authentication endpoints...');
    try {
        const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        console.log('🤔 Unexpected successful auth response');
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ Auth endpoint working (401 for invalid credentials)');
        } else {
            console.log('❌ Auth endpoint error:', error.response?.status, error.message);
        }
    }

    // Test 3: Test protected trades endpoint
    console.log('\n3. Testing protected trades endpoint (should fail without auth)...');
    try {
        const tradesResponse = await axios.get(`${API_BASE_URL}/trades`);
        console.log('🤔 Unexpected successful trades response without auth');
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ Trades endpoint properly protected (401 unauthorized)');
        } else {
            console.log('❌ Trades endpoint error:', error.response?.status, error.message);
        }
    }

    // Test 4: Check CORS headers
    console.log('\n4. Testing CORS headers...');
    try {
        const corsResponse = await axios.options(`${API_BASE_URL}/trades`, {
            headers: {
                'Origin': 'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type'
            }
        });
        console.log('✅ CORS preflight successful:', corsResponse.status);
        console.log('   CORS headers:', corsResponse.headers['access-control-allow-origin']);
    } catch (error) {
        console.log('❌ CORS preflight failed:', error.response?.status, error.message);
    }

    console.log('\n5. Frontend Environment Check:');
    console.log('   Expected API URL: https://tradetaper-backend-production.up.railway.app/api/v1');
    console.log('   Frontend should be: https://tradetaper-frontend-benniejosephs-projects.vercel.app');

    console.log('\n6. Common Issues to Check:');
    console.log('   - Frontend NEXT_PUBLIC_API_URL environment variable');
    console.log('   - Authentication token storage in localStorage');
    console.log('   - API interceptor setup in frontend');
    console.log('   - Redux store initialization');
    console.log('   - Network/proxy issues');

    console.log('\n🔧 Debug complete. Check frontend browser console for more details.');
}

debugDataFlow().catch(console.error);