# StockENT Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy for StockENT, a B2B textile dead stock marketplace. The testing framework covers unit tests, integration tests, end-to-end tests, performance tests, and continuous testing.

## Testing Architecture

### Backend Testing (Node.js/Express)
- **Framework**: Jest + Supertest
- **Coverage**: Unit tests, integration tests, performance tests
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO testing
- **Authentication**: JWT token testing

### Frontend Testing (React/TypeScript)
- **Framework**: Jest + React Testing Library
- **Coverage**: Component tests, page tests, integration tests
- **Mocking**: MSW (Mock Service Worker)
- **UI Testing**: Material-UI component testing

### End-to-End Testing
- **Framework**: Playwright
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Coverage**: User flows, cross-browser compatibility
- **Performance**: Load testing, stress testing

## Test Categories

### 1. Unit Tests
**Purpose**: Test individual functions, components, and modules in isolation.

**Backend Unit Tests**:
- Authentication (login, register, logout, refresh)
- Product management (CRUD operations)
- Auction functionality (bidding, ending auctions)
- Message system (conversations, messages)
- User management (profiles, roles)

**Frontend Unit Tests**:
- Component rendering and behavior
- Form validation and submission
- State management (Context API)
- API integration (React Query)
- Navigation and routing

### 2. Integration Tests
**Purpose**: Test the interaction between different parts of the system.

**API Integration Tests**:
- Authentication flow (register → login → access protected routes)
- Product lifecycle (create → update → delete)
- Auction flow (create → bid → end)
- Message flow (start conversation → send messages)
- Error handling and recovery

**Database Integration Tests**:
- CRUD operations with real database
- Transaction handling
- Data validation
- Relationship testing

### 3. End-to-End Tests
**Purpose**: Test complete user workflows from start to finish.

**Critical User Flows**:
- User registration and login
- Product browsing and search
- Product creation (seller)
- Auction participation (buyer)
- Messaging between users
- Profile management

**Cross-Browser Testing**:
- Chrome, Firefox, Safari
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design testing

### 4. Performance Tests
**Purpose**: Ensure the application performs well under various conditions.

**Load Testing**:
- Concurrent user simulation
- API response time testing
- Database query performance
- Memory usage monitoring

**Stress Testing**:
- High concurrent load
- Rapid sequential requests
- Error recovery testing
- Resource usage monitoring

## Test Data Management

### Test Database Setup
```sql
-- Test database configuration
DATABASE_URL="postgresql://test:test@localhost:5432/stockent_test"
```

### Test Data Seeding
- Categories (Cotton, Polyester, Silk)
- Test users (sellers, buyers, admins)
- Sample products with images
- Auction data
- Message conversations

### Mock Data
- API responses for frontend testing
- Socket.IO event mocking
- File upload simulation
- External service mocking

## Running Tests

### Prerequisites
```bash
# Node.js 18+ required
node --version

# Install dependencies
npm run install:all
```

### Test Commands

#### Run All Tests
```bash
# Run complete test suite
./run-tests.sh

# Run specific test types
./run-tests.sh --type backend
./run-tests.sh --type frontend
./run-tests.sh --type e2e
./run-tests.sh --type performance
```

#### Backend Tests
```bash
cd backend

# Run all backend tests
npm run test:all

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:performance

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

#### Frontend Tests
```bash
cd frontend

# Run all frontend tests
npm run test:all

# Run specific test categories
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

#### End-to-End Tests
```bash
cd e2e

# Install Playwright browsers
npx playwright install

# Run all e2e tests
npx playwright test

# Run specific test files
npx playwright test auth.spec.ts
npx playwright test products.spec.ts

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug
```

### Continuous Integration

#### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm run install:all
      - run: npm run test:ci
```

#### Test Environment Variables
```bash
# Test database
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/stockent_test"

# Test Redis
TEST_REDIS_URL="redis://localhost:6379/1"

# JWT secrets
JWT_SECRET="test-jwt-secret-key"
JWT_REFRESH_SECRET="test-refresh-secret-key"

# API URLs
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:5001"
```

## Test Coverage

### Coverage Targets
- **Backend**: 90%+ code coverage
- **Frontend**: 85%+ code coverage
- **Critical Paths**: 100% coverage
- **API Endpoints**: 100% coverage

### Coverage Reports
- HTML reports generated in `coverage/` directories
- LCOV format for CI integration
- Coverage badges in README

## Performance Benchmarks

### API Response Times
- Health check: < 100ms
- Product search: < 500ms
- Authentication: < 2000ms
- Database queries: < 1000ms

### Load Testing
- Concurrent users: 200+
- Requests per second: 100+
- Memory usage: < 500MB
- CPU usage: < 80%

### Browser Performance
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 4s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## Error Handling Tests

### API Error Scenarios
- Invalid authentication tokens
- Malformed request data
- Database connection failures
- Rate limiting
- Network timeouts

### Frontend Error Scenarios
- Network connectivity issues
- API error responses
- Form validation errors
- Component rendering errors
- State management errors

### Recovery Testing
- Automatic retry mechanisms
- Fallback UI components
- Error boundary handling
- User-friendly error messages

## Security Testing

### Authentication Security
- JWT token validation
- Password strength requirements
- Session management
- OAuth integration

### API Security
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

### Data Security
- Sensitive data encryption
- Secure file uploads
- Database access control
- API endpoint protection

## Mobile Testing

### Responsive Design
- Mobile viewport testing
- Touch interaction testing
- Gesture support
- Performance on mobile devices

### Mobile Browsers
- iOS Safari
- Chrome Mobile
- Firefox Mobile
- Samsung Internet

## Accessibility Testing

### WCAG Compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management
- ARIA attributes

### Testing Tools
- axe-core integration
- Lighthouse accessibility audit
- Manual testing checklist

## Test Maintenance

### Test Data Cleanup
- Automatic database cleanup after tests
- Mock data reset
- File system cleanup
- Cache clearing

### Test Documentation
- Test case documentation
- API testing examples
- Performance benchmarks
- Troubleshooting guides

### Continuous Improvement
- Regular test review
- Performance optimization
- Coverage analysis
- Test automation enhancement

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U test -d stockent_test
```

#### Redis Connection
```bash
# Check Redis status
sudo systemctl status redis

# Test Redis connection
redis-cli ping
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :5001

# Kill processes on ports
sudo kill -9 $(lsof -t -i:3000)
sudo kill -9 $(lsof -t -i:5001)
```

#### Test Failures
```bash
# Run tests with verbose output
npm run test -- --verbose

# Run specific test file
npm run test -- auth.test.js

# Debug test failures
npm run test -- --detectOpenHandles
```

### Performance Issues
```bash
# Monitor memory usage
node --inspect backend/src/server.js

# Profile test execution
npm run test -- --profile

# Check test coverage
npm run test:coverage
```

## Best Practices

### Test Writing
- Write tests before implementation (TDD)
- Use descriptive test names
- Keep tests independent
- Mock external dependencies
- Test edge cases and error conditions

### Test Organization
- Group related tests
- Use consistent naming conventions
- Maintain test data separately
- Document test scenarios

### Performance Testing
- Run performance tests regularly
- Monitor test execution time
- Optimize slow tests
- Use parallel test execution

### Maintenance
- Update tests when code changes
- Remove obsolete tests
- Refactor test code
- Monitor test coverage

## Conclusion

This comprehensive testing framework ensures the reliability, performance, and security of the StockENT B2B textile marketplace. The multi-layered approach covers all aspects of the application, from individual components to complete user workflows, providing confidence in the system's quality and stability.

For questions or issues with testing, please refer to the troubleshooting section or contact the development team.