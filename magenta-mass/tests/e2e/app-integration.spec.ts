import { test, expect } from '@playwright/test';

test.describe('Meldunki App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('should load home page correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Meldunki/);
    
    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/login');
    
    // Check if login form elements are present
    await expect(page.locator('h1')).toContainText('Logowanie');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display registration page correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/register');
    
    // Check if registration form elements are present
    await expect(page.locator('h1')).toContainText('Rejestracja');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="fireDepartmentId"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('http://localhost:4321/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Wait a moment for validation to appear
    await page.waitForTimeout(1000);
    
    // Check for validation errors (these might be browser validation)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check if inputs are required
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('http://localhost:4321/login');
    
    // Click on register link
    await page.click('text=Zarejestruj się');
    await expect(page).toHaveURL('/register');
    
    // Click on login link
    await page.click('text=Zaloguj się');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing dashboard without authentication', async ({ page }) => {
    await page.goto('http://localhost:4321/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should display meldunki page correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/meldunki');
    
    // Check if meldunki form elements are present
    await expect(page.locator('h1')).toContainText('Meldunki');
    
    // Check for form fields
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('select[name="shift"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:4321/');
    
    // Check if page loads correctly on mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Test navigation on mobile
    await page.goto('http://localhost:4321/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('http://localhost:4321/');
    
    // Check if page loads correctly on tablet
    await expect(page.locator('h1')).toBeVisible();
  });
});
