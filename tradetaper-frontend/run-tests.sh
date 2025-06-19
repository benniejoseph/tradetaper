#!/bin/bash

# Notes Testing Suite Runner
# Comprehensive testing script for notes functionality

set -e

echo "🧪 Starting Notes Testing Suite"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://tradetaper-backend-481634875325.us-central1.run.app/api/v1"
FRONTEND_URL="https://tradetaper-frontend-benniejosephs-projects.vercel.app"
TEST_EMAIL="test@tradetaper.com"
TEST_PASSWORD="TestPassword123!"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing test dependencies..."
    
    if npm install --silent; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Test API connectivity
test_api_connectivity() {
    print_status "Testing API connectivity..."
    
    # Test health endpoint
    if curl -s --fail "$API_URL/health" > /dev/null; then
        print_success "Backend API is reachable"
    else
        print_error "Backend API is not reachable at $API_URL"
        exit 1
    fi
    
    # Test frontend
    if curl -s --fail "$FRONTEND_URL" > /dev/null; then
        print_success "Frontend is reachable"
    else
        print_warning "Frontend might not be reachable at $FRONTEND_URL"
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if npm test -- --passWithNoTests; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Run API tests
run_api_tests() {
    print_status "Running API integration tests..."
    
    # Set environment variables for API tests
    export TEST_API_URL="$API_URL"
    export TEST_EMAIL="$TEST_EMAIL"
    export TEST_PASSWORD="$TEST_PASSWORD"
    
    if npm run test:notes; then
        print_success "API tests passed"
    else
        print_error "API tests failed"
        return 1
    fi
}

# Run frontend component tests
run_frontend_tests() {
    print_status "Running frontend component tests..."
    
    if npm run test:frontend; then
        print_success "Frontend tests passed"
    else
        print_error "Frontend tests failed"
        return 1
    fi
}

# Run manual API tests
run_manual_tests() {
    print_status "Running manual API tests..."
    
    # Update test script with current credentials
    cat > test-notes-config.js << EOF
module.exports = {
  API_BASE_URL: '$API_URL',
  TEST_USER: {
    email: '$TEST_EMAIL',
    password: '$TEST_PASSWORD'
  }
};
EOF
    
    if npm run test:manual; then
        print_success "Manual API tests passed"
    else
        print_error "Manual API tests failed"
        return 1
    fi
}

# Generate test coverage report
generate_coverage() {
    print_status "Generating test coverage report..."
    
    if npm run test:coverage -- --silent; then
        print_success "Coverage report generated"
        print_status "Coverage report available in ./coverage/lcov-report/index.html"
    else
        print_warning "Could not generate coverage report"
    fi
}

# Test specific notes functionality
test_notes_functionality() {
    print_status "Testing specific notes features..."
    
    # Test note creation
    echo "Testing note creation..."
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if echo "$RESPONSE" | grep -q "token"; then
        TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        print_success "Authentication successful"
        
        # Test creating a note
        NOTE_RESPONSE=$(curl -s -X POST "$API_URL/notes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d '{
                "title": "Test Note from Script",
                "content": [{"id":"1","type":"text","content":{"text":"Test content"},"position":0}],
                "tags": ["test", "script"],
                "visibility": "private"
            }')
        
        if echo "$NOTE_RESPONSE" | grep -q "id"; then
            NOTE_ID=$(echo "$NOTE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
            print_success "Note creation successful (ID: $NOTE_ID)"
            
            # Clean up - delete the test note
            curl -s -X DELETE "$API_URL/notes/$NOTE_ID" \
                -H "Authorization: Bearer $TOKEN" > /dev/null
            print_status "Test note cleaned up"
        else
            print_error "Note creation failed"
            echo "Response: $NOTE_RESPONSE"
            return 1
        fi
    else
        print_error "Authentication failed"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Simple response time test
    START_TIME=$(date +%s%N)
    curl -s "$API_URL/health" > /dev/null
    END_TIME=$(date +%s%N)
    DURATION=$((($END_TIME - $START_TIME) / 1000000))
    
    if [ $DURATION -lt 2000 ]; then
        print_success "API response time is good (${DURATION}ms)"
    else
        print_warning "API response time is slow (${DURATION}ms)"
    fi
}

# Security tests
run_security_tests() {
    print_status "Running basic security tests..."
    
    # Test unauthorized access
    UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/notes")
    if [ "$UNAUTH_RESPONSE" = "401" ]; then
        print_success "Unauthorized access properly blocked"
    else
        print_warning "Unauthorized access check failed (got $UNAUTH_RESPONSE, expected 401)"
    fi
    
    # Test CORS headers
    CORS_RESPONSE=$(curl -s -H "Origin: https://evil.com" -I "$API_URL/health")
    if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
        print_success "CORS headers are present"
    else
        print_warning "CORS headers might not be configured"
    fi
}

# Main execution
main() {
    echo "Testing Configuration:"
    echo "  API URL: $API_URL"
    echo "  Frontend URL: $FRONTEND_URL"
    echo "  Test Email: $TEST_EMAIL"
    echo ""
    
    local FAILED_TESTS=0
    
    # Run all test suites
    check_prerequisites
    install_dependencies
    test_api_connectivity
    
    # Unit tests
    if ! run_unit_tests; then
        ((FAILED_TESTS++))
    fi
    
    # API tests
    if ! run_api_tests; then
        ((FAILED_TESTS++))
    fi
    
    # Frontend tests
    if ! run_frontend_tests; then
        ((FAILED_TESTS++))
    fi
    
    # Manual tests
    if ! run_manual_tests; then
        ((FAILED_TESTS++))
    fi
    
    # Functionality tests
    if ! test_notes_functionality; then
        ((FAILED_TESTS++))
    fi
    
    # Performance tests
    run_performance_tests
    
    # Security tests
    run_security_tests
    
    # Coverage report
    generate_coverage
    
    # Summary
    echo ""
    echo "🏁 Testing Complete"
    echo "=================="
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All test suites passed! ✨"
        echo ""
        echo "📋 Summary:"
        echo "  ✅ Prerequisites checked"
        echo "  ✅ API connectivity verified"
        echo "  ✅ Unit tests passed"
        echo "  ✅ API integration tests passed"
        echo "  ✅ Frontend component tests passed"
        echo "  ✅ Manual functionality tests passed"
        echo "  ✅ Performance tests completed"
        echo "  ✅ Security tests completed"
        echo ""
        echo "🎉 Notes functionality is working correctly!"
        exit 0
    else
        print_error "$FAILED_TESTS test suite(s) failed"
        echo ""
        echo "📋 Next steps:"
        echo "  1. Check the error messages above"
        echo "  2. Review logs in browser DevTools"
        echo "  3. Verify environment configuration"
        echo "  4. Check backend deployment status"
        echo ""
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "unit")
        check_prerequisites
        install_dependencies
        run_unit_tests
        ;;
    "api")
        check_prerequisites
        test_api_connectivity
        run_api_tests
        ;;
    "frontend")
        check_prerequisites
        install_dependencies
        run_frontend_tests
        ;;
    "manual")
        check_prerequisites
        test_api_connectivity
        run_manual_tests
        ;;
    "performance")
        check_prerequisites
        test_api_connectivity
        run_performance_tests
        ;;
    "security")
        check_prerequisites
        test_api_connectivity
        run_security_tests
        ;;
    "coverage")
        check_prerequisites
        install_dependencies
        generate_coverage
        ;;
    *)
        main
        ;;
esac 