# Testing Guide

## Overview
This project uses Jest for unit and integration testing. The test suite covers:
- Unit tests for utilities, entities, and use cases
- Integration tests for API endpoints
- Mock tests for database operations

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- password.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="JWT"
```

## Test Structure

```
tests/
├── unit/               # Unit tests
│   ├── domain/        # Entity tests
│   ├── use-cases/     # Business logic tests
│   └── utils/         # Utility function tests
├── integration/        # Integration tests
│   ├── api/           # API endpoint tests
│   └── database/      # Database integration tests
└── mocks/             # Mock data and helpers
```

## Writing Tests

### Unit Test Example

```typescript
import { PasswordUtil } from '../../../src/shared/utils/password';

describe('PasswordUtil', () => {
  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtil.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import app from '../../../src/app';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });
  });
});
```

## Test Coverage Goals

- **Utilities**: >90% coverage
- **Domain Entities**: >85% coverage
- **Use Cases**: >80% coverage
- **API Endpoints**: >75% coverage
- **Overall**: >80% coverage

## Mocking

### Database Mocks

```typescript
jest.mock('../../../src/infrastructure/database/postgresql/UserRepository');
```

### External Service Mocks

```typescript
jest.mock('../../../src/infrastructure/messaging/rabbitmq/publisher');
```

## Testing Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: Use clear, descriptive test names
4. **Independent tests**: Tests should not depend on each other
5. **Clean up**: Reset mocks and test data after each test

## CI/CD Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Before deployment

## Troubleshooting

### Tests failing locally but passing in CI
- Check Node.js version matches
- Verify environment variables
- Clear Jest cache: `npm test -- --clearCache`

### Slow tests
- Use `--runInBand` for sequential execution
- Mock external dependencies
- Optimize database test setup

### Database connection errors in tests
- Ensure test database is running
- Use in-memory database for unit tests
- Check connection strings in test environment

## Coverage Reports

Coverage reports are generated in `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-summary.json` - JSON summary

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Implement load testing with k6
- [ ] Add mutation testing with Stryker
- [ ] Set up visual regression testing
- [ ] Implement contract testing for APIs

## Example Tests Provided

The following test files are included as examples:
- `tests/unit/utils/password.test.ts` - Password hashing tests
- `tests/unit/utils/jwt.test.ts` - JWT token tests
- `tests/unit/domain/User.test.ts` - User entity tests

Use these as templates for writing additional tests.

