#!/usr/bin/env node

/**
 * Notes API Test Suite
 * Tests all notes functionality against the deployed backend
 */

const API_BASE_URL = 'https://tradetaper-backend-481634875325.us-central1.run.app/api/v1';

// Test user credentials - replace with valid account for testing
const TEST_USER = {
  email: 'bennie@nerdycandy.com', // Replace with your email
  password: 'BennieJoseph90!' // Replace with your password
};

class NotesTestSuite {
  constructor() {
    this.token = null;
    this.testNoteId = null;
    this.testResults = [];
  }

  // Helper method to make authenticated requests
  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      console.log(`🌐 Making request to: ${url}`);
      const response = await fetch(url, config);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log(`📄 Non-JSON response: ${text.substring(0, 200)}...`);
        data = { message: text };
      }
      
      console.log(`📊 Response status: ${response.status}, OK: ${response.ok}`);
      
      return {
        status: response.status,
        ok: response.ok,
        data,
        headers: response.headers
      };
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
      return {
        status: 0,
        ok: false,
        error: error.message,
        data: null
      };
    }
  }

  // Test helper
  assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      this.testResults.push({ test: message, status: 'PASS' });
    } else {
      console.log(`❌ ${message}`);
      this.testResults.push({ test: message, status: 'FAIL' });
    }
  }

  // Authentication test
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    // Test login
    const loginResponse = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    console.log(`🔑 Login response:`, JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.ok && loginResponse.data && loginResponse.data.token) {
      this.token = loginResponse.data.token;
      this.assert(true, 'User login successful');
      this.assert(typeof this.token === 'string', 'JWT token received');
      console.log(`🎟️  Token preview: ${this.token.substring(0, 20)}...`);
    } else {
      this.assert(false, `Login failed: ${loginResponse.data?.message || loginResponse.error || 'Unknown error'}`);
      console.log('⚠️  Login failed, attempting to register...');
      
      // Try to register if login fails
      const registerResponse = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...TEST_USER,
          name: 'Test User'
        })
      });

      console.log(`📝 Register response:`, JSON.stringify(registerResponse.data, null, 2));

      if (registerResponse.ok && registerResponse.data && registerResponse.data.token) {
        this.token = registerResponse.data.token;
        this.assert(true, 'User registration successful');
      } else {
        this.assert(false, `Authentication failed completely - login and register both failed`);
        console.log(`🚨 Cannot continue tests without authentication`);
        console.log(`Please verify:`);
        console.log(`- Backend is running at: ${API_BASE_URL}`);
        console.log(`- Test credentials are correct: ${TEST_USER.email}`);
        console.log(`- Auth endpoints are working`);
        return false;
      }
    }

    return true;
  }

  // Test health endpoint
  async testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint...');
    
    const response = await this.makeRequest('/health');
    this.assert(response.ok, 'Health endpoint responds');
    
    if (response.ok && response.data) {
      this.assert(response.data.status === 'ok', 'Health status is OK');
      this.assert(typeof response.data.uptime === 'number', 'Uptime is reported');
    }
  }

  // Test notes CRUD operations
  async testNotesCRUD() {
    console.log('\n📝 Testing Notes CRUD Operations...');

    // Test creating a note
    const noteData = {
      title: 'Test Note ' + Date.now(),
      content: [
        {
          id: 'block-1',
          type: 'text',
          content: { text: 'This is a test note created by automated tests.' },
          position: 0
        },
        {
          id: 'block-2',
          type: 'heading',
          content: { text: 'Test Heading' },
          position: 1
        }
      ],
      tags: ['test', 'automation'],
      visibility: 'private'
    };

    console.log(`📤 Creating note with data:`, JSON.stringify(noteData, null, 2));

    const createResponse = await this.makeRequest('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });

    console.log(`📥 Create response:`, JSON.stringify(createResponse.data, null, 2));

    this.assert(createResponse.ok, `Note creation successful (status: ${createResponse.status})`);
    if (createResponse.ok && createResponse.data) {
      this.testNoteId = createResponse.data.id;
      this.assert(createResponse.data.title === noteData.title, 'Note title matches');
      this.assert(Array.isArray(createResponse.data.content), 'Note content is array');
      this.assert(createResponse.data.tags && createResponse.data.tags.includes('test'), 'Note tags preserved');
      console.log(`📋 Created note ID: ${this.testNoteId}`);
    }

    // Test reading the note
    if (this.testNoteId) {
      console.log(`📖 Reading note ${this.testNoteId}...`);
      const readResponse = await this.makeRequest(`/notes/${this.testNoteId}`);
      this.assert(readResponse.ok, `Note retrieval successful (status: ${readResponse.status})`);
      if (readResponse.ok && readResponse.data) {
        this.assert(readResponse.data.id === this.testNoteId, 'Retrieved note has correct ID');
      }
    }

    // Test updating the note
    if (this.testNoteId) {
      const updateData = {
        title: 'Updated Test Note',
        tags: ['test', 'automation', 'updated']
      };

      console.log(`✏️  Updating note with data:`, JSON.stringify(updateData, null, 2));

      const updateResponse = await this.makeRequest(`/notes/${this.testNoteId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      this.assert(updateResponse.ok, `Note update successful (status: ${updateResponse.status})`);
      if (updateResponse.ok && updateResponse.data) {
        this.assert(updateResponse.data.title === updateData.title, 'Note title updated');
        this.assert(updateResponse.data.tags && updateResponse.data.tags.includes('updated'), 'Note tags updated');
      }
    }

    // Test listing notes
    console.log(`📋 Listing notes...`);
    const listResponse = await this.makeRequest('/notes');
    this.assert(listResponse.ok, `Notes listing successful (status: ${listResponse.status})`);
    if (listResponse.ok && listResponse.data) {
      this.assert(Array.isArray(listResponse.data.notes), 'Notes list is array');
      this.assert(typeof listResponse.data.total === 'number', 'Total count provided');
      this.assert(typeof listResponse.data.page === 'number', 'Page number provided');
      console.log(`📊 Found ${listResponse.data.total} total notes, page ${listResponse.data.page}`);
    }
  }

  // Test notes search and filtering
  async testNotesSearch() {
    console.log('\n🔍 Testing Notes Search and Filtering...');

    // Test search by title
    const searchResponse = await this.makeRequest('/notes?search=Updated Test');
    this.assert(searchResponse.ok, `Notes search successful (status: ${searchResponse.status})`);
    if (searchResponse.ok && searchResponse.data) {
      this.assert(Array.isArray(searchResponse.data.notes), 'Search results is array');
      console.log(`🔎 Search found ${searchResponse.data.notes.length} results`);
    }

    // Test filter by tags
    const tagFilterResponse = await this.makeRequest('/notes?tags=test');
    this.assert(tagFilterResponse.ok, `Notes tag filtering successful (status: ${tagFilterResponse.status})`);

    // Test pagination
    const paginationResponse = await this.makeRequest('/notes?page=1&limit=5');
    this.assert(paginationResponse.ok, `Notes pagination successful (status: ${paginationResponse.status})`);
    if (paginationResponse.ok && paginationResponse.data) {
      this.assert(paginationResponse.data.limit === 5, 'Pagination limit respected');
    }
  }

  // Test notes stats
  async testNotesStats() {
    console.log('\n📊 Testing Notes Statistics...');

    const statsResponse = await this.makeRequest('/notes/stats');
    this.assert(statsResponse.ok, `Notes stats retrieval successful (status: ${statsResponse.status})`);
    if (statsResponse.ok && statsResponse.data) {
      this.assert(typeof statsResponse.data.totalNotes === 'number', 'Total notes count provided');
      this.assert(typeof statsResponse.data.totalTags === 'number', 'Total tags count provided');
      console.log(`📈 Stats: ${statsResponse.data.totalNotes} notes, ${statsResponse.data.totalTags} tags`);
    }
  }

  // Test tags functionality
  async testTagsFeatures() {
    console.log('\n🏷️ Testing Tags Features...');

    const tagsResponse = await this.makeRequest('/notes/tags');
    this.assert(tagsResponse.ok, `Tags listing successful (status: ${tagsResponse.status})`);
    if (tagsResponse.ok && tagsResponse.data) {
      this.assert(Array.isArray(tagsResponse.data), 'Tags list is array');
      console.log(`🏷️  Found ${tagsResponse.data.length} unique tags`);
      if (tagsResponse.data.includes('test')) {
        this.assert(true, 'Test tag exists in list');
      }
    }
  }

  // Test calendar functionality
  async testCalendarFeatures() {
    console.log('\n📅 Testing Calendar Features...');

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    console.log(`📅 Testing calendar for ${year}/${month}...`);

    const calendarResponse = await this.makeRequest(`/notes/calendar/${year}/${month}`);
    this.assert(calendarResponse.ok, `Calendar notes retrieval successful (status: ${calendarResponse.status})`);
    if (calendarResponse.ok && calendarResponse.data) {
      this.assert(Array.isArray(calendarResponse.data), 'Calendar notes is array');
      console.log(`📅 Calendar found ${calendarResponse.data.length} notes for ${year}/${month}`);
    }
  }

  // Test error handling
  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');

    // Test accessing non-existent note
    const notFoundResponse = await this.makeRequest('/notes/non-existent-id');
    this.assert(notFoundResponse.status === 404, `Non-existent note returns 404 (got ${notFoundResponse.status})`);

    // Test unauthorized access (without token)
    const originalToken = this.token;
    this.token = null;
    const unauthorizedResponse = await this.makeRequest('/notes');
    this.assert(unauthorizedResponse.status === 401, `Unauthorized access returns 401 (got ${unauthorizedResponse.status})`);
    this.token = originalToken;

    // Test invalid data
    const invalidDataResponse = await this.makeRequest('/notes', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' })
    });
    this.assert(!invalidDataResponse.ok, `Invalid data is rejected (status: ${invalidDataResponse.status})`);
  }

  // Test cleanup
  async testCleanup() {
    console.log('\n🧹 Cleaning up test data...');

    if (this.testNoteId) {
      console.log(`🗑️  Deleting test note ${this.testNoteId}...`);
      const deleteResponse = await this.makeRequest(`/notes/${this.testNoteId}`, {
        method: 'DELETE'
      });
      this.assert(deleteResponse.ok, `Test note deletion successful (status: ${deleteResponse.status})`);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Notes API Test Suite\n');
    console.log(`Testing against: ${API_BASE_URL}`);
    console.log(`Test user: ${TEST_USER.email}\n`);

    try {
      // Authentication is required for most tests
      const authSuccess = await this.testAuthentication();
      if (!authSuccess) {
        console.log('\n❌ Authentication failed - stopping tests');
        return;
      }

      // Run all test suites
      await this.testHealthEndpoint();
      await this.testNotesCRUD();
      await this.testNotesSearch();
      await this.testNotesStats();
      await this.testTagsFeatures();
      await this.testCalendarFeatures();
      await this.testErrorHandling();
      await this.testCleanup();

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('\n💥 Test suite crashed:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }

  // Print test summary
  printSummary() {
    console.log('\n📋 Test Summary:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.test}`));
    }

    console.log('\n' + (failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
    
    if (failed === 0) {
      console.log('\n✨ Notes functionality is working correctly!');
      console.log('🎯 Ready for production use.');
    } else {
      console.log('\n🔧 Next steps:');
      console.log('  1. Review failed test details above');
      console.log('  2. Check backend logs in GCP Console');
      console.log('  3. Verify API endpoints and authentication');
      console.log('  4. Test manually in frontend application');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  console.log('⚙️  Node.js version:', process.version);
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('📡 API URL:', API_BASE_URL);
  console.log('');
  
  const testSuite = new NotesTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = NotesTestSuite; 