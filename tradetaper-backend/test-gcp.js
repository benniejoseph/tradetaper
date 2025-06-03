/* eslint-disable @typescript-eslint/no-var-requires */
// test-gcp.js - Test script to verify GCP bucket storage
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

async function testGCPConnection() {
  console.log('Testing GCP Connection...');
  console.log('Project:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Service account configured' : 'No service account');
  console.log('Bucket:', process.env.GCS_BUCKET_NAME);
  
  try {
    // Initialize storage client
    const storage = new Storage({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME not configured');
    }
    
    const bucket = storage.bucket(bucketName);
    
    // Test bucket existence
    console.log('\n1. Testing bucket existence...');
    const [exists] = await bucket.exists();
    console.log(`Bucket exists: ${exists}`);
    
    if (!exists) {
      throw new Error(`Bucket ${bucketName} does not exist`);
    }
    
    // Test bucket permissions by listing files
    console.log('\n2. Testing bucket permissions...');
    const [files] = await bucket.getFiles({ maxResults: 5 });
    console.log(`Found ${files.length} files in bucket`);
    
    // Test upload capability by creating a small test file
    console.log('\n3. Testing upload capability...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for GCP bucket upload verification';
    const file = bucket.file(`test/${testFileName}`);
    
    await file.save(testContent, {
      metadata: { contentType: 'text/plain' },
    });
    
    console.log(`✅ Test file uploaded successfully: gs://${bucketName}/test/${testFileName}`);
    
    // Clean up test file
    await file.delete();
    console.log('✅ Test file cleaned up');
    
    console.log('\n🎉 GCP Storage is working correctly!');
    
  } catch (error) {
    console.error('\n❌ GCP Storage test failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

testGCPConnection(); 