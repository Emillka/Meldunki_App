import { test, expect } from '@playwright/test';
import { SELECTORS, TEST_HELPERS } from './selectors';
import { TEST_CREDENTIALS, testSupabaseClient } from '../../src/lib/db/test-supabase';

test.describe('E2E Authentication Flow with Test Database', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Wait for registration form to be visible
    await TEST_HELPERS.waitForElement(page, SELECTORS.auth.registerForm);
    
    // Fill registration form
    await TEST_HELPERS.fillField(page, SELECTORS.auth.emailInput, TEST_CREDENTIALS.user.email);
    await TEST_HELPERS.fillField(page, SELECTORS.auth.passwordInput, TEST_CREDENTIALS.user.password);
    await TEST_HELPERS.fillField(page, SELECTORS.auth.firstNameInput, 'Test');
    await TEST_HELPERS.fillField(page, SELECTORS.auth.lastNameInput, 'User');
    await TEST_HELPERS.fillField(page, SELECTORS.auth.fireDepartmentIdInput, TEST_CREDENTIALS.user.fireDepartmentId);
    
    // Submit form
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.registerButton);
    
    // Wait for success message
    await TEST_HELPERS.waitForElement(page, SELECTORS.messages.success);
    
    // Check if redirected to home page
    await TEST_HELPERS.waitForNavigation(page, '/');
    
    // Verify user is logged in by checking localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(accessToken).toBeTruthy();
  });

  test('should login existing user successfully', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for login form to be visible
    await TEST_HELPERS.waitForElement(page, SELECTORS.auth.loginForm);
    
    // Fill login form
    await TEST_HELPERS.fillField(page, SELECTORS.auth.emailInput, TEST_CREDENTIALS.user.email);
    await TEST_HELPERS.fillField(page, SELECTORS.auth.passwordInput, TEST_CREDENTIALS.user.password);
    
    // Submit form
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.loginButton);
    
    // Wait for success message
    await TEST_HELPERS.waitForElement(page, SELECTORS.messages.success);
    
    // Check if redirected to home page
    await TEST_HELPERS.waitForNavigation(page, '/');
    
    // Verify user is logged in
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(accessToken).toBeTruthy();
  });

  test('should show validation errors for invalid registration data', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.registerButton);
    
    // Check for validation errors
    await expect(page.locator(SELECTORS.validation.errorMessage)).toBeVisible();
    
    // Fill invalid email
    await TEST_HELPERS.fillField(page, SELECTORS.auth.emailInput, 'invalid-email');
    await TEST_HELPERS.fillField(page, SELECTORS.auth.passwordInput, 'weak');
    
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.registerButton);
    
    // Check for specific validation errors
    await expect(page.locator('text=Nieprawidłowy format email')).toBeVisible();
    await expect(page.locator('text=Hasło musi mieć co najmniej 8 znaków')).toBeVisible();
  });

  test('should show validation errors for invalid login data', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.loginButton);
    
    // Check for validation errors
    await expect(page.locator(SELECTORS.validation.errorMessage)).toBeVisible();
    
    // Fill invalid credentials
    await TEST_HELPERS.fillField(page, SELECTORS.auth.emailInput, 'nonexistent@example.com');
    await TEST_HELPERS.fillField(page, SELECTORS.auth.passwordInput, 'wrongpassword');
    
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.loginButton);
    
    // Check for error message
    await expect(page.locator(SELECTORS.messages.error)).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login');
    
    // Click on register link
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.registerLink);
    await expect(page).toHaveURL('/register');
    
    // Click on login link
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.loginLink);
    await expect(page).toHaveURL('/login');
  });
});

test.describe('E2E Dashboard Access with Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect to login when accessing dashboard without authentication', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should access dashboard after successful login', async ({ page }) => {
    // First login
    await page.goto('/login');
    await TEST_HELPERS.fillField(page, SELECTORS.auth.emailInput, TEST_CREDENTIALS.user.email);
    await TEST_HELPERS.fillField(page, SELECTORS.auth.passwordInput, TEST_CREDENTIALS.user.password);
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.loginButton);
    
    // Wait for login success
    await TEST_HELPERS.waitForElement(page, SELECTORS.messages.success);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should be able to access dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(SELECTORS.dashboard.pageTitle)).toBeVisible();
  });
});

