import { test, expect } from '@playwright/test';

test.describe('Basic E2E Test Configuration', () => {
  test('should load a simple page', async ({ page }) => {
    // Test with a simple external page first
    await page.goto('https://example.com');
    await expect(page.locator('h1')).toContainText('Example Domain');
  });

  test('should have proper test environment', async ({ page }) => {
    // Test that we can access the test environment
    await page.goto('https://example.com');
    
    // Check if page loads
    await expect(page).toHaveTitle(/Example Domain/);
    
    // Test basic Playwright functionality
    const title = await page.title();
    expect(title).toContain('Example Domain');
  });
});
