import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Meldunki/);
    
    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to login
    await page.click('text=Logowanie');
    await expect(page).toHaveURL('/login');
    
    await page.goBack();
    
    // Test navigation to register
    await page.click('text=Rejestracja');
    await expect(page).toHaveURL('/register');
  });

  test('should display footer correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if footer is present
    await expect(page.locator('footer')).toBeVisible();
    
    // Check for footer links
    await expect(page.locator('text=Polityka prywatności')).toBeVisible();
    await expect(page.locator('text=Regulamin')).toBeVisible();
  });
});

test.describe('Form Interactions', () => {
  test('should handle form input correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in email field
    await page.fill('input[type="email"]', 'test@example.com');
    await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
    
    // Fill in password field
    await page.fill('input[type="password"]', 'password123');
    await expect(page.locator('input[type="password"]')).toHaveValue('password123');
  });

  test('should handle select dropdowns', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Check if select elements are present
    const shiftSelect = page.locator('select[name="shift"]');
    const statusSelect = page.locator('select[name="status"]');
    
    await expect(shiftSelect).toBeVisible();
    await expect(statusSelect).toBeVisible();
    
    // Test selecting options
    await shiftSelect.selectOption('day');
    await expect(shiftSelect).toHaveValue('day');
    
    await statusSelect.selectOption('present');
    await expect(statusSelect).toHaveValue('present');
  });
});

test.describe('Error Handling', () => {
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
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1 heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check for form labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Check for associated labels
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    
    if (await emailLabel.count() > 0) {
      await expect(emailLabel).toBeVisible();
    }
    if (await passwordLabel.count() > 0) {
      await expect(passwordLabel).toBeVisible();
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    await page.goto('/login');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    
    // Check if button has proper text or aria-label
    const buttonText = await submitButton.textContent();
    const ariaLabel = await submitButton.getAttribute('aria-label');
    
    expect(buttonText || ariaLabel).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    // Check for charset meta tag
    const charset = page.locator('meta[charset]');
    await expect(charset).toBeVisible();
  });
});
