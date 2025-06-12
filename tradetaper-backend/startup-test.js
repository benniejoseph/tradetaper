// Simple startup test script
const http = require('http');

const port = process.env.PORT || 3000;

function testEndpoint(path, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('🧪 Running startup tests...');
  
  const tests = [
    { name: 'Ping', path: '/api/v1/ping' },
    { name: 'Health', path: '/api/v1/health' },
    { name: 'Root', path: '/api/v1' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name} endpoint...`);
      const result = await testEndpoint(test.path);
      console.log(`✅ ${test.name}: ${result.status}`, result.data);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

// Wait a bit for server to start, then run tests
setTimeout(runTests, 3000); 