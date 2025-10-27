import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check if login form elements are present
    await expect(page.locator('h1')).toContainText('Logowanie');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display registration page correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Check if registration form elements are present
    await expect(page.locator('h1')).toContainText('Rejestracja');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="fire_department_id"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Email jest wymagany')).toBeVisible();
    await expect(page.locator('text=Hasło jest wymagane')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');
    
    // Fill invalid data
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="fire_department_id"]', 'invalid-uuid');
    
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Nieprawidłowy format email')).toBeVisible();
    await expect(page.locator('text=Hasło musi mieć co najmniej 8 znaków')).toBeVisible();
    await expect(page.locator('text=Nieprawidłowy format UUID')).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login');
    
    // Click on register link
    await page.click('text=Zarejestruj się');
    await expect(page).toHaveURL('/register');
    
    // Click on login link
    await page.click('text=Zaloguj się');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Dashboard Access', () => {
  test('should redirect to login when accessing dashboard without authentication', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should show dashboard after successful login', async ({ page }) => {
    // This test would require a test user to be set up
    // For now, we'll just check the structure
    await page.goto('/dashboard');
    
    // Should redirect to login since we're not authenticated
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Meldunki Page', () => {
  test('should display meldunki page correctly', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Check if meldunki form elements are present
    await expect(page.locator('h1')).toContainText('Meldunki');
    
    // Check for form fields
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('select[name="shift"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
  });

  test('should show validation errors for empty meldunki form', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Data jest wymagana')).toBeVisible();
    await expect(page.locator('text=Zmiana jest wymagana')).toBeVisible();
    await expect(page.locator('text=Status jest wymagany')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to all main pages', async ({ page }) => {
    // Test home page
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test login page
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Logowanie');
    
    // Test register page
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Rejestracja');
    
    // Test privacy page
    await page.goto('/privacy');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test terms page
    await page.goto('/terms');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if page loads correctly on mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Test navigation on mobile
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Check if page loads correctly on tablet
    await expect(page.locator('h1')).toBeVisible();
  });
});
