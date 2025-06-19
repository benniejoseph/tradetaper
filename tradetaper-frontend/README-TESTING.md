# Notes Testing Documentation

This document describes the comprehensive testing suite for the TradeTaper Notes functionality.

## 🧪 Test Suites Overview

The testing suite includes multiple layers of testing to ensure the notes functionality is robust and reliable:

1. **Unit Tests** - Test individual components and functions
2. **Integration Tests** - Test API endpoints and data flow
3. **Frontend Tests** - Test React components and user interactions
4. **Manual Tests** - Step-by-step user testing scenarios
5. **Performance Tests** - Load and response time testing
6. **Security Tests** - Authentication and authorization testing

## 📁 Test Files Structure

```
tradetaper-frontend/
├── test-notes.js              # Automated API test suite
├── tests/
│   ├── notes-manual.md        # Manual testing guide
│   ├── notes-api.test.js      # Jest API integration tests
│   └── notes-frontend.test.js # Jest frontend component tests
├── run-tests.sh              # Comprehensive test runner
├── jest.setup.js             # Jest configuration
└── README-TESTING.md         # This documentation
```

## 🚀 Quick Start

### Run All Tests
```bash
./run-tests.sh
```

### Run Specific Test Suites
```bash
# Unit and frontend tests only
./run-tests.sh frontend

# API integration tests only
./run-tests.sh api

# Manual functionality tests
./run-tests.sh manual

# Performance tests
./run-tests.sh performance

# Security tests
./run-tests.sh security

# Generate coverage report
./run-tests.sh coverage
```

### Individual Test Commands
```bash
# Jest unit tests
npm test

# Jest with watch mode
npm run test:watch

# API integration tests
npm run test:notes

# Frontend component tests
npm run test:frontend

# Manual API tests
npm run test:manual

# Coverage report
npm run test:coverage
```

## 📋 Test Categories

### 1. Authentication Tests
- User login/registration
- JWT token validation
- Token expiry handling
- Unauthorized access blocking

### 2. Notes CRUD Tests
- Create new notes
- Read existing notes
- Update note content
- Delete notes
- Bulk operations

### 3. Content Block Tests
- Text blocks
- Heading blocks
- Quote blocks
- Code blocks
- Callout blocks
- Block menu interactions

### 4. Search & Filtering Tests
- Full-text search
- Tag filtering
- Date range filtering
- Pagination
- Sorting options

### 5. Auto-save Tests
- Content change detection
- Debounced saving
- Network failure handling
- Conflict resolution

### 6. Calendar Integration Tests
- Monthly view
- Note density visualization
- Date-based filtering
- Navigation between months

### 7. Tags Management Tests
- Adding tags
- Removing tags
- Auto-completion
- Tag suggestions

### 8. User Interface Tests
- Component rendering
- User interactions
- Form validation
- Error states
- Loading states

### 9. Performance Tests
- API response times
- Large content handling
- Memory usage
- Concurrent operations

### 10. Security Tests
- Authentication requirements
- Data isolation
- Input sanitization
- CORS configuration

## 🔧 Test Configuration

### Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL="https://tradetaper-backend-481634875325.us-central1.run.app/api/v1"
NEXT_PUBLIC_BACKEND_URL="https://tradetaper-backend-481634875325.us-central1.run.app"

# Test User Credentials
TEST_EMAIL="test@tradetaper.com"
TEST_PASSWORD="TestPassword123!"
```

### Jest Configuration
```javascript
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

## 📊 Coverage Requirements

The test suite maintains the following minimum coverage requirements:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🐛 Debugging Tests

### Common Issues

1. **Authentication Failures**
   ```bash
   # Check API connectivity
   curl -s https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/health
   
   # Verify test credentials
   echo $TEST_EMAIL $TEST_PASSWORD
   ```

2. **API Connection Issues**
   ```bash
   # Test network connectivity
   ping tradetaper-backend-481634875325.us-central1.run.app
   
   # Check CORS headers
   curl -H "Origin: http://localhost:3000" -I https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/health
   ```

