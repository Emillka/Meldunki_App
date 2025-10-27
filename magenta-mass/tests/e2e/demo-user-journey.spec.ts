import { test, expect } from '@playwright/test';
import { E2ETestUtils } from './test-utils';
import { TEST_CREDENTIALS } from '../../src/lib/db/test-supabase';

test.describe('E2E Demo - Complete User Journey', () => {
  let testUtils: E2ETestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new E2ETestUtils(page);
    await testUtils.clearAuth();
  });

  test('Complete user registration and meldunki management flow', async ({ page }) => {
    // Step 1: Register new user
    await testUtils.register({
      email: 'demo@example.com',
      password: 'DemoPassword123!',
      firstName: 'Demo',
      lastName: 'User',
      fireDepartmentId: TEST_CREDENTIALS.user.fireDepartmentId
    });

    // Step 2: Verify user is logged in
    expect(await testUtils.isAuthenticated()).toBe(true);

    // Step 3: Navigate to meldunki page
    await testUtils.navigateTo('/meldunki');

    // Step 4: Verify meldunki page loads correctly
    await expect(page.locator('h1')).toContainText('Meldunki');
    await expect(page.locator('#searchInput')).toBeVisible();
    await expect(page.locator('#dateFrom')).toBeVisible();
    await expect(page.locator('#dateTo')).toBeVisible();

    // Step 5: Test search functionality
    await testUtils.waitAndFill('#searchInput', 'test');
    const searchValue = await page.inputValue('#searchInput');
    expect(searchValue).toBe('test');

    // Step 6: Test date filtering
    await testUtils.waitAndFill('#dateFrom', '2024-01-01');
    await testUtils.waitAndFill('#dateTo', '2024-12-31');
    
    const dateFromValue = await page.inputValue('#dateFrom');
    const dateToValue = await page.inputValue('#dateTo');
    expect(dateFromValue).toBe('2024-01-01');
    expect(dateToValue).toBe('2024-12-31');

    // Step 7: Verify stats are displayed
    await expect(page.locator('#totalMeldunki')).toBeVisible();
    await expect(page.locator('#thisMonth')).toBeVisible();
    await expect(page.locator('#thisWeek')).toBeVisible();
    await expect(page.locator('#thisYear')).toBeVisible();

    // Step 8: Test responsive design
    await testUtils.setMobileViewport();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#searchInput')).toBeVisible();

    // Step 9: Logout
    await testUtils.logout();
    expect(await testUtils.isAuthenticated()).toBe(false);

    // Step 10: Verify redirect to login when accessing protected page
    await page.goto('/meldunki');
    await expect(page).toHaveURL('/login');
  });

  test('Login flow with existing user', async ({ page }) => {
    // Step 1: Navigate to login page
    await testUtils.navigateTo('/login');

    // Step 2: Fill login form
    await testUtils.waitAndFill('input[name="email"]', TEST_CREDENTIALS.user.email);
    await testUtils.waitAndFill('input[name="password"]', TEST_CREDENTIALS.user.password);

    // Step 3: Submit form
    await testUtils.waitAndClick('button[type="submit"]');

    // Step 4: Wait for success message
    await testUtils.waitForText('✅ Logowanie udane!');

    // Step 5: Verify redirect to home page
    await testUtils.waitForURL('/');

    // Step 6: Verify user is authenticated
    expect(await testUtils.isAuthenticated()).toBe(true);
  });

  test('Form validation errors', async ({ page }) => {
    // Test registration form validation
    await testUtils.navigateTo('/register');

    // Try to submit empty form
    await testUtils.waitAndClick('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('.error')).toBeVisible();

    // Fill invalid data
    await testUtils.waitAndFill('input[name="email"]', 'invalid-email');
    await testUtils.waitAndFill('input[name="password"]', 'weak');

    await testUtils.waitAndClick('button[type="submit"]');

    // Check for specific validation errors
    await expect(page.locator('text=Nieprawidłowy format email')).toBeVisible();
    await expect(page.locator('text=Hasło musi mieć co najmniej 8 znaków')).toBeVisible();
  });

  test('Navigation between pages', async ({ page }) => {
    // Test home page
    await testUtils.navigateTo('/');
    await expect(page.locator('h1')).toBeVisible();

    // Test login page
    await testUtils.navigateTo('/login');
    await expect(page.locator('#loginForm')).toBeVisible();

    // Test register page
    await testUtils.navigateTo('/register');
    await expect(page.locator('#registerForm')).toBeVisible();

    // Test privacy page
    await testUtils.navigateTo('/privacy');
    await expect(page.locator('h1')).toBeVisible();

    // Test terms page
    await testUtils.navigateTo('/terms');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Responsive design on different devices', async ({ page }) => {
    // Test mobile viewport
    await testUtils.setMobileViewport();
    await testUtils.navigateTo('/');
    await expect(page.locator('h1')).toBeVisible();

    await testUtils.navigateTo('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Test tablet viewport
    await testUtils.setTabletViewport();
    await testUtils.navigateTo('/register');
    await expect(page.locator('#registerForm')).toBeVisible();

    // Test desktop viewport
    await testUtils.setDesktopViewport();
    await testUtils.navigateTo('/meldunki');
    await expect(page.locator('h1')).toContainText('Meldunki');
  });
});
