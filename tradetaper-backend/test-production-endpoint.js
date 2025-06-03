/* eslint-disable @typescript-eslint/no-var-requires */
// test-production-endpoint.js - Test the actual file upload endpoint
const https = require('https');
const fs = require('fs');

const BACKEND_URL = 'https://tradetaper-backend-production.up.railway.app';

// Create a small test image buffer (1x1 pixel PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x5C, 0xCC, 0x2E, 0x34, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

async function testFileUploadEndpoint() {
  console.log('🧪 Testing Production File Upload Endpoint...\n');

  // First, let's test a simple authenticated request to get user profile
  // This will help us verify the auth system is working
  console.log('Step 1: Testing authentication...');
  
  try {
    // Test with a basic request that doesn't require auth first
    console.log('Testing backend health check...');
    const healthResponse = await makeRequest('GET', '/api/v1/health');
    console.log('✅ Backend is responding:', healthResponse);
    
    // For file upload test, we would need a valid JWT token
    // Since we don't have user credentials here, let's just verify the endpoint exists
    console.log('\nStep 2: Testing file upload endpoint (without auth)...');
    console.log('Note: This will fail with 401 Unauthorized, which is expected');
    
    try {
      const uploadResponse = await makeMultipartRequest('/api/v1/files/upload/trade-image', testImageBuffer);
      console.log('Upload response:', uploadResponse);
    } catch (error) {
      if (error.statusCode === 401) {
        console.log('✅ Endpoint exists and correctly requires authentication');
        console.log('Error message:', error.message);
      } else {
        console.log('❌ Unexpected error:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'tradetaper-backend-production.up.railway.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch {
            resolve(responseData);
          }
        } else {
          reject({
            statusCode: res.statusCode,
            message: responseData,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function makeMultipartRequest(path, imageBuffer) {
  return new Promise((resolve, reject) => {
    const boundary = `----formdata-boundary-${Date.now()}`;
    const formData = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;
    const formDataEnd = `\r\n--${boundary}--\r\n`;
    
    const formDataBuffer = Buffer.concat([
      Buffer.from(formData, 'utf8'),
      imageBuffer,
      Buffer.from(formDataEnd, 'utf8')
    ]);

    const options = {
      hostname: 'tradetaper-backend-production.up.railway.app',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch {
            resolve(responseData);
          }
        } else {
          reject({
            statusCode: res.statusCode,
            message: responseData,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(formDataBuffer);
    req.end();
  });
}

testFileUploadEndpoint(); 