3. **Frontend Test Failures**
   ```bash
   # Clear Jest cache
   npm test -- --clearCache
   
   # Run with verbose output
   npm test -- --verbose
   ```

### Debugging Tips

- Use `console.log` statements in tests for debugging
- Run tests in watch mode for iterative development
- Check browser DevTools for network issues
- Verify environment variables are loaded correctly

## 📈 Performance Benchmarks

### Expected Response Times
- Health endpoint: < 200ms
- Notes list: < 500ms
- Note creation: < 1000ms
- Search queries: < 800ms

### Load Testing
```bash
# Simple load test with curl
for i in {1..10}; do
  time curl -s https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/health > /dev/null
done
```

## 🔒 Security Testing

### Authentication Tests
- Verify JWT token requirements
- Test token expiry handling
- Check unauthorized access blocking
- Validate CORS configuration

### Data Protection Tests
- User data isolation
- Input sanitization
- SQL injection prevention
- XSS protection

## 📝 Manual Testing

For comprehensive manual testing, follow the guide in `tests/notes-manual.md`. This includes:

- Step-by-step user scenarios
- Browser compatibility testing
- Mobile responsiveness
- Accessibility testing

## 🎯 Test Data Management

### Test Data Creation
```javascript
const testNote = {
  title: 'Test Note',
  content: [
    {
      id: 'block-1',
      type: 'text',
      content: { text: 'Test content' },
      position: 0
    }
  ],
  tags: ['test'],
  visibility: 'private'
};
```

### Cleanup Strategy
- Tests create and clean up their own data
- Use unique identifiers (timestamps) for test data
- Automated cleanup in test teardown

## 📖 Best Practices

1. **Write Descriptive Test Names**
   ```javascript
   test('should create note with multiple content blocks', async () => {
     // Test implementation
   });
   ```

2. **Use Proper Assertions**
   ```javascript
   expect(response.ok).toBe(true);
   expect(response.data.title).toBe(expectedTitle);
   expect(Array.isArray(response.data.content)).toBe(true);
   ```

3. **Mock External Dependencies**
   ```javascript
   jest.mock('../src/services/api');
   ```

4. **Test Error Conditions**
   ```javascript
   test('should handle network errors gracefully', async () => {
     // Test error handling
   });
   ```

5. **Isolate Tests**
   - Each test should be independent
   - Use proper setup and teardown
   - Don't rely on test execution order

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
name: Notes Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
```

### Pre-commit Hooks
```bash
# Install husky for pre-commit hooks
npm install --save-dev husky

# Add pre-commit test hook
npx husky add .husky/pre-commit "npm test"
```

## 📞 Support

If you encounter issues with the testing suite:

1. Check this documentation first
2. Review the console output for specific errors
3. Verify environment configuration
4. Check API connectivity
5. Create an issue with detailed error information

## 🔄 Maintenance

### Regular Maintenance Tasks
- Update test dependencies monthly
- Review and update test cases for new features
- Monitor test performance and execution time
- Update test data and scenarios
- Review coverage reports and improve coverage

### Version Compatibility
- Node.js: >= 18.0.0
- npm: >= 8.0.0
- Jest: ^29.7.0
- React Testing Library: ^14.0.0

## 📊 Test Reports

After running tests, reports are available in:

- **Coverage Report**: `./coverage/lcov-report/index.html`
- **Jest Output**: Console output with pass/fail status
- **Performance Metrics**: Response time measurements
- **Security Scan Results**: Authentication and authorization tests

## 🎉 Success Criteria

The notes functionality is considered fully tested when:

- ✅ All test suites pass
- ✅ Coverage thresholds are met
- ✅ Manual testing scenarios complete successfully
- ✅ Performance benchmarks are achieved
- ✅ Security requirements are validated
- ✅ No critical bugs in production scenarios 