/**
 * Notes API Test Suite using Jest
 * Run with: npm test or jest tests/notes-api.test.js
 */

const NotesTestSuite = require('../test-notes.js');

// Mock fetch for testing
global.fetch = require('node-fetch');

describe('Notes API Test Suite', () => {
  let testSuite;
  let testNoteId;

  beforeAll(async () => {
    testSuite = new NotesTestSuite();
    // Override console.log for Jest
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(async () => {
    // Cleanup any test data
    if (testNoteId) {
      await testSuite.makeRequest(`/notes/${testNoteId}`, {
        method: 'DELETE'
      });
    }
  });

  describe('Authentication', () => {
    test('should authenticate user successfully', async () => {
      const success = await testSuite.testAuthentication();
      expect(success).toBe(true);
      expect(testSuite.token).toBeTruthy();
    });

    test('should have valid JWT token format', () => {
      expect(testSuite.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/);
    });
  });

  describe('Health Check', () => {
    test('should respond to health endpoint', async () => {
      const response = await testSuite.makeRequest('/health');
      expect(response.ok).toBe(true);
      expect(response.data.status).toBe('ok');
      expect(typeof response.data.uptime).toBe('number');
    });
  });

  describe('Notes CRUD Operations', () => {
    const testNote = {
      title: 'Jest Test Note',
      content: [
        {
          id: 'block-1',
          type: 'text',
          content: { text: 'This is a Jest test note.' },
          position: 0
        }
      ],
      tags: ['jest', 'test'],
      visibility: 'private'
    };

    test('should create a new note', async () => {
      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify(testNote)
      });

      expect(response.ok).toBe(true);
      expect(response.data.title).toBe(testNote.title);
      expect(response.data.tags).toEqual(expect.arrayContaining(['jest', 'test']));
      expect(response.data.id).toBeTruthy();
      
      testNoteId = response.data.id;
    });

    test('should retrieve the created note', async () => {
      expect(testNoteId).toBeTruthy();
      
      const response = await testSuite.makeRequest(`/notes/${testNoteId}`);
      expect(response.ok).toBe(true);
      expect(response.data.id).toBe(testNoteId);
      expect(response.data.title).toBe(testNote.title);
    });

    test('should update the note', async () => {
      expect(testNoteId).toBeTruthy();
      
      const updateData = {
        title: 'Updated Jest Test Note',
        tags: ['jest', 'test', 'updated']
      };

      const response = await testSuite.makeRequest(`/notes/${testNoteId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      expect(response.ok).toBe(true);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.tags).toEqual(expect.arrayContaining(['updated']));
    });

    test('should list notes with pagination', async () => {
      const response = await testSuite.makeRequest('/notes?page=1&limit=10');
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data.notes)).toBe(true);
      expect(typeof response.data.total).toBe('number');
      expect(typeof response.data.page).toBe('number');
      expect(response.data.limit).toBe(10);
    });

    test('should delete the note', async () => {
      expect(testNoteId).toBeTruthy();
      
      const response = await testSuite.makeRequest(`/notes/${testNoteId}`, {
        method: 'DELETE'
      });

      expect(response.ok).toBe(true);
      
      // Verify note is deleted
      const getResponse = await testSuite.makeRequest(`/notes/${testNoteId}`);
      expect(getResponse.status).toBe(404);
      
      testNoteId = null; // Prevent cleanup attempt
    });
  });

  describe('Notes Search and Filtering', () => {
    let searchTestNoteId;

    beforeAll(async () => {
      // Create a note for search testing
      const searchNote = {
        title: 'Searchable Test Note',
        content: [{ id: '1', type: 'text', content: { text: 'searchable content' }, position: 0 }],
        tags: ['searchable', 'test'],
        visibility: 'private'
      };

      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify(searchNote)
      });

      if (response.ok) {
        searchTestNoteId = response.data.id;
      }
    });

    afterAll(async () => {
      if (searchTestNoteId) {
        await testSuite.makeRequest(`/notes/${searchTestNoteId}`, {
          method: 'DELETE'
        });
      }
    });

    test('should search notes by title', async () => {
      const response = await testSuite.makeRequest('/notes?search=Searchable');
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data.notes)).toBe(true);
      
      if (response.data.notes.length > 0) {
        expect(response.data.notes.some(note => 
          note.title.includes('Searchable')
        )).toBe(true);
      }
    });

    test('should filter notes by tags', async () => {
      const response = await testSuite.makeRequest('/notes?tags=searchable');
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data.notes)).toBe(true);
    });

    test('should handle empty search results', async () => {
      const response = await testSuite.makeRequest('/notes?search=nonexistentxyz123');
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data.notes)).toBe(true);
      expect(response.data.notes.length).toBe(0);
    });
  });

  describe('Notes Statistics', () => {
    test('should get notes statistics', async () => {
      const response = await testSuite.makeRequest('/notes/stats');
      expect(response.ok).toBe(true);
      expect(typeof response.data.totalNotes).toBe('number');
      expect(typeof response.data.totalTags).toBe('number');
      expect(response.data.totalNotes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tags Management', () => {
    test('should get all tags', async () => {
      const response = await testSuite.makeRequest('/notes/tags');
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Calendar Features', () => {
    test('should get calendar notes for current month', async () => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await testSuite.makeRequest(`/notes/calendar/${year}/${month}`);
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('should handle invalid calendar dates', async () => {
      const response = await testSuite.makeRequest('/notes/calendar/2023/13'); // Invalid month
      expect(response.ok).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent note', async () => {
      const response = await testSuite.makeRequest('/notes/non-existent-id-12345');
      expect(response.status).toBe(404);
    });

    test('should return 401 for unauthorized requests', async () => {
      const originalToken = testSuite.token;
      testSuite.token = null;

      const response = await testSuite.makeRequest('/notes');
      expect(response.status).toBe(401);

      testSuite.token = originalToken;
    });

    test('should handle malformed requests', async () => {
      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: 'invalid json'
      });
      expect(response.ok).toBe(false);
    });

    test('should validate required fields', async () => {
      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify({}) // Empty object
      });
      expect(response.ok).toBe(false);
    });
  });

  describe('Data Validation', () => {
    test('should validate note title length', async () => {
      const longTitle = 'a'.repeat(1000); // Very long title
      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: longTitle,
          content: [],
          tags: [],
          visibility: 'private'
        })
      });
      // Should either accept with truncation or reject
      expect([200, 201, 400].includes(response.status)).toBe(true);
    });

    test('should validate content structure', async () => {
      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Note',
          content: 'invalid content format', // Should be array
          tags: [],
          visibility: 'private'
        })
      });
      expect(response.ok).toBe(false);
    });

    test('should validate visibility values', async () => {
      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Note',
          content: [],
          tags: [],
          visibility: 'invalid_visibility'
        })
      });
      expect(response.ok).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large note content', async () => {
      const largeContent = Array.from({ length: 50 }, (_, i) => ({
        id: `block-${i}`,
        type: 'text',
        content: { text: `Block ${i} with some content that is reasonably long to test performance.` },
        position: i
      }));

      const response = await testSuite.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Large Content Test',
          content: largeContent,
          tags: ['performance', 'test'],
          visibility: 'private'
        })
      });

      expect(response.ok).toBe(true);
      
      // Cleanup
      if (response.ok && response.data.id) {
        await testSuite.makeRequest(`/notes/${response.data.id}`, {
          method: 'DELETE'
        });
      }
    }, 10000); // 10 second timeout for performance test

    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      const response = await testSuite.makeRequest('/notes?limit=10');
      const endTime = Date.now();

      expect(response.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
}); 