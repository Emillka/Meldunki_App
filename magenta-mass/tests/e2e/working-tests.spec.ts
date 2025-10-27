import { test, expect } from '@playwright/test';

test.describe('Meldunki App E2E Tests - Working Version', () => {
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

  test('should handle form input correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/login');
    
    // Fill in email field
    await page.fill('input[type="email"]', 'test@example.com');
    await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
    
    // Fill in password field
    await page.fill('input[type="password"]', 'password123');
    await expect(page.locator('input[type="password"]')).toHaveValue('password123');
  });
});
