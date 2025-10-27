# Testing Guide - Meldunki App

This document provides a comprehensive guide for testing the Meldunki App using Vitest for unit tests and Playwright for e2e tests.

## Table of Contents

1. [Testing Setup](#testing-setup)
2. [Unit Testing with Vitest](#unit-testing-with-vitest)
3. [E2E Testing with Playwright](#e2e-testing-with-playwright)
4. [Test Structure](#test-structure)
5. [Running Tests](#running-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

## Testing Setup

### Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Chrome, Firefox, and Safari browsers (for Playwright)

### Installation

All testing dependencies are already installed. The setup includes:

- **Vitest**: Unit testing framework
- **Playwright**: E2E testing framework
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM testing
- **@testing-library/user-event**: User interaction simulation

### Configuration Files

- `vitest.config.ts`: Vitest configuration
- `playwright.config.ts`: Playwright configuration
- `src/test/setup.ts`: Test setup and global configurations
- `src/test/utils.ts`: Test utilities and helpers

## Unit Testing with Vitest

### Test Structure

Unit tests are organized in the `src/` directory alongside the code they test:

```
src/
├── lib/
│   ├── validation/
│   │   ├── auth.validation.ts
│   │   └── __tests__/
│   │       └── auth.validation.test.ts
├── components/
│   ├── ClientSelect.tsx
│   └── __tests__/
│       └── ClientSelect.test.tsx
└── test/
    ├── setup.ts
    └── utils.ts
```

### Writing Unit Tests

#### Example: Validation Function Test

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/lib/validation/auth.validation';

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });
});
```

#### Example: React Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClientSelect } from '@/components/ClientSelect';

describe('ClientSelect Component', () => {
  it('should render with default props', () => {
    render(<ClientSelect />);
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });
});
```

### Test Utilities

Use the provided test utilities in `src/test/utils.ts`:

```typescript
import { testData, mockApiResponses, setupTestEnvironment } from '@/test/utils';

describe('AuthService', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('should register user successfully', () => {
    const mockResponse = mockApiResponses.success(testData.user);
    // Test implementation
  });
});
```

## E2E Testing with Playwright

### Test Structure

E2E tests are located in the `tests/e2e/` directory:

```
tests/
└── e2e/
    ├── auth.spec.ts
    └── general.spec.ts
```

### Writing E2E Tests

#### Example: Authentication Flow Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText('Logowanie');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
```

### Browser Support

Playwright is configured to test on:
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Test Structure

### Unit Tests

- **Location**: `src/**/__tests__/*.test.ts`
- **Naming**: `*.test.ts` or `*.spec.ts`
- **Coverage**: Functions, components, utilities, services

### E2E Tests

- **Location**: `tests/e2e/*.spec.ts`
- **Naming**: `*.spec.ts`
- **Coverage**: User flows, page interactions, form submissions

### Test Categories

1. **Unit Tests**
   - Validation functions
   - Utility functions
   - React components
   - Service classes
   - API handlers

2. **Integration Tests**
   - API endpoints
   - Database operations
   - Authentication flows

3. **E2E Tests**
   - User registration/login
   - Form submissions
   - Navigation flows
   - Responsive design

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run e2e tests in headed mode
npm run test:e2e:headed

# Run specific test file
npx playwright test auth.spec.ts
```

### All Tests

```bash
# Run both unit and e2e tests
npm run test:all
```

## CI/CD Integration

### GitHub Actions

The project includes a comprehensive CI/CD pipeline (`.github/workflows/ci-cd.yml`):

1. **Test Job**: Runs unit tests and type checking
2. **E2E Tests Job**: Runs Playwright tests
3. **Build Job**: Builds the application
4. **Deploy Job**: Deploys to DigitalOcean (main branch only)
5. **Security Scan Job**: Runs security audits

### Pipeline Stages

1. **Checkout**: Get the latest code
2. **Setup**: Install Node.js and dependencies
3. **Test**: Run unit tests with coverage
4. **E2E**: Run Playwright tests
5. **Build**: Build the application
6. **Deploy**: Deploy to production (main branch)

## Best Practices

### Unit Testing

1. **Test Structure**: Use `describe` blocks to group related tests
2. **Test Names**: Use descriptive test names that explain the expected behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Mocking**: Mock external dependencies and APIs
5. **Coverage**: Aim for high test coverage (>80%)

### E2E Testing

1. **Page Object Pattern**: Consider using page objects for complex pages
2. **Test Data**: Use consistent test data and cleanup
3. **Wait Strategies**: Use proper waiting strategies instead of fixed delays
4. **Selectors**: Use stable, semantic selectors
5. **Parallel Execution**: Run tests in parallel when possible

### General

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Clean up after each test
3. **Error Handling**: Test both success and error scenarios
4. **Performance**: Keep tests fast and efficient
5. **Documentation**: Document complex test scenarios

### Test Data Management

1. **Factories**: Use test data factories for consistent data
2. **Fixtures**: Use fixtures for complex test data
3. **Cleanup**: Always clean up test data
4. **Isolation**: Ensure tests don't interfere with each other

### Debugging

1. **Console Logs**: Use `console.log` for debugging
2. **Playwright Inspector**: Use `npx playwright test --debug` for e2e debugging
3. **Vitest UI**: Use `npm run test:ui` for interactive unit testing
4. **Coverage Reports**: Check coverage reports for untested code

## Troubleshooting

### Common Issues

1. **Hydration Mismatches**: Use `isMounted` state for client-only components
2. **Async Operations**: Use proper waiting strategies in e2e tests
3. **Environment Variables**: Ensure test environment variables are set
4. **Browser Installation**: Run `npx playwright install` if browsers are missing

### Performance Issues

1. **Slow Tests**: Optimize test data and reduce unnecessary operations
2. **Memory Leaks**: Ensure proper cleanup in tests
3. **Parallel Execution**: Use parallel execution for independent tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
