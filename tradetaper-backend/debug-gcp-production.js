/* eslint-disable @typescript-eslint/no-var-requires */
// debug-gcp-production.js - Debug script for production GCP issues
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

async function debugGCPProduction() {
  console.log('🔍 Debugging GCP Production Configuration...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Set (file path)' : 'Not set');
  console.log('- GOOGLE_APPLICATION_CREDENTIALS_JSON:', process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'Set (JSON string)' : 'Not set');
  console.log('- GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME);
  console.log('- GCS_PUBLIC_URL_PREFIX:', process.env.GCS_PUBLIC_URL_PREFIX);

  try {
    // Test the same initialization logic as our FilesService
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    let storageConfig = {};
    
    if (credentialsJson) {
      console.log('\n📄 Using JSON credentials...');
      try {
        const credentials = JSON.parse(credentialsJson);
        storageConfig = { credentials };
        console.log('✅ JSON credentials parsed successfully');
        console.log('- Project ID:', credentials.project_id);
        console.log('- Client Email:', credentials.client_email);
      } catch (error) {
        console.log('❌ Failed to parse JSON credentials:', error.message);
        return;
      }
    } else if (keyFilePath) {
      console.log('\n📁 Using file path credentials...');
      storageConfig = { keyFilename: keyFilePath };
      console.log('- File path:', keyFilePath);
    } else {
      console.log('\n⚠️ No credentials configured, using Application Default Credentials');
    }

    // Initialize storage client
    console.log('\n🔧 Initializing Storage client...');
    const storage = new Storage(storageConfig);
    
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      console.log('❌ GCS_BUCKET_NAME not configured');
      return;
    }
    
    const bucket = storage.bucket(bucketName);
    console.log('✅ Storage client and bucket initialized');

    // Test bucket existence
    console.log('\n🪣 Testing bucket existence...');
    const [exists] = await bucket.exists();
    console.log(`Bucket exists: ${exists}`);
    
    if (!exists) {
      console.log('❌ Bucket does not exist or is not accessible');
      return;
    }

    // Test bucket permissions
    console.log('\n🔑 Testing bucket permissions...');
    try {
      const [files] = await bucket.getFiles({ maxResults: 1 });
      console.log(`✅ Can list files. Found ${files.length} file(s)`);
    } catch (error) {
      console.log('❌ Cannot list files:', error.message);
    }

    // Test file upload
    console.log('\n📤 Testing file upload...');
    const testFileName = `debug-test-${Date.now()}.txt`;
    const testContent = 'Debug test file from production environment';
    const file = bucket.file(`test/${testFileName}`);
    
    try {
      await file.save(testContent, {
        metadata: { contentType: 'text/plain' },
        predefinedAcl: 'publicRead',
      });
      
      console.log(`✅ Test file uploaded successfully: gs://${bucketName}/test/${testFileName}`);
      
      // Test public URL
      const publicUrl = `${process.env.GCS_PUBLIC_URL_PREFIX}/test/${testFileName}`;
      console.log(`📍 Public URL: ${publicUrl}`);
      
      // Clean up test file
      await file.delete();
      console.log('🧹 Test file cleaned up');
      
    } catch (error) {
      console.log('❌ File upload failed:', error.message);
      console.log('Error details:', error);
    }

  } catch (error) {
    console.error('\n💥 Debug failed:', error.message);
    console.error('Full error:', error);
  }
}

debugGCPProduction(); 