test.describe('E2E Meldunki Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Login before each test
    await page.goto('/login');
    await TEST_HELPERS.fillField(page, SELECTORS.auth.emailInput, TEST_CREDENTIALS.user.email);
    await TEST_HELPERS.fillField(page, SELECTORS.auth.passwordInput, TEST_CREDENTIALS.user.password);
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.loginButton);
    await TEST_HELPERS.waitForElement(page, SELECTORS.messages.success);
  });

  test('should display meldunki page correctly', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Check if page loads correctly
    await expect(page.locator(SELECTORS.meldunki.pageTitle)).toContainText('Meldunki');
    
    // Check for main elements
    await expect(page.locator(SELECTORS.meldunki.searchInput)).toBeVisible();
    await expect(page.locator(SELECTORS.meldunki.dateFromInput)).toBeVisible();
    await expect(page.locator(SELECTORS.meldunki.dateToInput)).toBeVisible();
    await expect(page.locator(SELECTORS.meldunki.sortSelect)).toBeVisible();
    await expect(page.locator(SELECTORS.meldunki.newMeldunekButton)).toBeVisible();
  });

  test('should display stats correctly', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Check if stats are displayed
    await expect(page.locator(SELECTORS.meldunki.totalMeldunki)).toBeVisible();
    await expect(page.locator(SELECTORS.meldunki.thisMonth)).toBeVisible();
    await expect(page.locator(SELECTORS.meldunki.thisWeek)).toBeVisible();
    await expect(page.locator(SELECTORS.meldunki.thisYear)).toBeVisible();
    
    // Check if stats show numbers
    const totalMeldunki = await TEST_HELPERS.getElementText(page, SELECTORS.meldunki.totalMeldunki);
    expect(totalMeldunki).toMatch(/^\d+$/);
  });

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Wait for page to load
    await TEST_HELPERS.waitForElement(page, SELECTORS.meldunki.searchInput);
    
    // Test search input
    await TEST_HELPERS.fillField(page, SELECTORS.meldunki.searchInput, 'test');
    
    // Check if search input has the value
    const searchValue = await page.inputValue(SELECTORS.meldunki.searchInput);
    expect(searchValue).toBe('test');
  });

  test('should handle date filtering', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Wait for page to load
    await TEST_HELPERS.waitForElement(page, SELECTORS.meldunki.dateFromInput);
    
    // Test date inputs
    await TEST_HELPERS.fillField(page, SELECTORS.meldunki.dateFromInput, '2024-01-01');
    await TEST_HELPERS.fillField(page, SELECTORS.meldunki.dateToInput, '2024-12-31');
    
    // Check if date inputs have the values
    const dateFromValue = await page.inputValue(SELECTORS.meldunki.dateFromInput);
    const dateToValue = await page.inputValue(SELECTORS.meldunki.dateToInput);
    
    expect(dateFromValue).toBe('2024-01-01');
    expect(dateToValue).toBe('2024-12-31');
  });
});

test.describe('E2E Navigation and Responsive Design', () => {
  test('should navigate to all main pages', async ({ page }) => {
    // Test home page
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test login page
    await page.goto('/login');
    await expect(page.locator(SELECTORS.auth.loginForm)).toBeVisible();
    
    // Test register page
    await page.goto('/register');
    await expect(page.locator(SELECTORS.auth.registerForm)).toBeVisible();
    
    // Test privacy page
    await page.goto('/privacy');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test terms page
    await page.goto('/terms');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if page loads correctly on mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Test navigation on mobile
    await page.goto('/login');
    await expect(page.locator(SELECTORS.auth.emailInput)).toBeVisible();
    await expect(page.locator(SELECTORS.auth.passwordInput)).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Check if page loads correctly on tablet
    await expect(page.locator('h1')).toBeVisible();
    
    // Test form elements on tablet
    await page.goto('/register');
    await expect(page.locator(SELECTORS.auth.registerForm)).toBeVisible();
  });
});

test.describe('E2E Error Handling and Edge Cases', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/*', route => route.abort());
    
    await page.goto('/');
    
    // Page should still load (cached or fallback)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle form submission errors', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form with invalid data
    await TEST_HELPERS.fillField(page, SELECTORS.auth.emailInput, 'invalid@email');
    await TEST_HELPERS.fillField(page, SELECTORS.auth.passwordInput, '123');
    
    // Submit form
    await TEST_HELPERS.clickElement(page, SELECTORS.auth.loginButton);
    
    // Should show error message
    await expect(page.locator(SELECTORS.messages.error)).toBeVisible();
  });
});
