# E2E Testing Setup - Meldunki App

## Overview

This document describes the E2E (End-to-End) testing setup for the Meldunki App, including configuration for a dedicated test database and comprehensive test scenarios.

## Test Database Configuration

### Test Environment Setup

The E2E tests use a dedicated Supabase test database to ensure isolation from production data. The configuration is managed through:

- `test.env.example` - Template for test environment variables
- `src/lib/db/test-supabase.ts` - Test database client configuration
- `tests/e2e/global-setup.ts` - Global test setup
- `tests/e2e/global-teardown.ts` - Global test cleanup

### Test Database Features

- **Isolated Environment**: Separate from production database
- **Automatic Setup/Teardown**: Test data is created and cleaned up automatically
- **Test User Management**: Predefined test users with known credentials
- **Sample Data**: Test meldunki and fire department data

## Test Structure

### Test Files

1. **`e2e-comprehensive.spec.ts`** - Main E2E test suite
2. **`auth.spec.ts`** - Authentication-specific tests
3. **`general.spec.ts`** - General functionality tests
4. **`selectors.ts`** - Centralized element selectors
5. **`test-utils.ts`** - Test utility functions

### Test Categories

#### Authentication Flow
- User registration with validation
- User login with validation
- Form validation errors
- Navigation between auth pages

#### Dashboard Access
- Authentication required pages
- Redirect behavior for unauthenticated users
- Dashboard functionality after login

#### Meldunki Management
- Meldunki page display
- Search and filtering functionality
- Statistics display
- Form interactions

#### Navigation & Responsive Design
- Cross-page navigation
- Mobile device compatibility
- Tablet device compatibility
- Desktop responsiveness

#### Error Handling
- 404 page handling
- Network error handling
- Form validation errors
- Edge case scenarios

## Test Selectors

### Centralized Selector Management

All test selectors are centralized in `selectors.ts` for maintainability:

```typescript
export const SELECTORS = {
  auth: {
    loginForm: '#loginForm',
    registerForm: '#registerForm',
    emailInput: 'input[name="email"]',
    // ... more selectors
  },
  // ... other categories
};
```

### Test Data Attributes

For better element identification, test data attributes are used:

```typescript
export const TEST_IDS = {
  LOGIN_FORM: 'login-form',
  REGISTER_FORM: 'register-form',
  // ... more test IDs
};
```

## Test Utilities

### E2ETestUtils Class

The `E2ETestUtils` class provides common test operations:

- `login()` - Authenticate with test credentials
- `register()` - Register new test user
- `logout()` - Clear authentication
- `waitForPageLoad()` - Wait for page to be ready
- `takeScreenshot()` - Capture screenshots for debugging
- `fillForm()` - Fill forms with data
- `navigateTo()` - Navigate and wait for load

### Helper Functions

Additional helper functions in `selectors.ts`:

- `waitForElement()` - Wait for element visibility
- `fillField()` - Fill form fields
- `clickElement()` - Click elements
- `waitForNavigation()` - Wait for URL changes

## Running Tests

### Prerequisites

1. **Test Database Setup**: Create a dedicated Supabase project for testing
2. **Environment Configuration**: Copy `test.env.example` to `.env.test` and fill in your test database credentials
3. **Dependencies**: Install required packages with `npm install`

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/e2e-comprehensive.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

### Test Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Global Setup/Teardown**: Automatic test data management
- **Multiple Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Test Environment**: Dedicated test database configuration
- **Screenshots**: Automatic screenshot capture on failures
- **Traces**: Detailed trace information for debugging

## Test Data Management

### Test Users

Predefined test users with known credentials:

```typescript
export const TEST_CREDENTIALS = {
  user: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    fireDepartmentId: '550e8400-e29b-41d4-a716-446655440000'
  },
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!'
  }
};
```

### Sample Data

Test data includes:

- **Fire Department**: Test OSP with known ID
- **Sample Meldunki**: Predefined test meldunki for testing
- **User Profiles**: Test user profiles with different roles

### Automatic Cleanup

Tests automatically:

1. **Setup**: Create necessary test data before running
2. **Cleanup**: Remove test data after completion
3. **Isolation**: Ensure tests don't interfere with each other

## Best Practices

### Test Writing

1. **Use Centralized Selectors**: Always use selectors from `selectors.ts`
2. **Leverage Test Utils**: Use `E2ETestUtils` for common operations
3. **Clear State**: Clear authentication and cookies between tests
4. **Wait for Elements**: Always wait for elements to be visible before interacting
5. **Take Screenshots**: Use screenshots for debugging failed tests

### Maintenance

1. **Update Selectors**: Keep selectors in sync with UI changes
2. **Test Data**: Maintain test data consistency
3. **Environment**: Keep test environment variables up to date
4. **Documentation**: Update this README when adding new test scenarios

## Troubleshooting

### Common Issues

1. **Test Database Connection**: Verify test database credentials in environment variables
2. **Element Not Found**: Check if selectors are still valid after UI changes
3. **Authentication Issues**: Ensure test users exist in test database
4. **Timeout Errors**: Increase timeout values for slow operations

### Debugging

1. **Screenshots**: Check `test-results/screenshots/` for visual debugging
2. **Traces**: Use `npx playwright show-trace` to analyze test execution
3. **Console Logs**: Check browser console for JavaScript errors
4. **Network Tab**: Monitor network requests for API issues

## Future Enhancements

### Planned Improvements

1. **API Testing**: Add API endpoint testing alongside UI tests
2. **Performance Testing**: Add performance benchmarks
3. **Accessibility Testing**: Include accessibility checks
4. **Cross-Browser Testing**: Expand browser coverage
5. **CI/CD Integration**: Automated test execution in CI pipeline

### Test Scenarios to Add

1. **User Management**: Admin user management functionality
2. **Meldunki CRUD**: Complete meldunki creation, editing, deletion
3. **File Uploads**: Test file upload functionality
4. **Real-time Features**: Test real-time updates if implemented
5. **Offline Functionality**: Test offline capabilities

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use centralized selectors and utilities
3. Add appropriate test data
4. Update this documentation
5. Ensure tests are isolated and don't interfere with others

## Support

For questions or issues with E2E testing:

1. Check this documentation
2. Review test logs and screenshots
3. Verify test database configuration
4. Check Playwright documentation for advanced features
