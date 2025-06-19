#!/usr/bin/env node

/**
 * Test Notes with Real Token
 * Use this script with a real authentication token from the browser
 */

const API_BASE_URL = 'https://tradetaper-backend-481634875325.us-central1.run.app/api/v1';

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('❌ Please provide a token as an argument');
  console.log('Usage: node test-with-token.js YOUR_JWT_TOKEN');
  console.log('');
  console.log('To get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Application/Storage > Local Storage');
  console.log('3. Find the "token" key and copy its value');
  console.log('4. Run: node test-with-token.js "your-token-here"');
  process.exit(1);
}

async function testWithRealToken() {
  console.log('🧪 Testing Notes with Real Authentication Token');
  console.log('='.repeat(50));
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Token: ${token.substring(0, 20)}...`);
  console.log('');

  try {
    // Test 1: Create a note
    console.log('1️⃣ Testing note creation...');
    
    const noteData = {
      title: 'Test Note from Script ' + new Date().toISOString(),
      content: [
        {
          id: 'block-1',
          type: 'text',
          content: { text: 'This is a test note created with a real authentication token.' },
          position: 0
        },
        {
          id: 'block-2',
          type: 'heading',
          content: { text: 'Test Heading' },
          position: 1
        }
      ],
      tags: ['test', 'real-token', 'verification'],
      visibility: 'private'
    };

    console.log('📤 Creating note...');
    const createResponse = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(noteData)
    });

    console.log(`📥 Response status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const noteResult = await createResponse.json();
      console.log('✅ Note created successfully!');
      console.log(`   ID: ${noteResult.id}`);
      console.log(`   Title: ${noteResult.title}`);
      console.log(`   Tags: ${noteResult.tags?.join(', ') || 'none'}`);
      
      const noteId = noteResult.id;
      
      // Test 2: Read the note back
      console.log('\n2️⃣ Testing note retrieval...');
      const readResponse = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (readResponse.ok) {
        const readResult = await readResponse.json();
        console.log('✅ Note retrieved successfully!');
        console.log(`   Content blocks: ${readResult.content?.length || 0}`);
      } else {
        console.log('❌ Failed to retrieve note');
      }
      
      // Test 3: List notes
      console.log('\n3️⃣ Testing notes list...');
      const listResponse = await fetch(`${API_BASE_URL}/notes?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (listResponse.ok) {
        const listResult = await listResponse.json();
        console.log('✅ Notes list retrieved successfully!');
        console.log(`   Total notes: ${listResult.total || 0}`);
        console.log(`   Notes in page: ${listResult.notes?.length || 0}`);
      } else {
        console.log('❌ Failed to list notes');
      }
      
      // Test 4: Delete the test note
      console.log('\n4️⃣ Cleaning up test note...');
      const deleteResponse = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Test note deleted successfully!');
      } else {
        console.log(`⚠️  Failed to delete test note (ID: ${noteId})`);
      }
      
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Note creation failed!');
      console.log(`Error: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Raw error:', errorText);
      }
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testWithRealToken(); 