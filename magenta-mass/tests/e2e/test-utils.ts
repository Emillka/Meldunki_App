import type { Page } from '@playwright/test';
import { TEST_CREDENTIALS } from '../../src/lib/db/test-supabase';
import { SELECTORS, TEST_HELPERS } from './selectors';

export class E2ETestUtils {
  constructor(private page: Page) {}

  /**
   * Login with test credentials
   */
  async login(email: string = TEST_CREDENTIALS.user.email, password: string = TEST_CREDENTIALS.user.password) {
    await this.page.goto('/login');
    await TEST_HELPERS.waitForElement(this.page, SELECTORS.auth.loginForm);
    
    await TEST_HELPERS.fillField(this.page, SELECTORS.auth.emailInput, email);
    await TEST_HELPERS.fillField(this.page, SELECTORS.auth.passwordInput, password);
    await TEST_HELPERS.clickElement(this.page, SELECTORS.auth.loginButton);
    
    // Wait for success message
    await TEST_HELPERS.waitForElement(this.page, SELECTORS.messages.success);
    
    // Verify login was successful
    const accessToken = await this.page.evaluate(() => localStorage.getItem('access_token'));
    if (!accessToken) {
      throw new Error('Login failed - no access token found');
    }
  }

  /**
   * Register new test user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    fireDepartmentId?: string;
  }) {
    await this.page.goto('/register');
    await TEST_HELPERS.waitForElement(this.page, SELECTORS.auth.registerForm);
    
    await TEST_HELPERS.fillField(this.page, SELECTORS.auth.emailInput, userData.email);
    await TEST_HELPERS.fillField(this.page, SELECTORS.auth.passwordInput, userData.password);
    
    if (userData.firstName) {
      await TEST_HELPERS.fillField(this.page, SELECTORS.auth.firstNameInput, userData.firstName);
    }
    
    if (userData.lastName) {
      await TEST_HELPERS.fillField(this.page, SELECTORS.auth.lastNameInput, userData.lastName);
    }
    
    await TEST_HELPERS.fillField(
      this.page, 
      SELECTORS.auth.fireDepartmentIdInput, 
      userData.fireDepartmentId || TEST_CREDENTIALS.user.fireDepartmentId
    );
    
    await TEST_HELPERS.clickElement(this.page, SELECTORS.auth.registerButton);
    
    // Wait for success message
    await TEST_HELPERS.waitForElement(this.page, SELECTORS.messages.success);
    
    // Verify registration was successful
    const accessToken = await this.page.evaluate(() => localStorage.getItem('access_token'));
    if (!accessToken) {
      throw new Error('Registration failed - no access token found');
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });
    await this.page.context().clearCookies();
  }

  /**
   * Clear all authentication data
   */
  async clearAuth() {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`;
      await TEST_HELPERS.fillField(this.page, selector, value);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('access_token'));
    return !!token;
  }

  /**
   * Navigate to page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for element and click it
   */
  async waitAndClick(selector: string) {
    await TEST_HELPERS.waitForElement(this.page, selector);
    await TEST_HELPERS.clickElement(this.page, selector);
  }

  /**
   * Wait for element and fill it
   */
  async waitAndFill(selector: string, value: string) {
    await TEST_HELPERS.waitForElement(this.page, selector);
    await TEST_HELPERS.fillField(this.page, selector, value);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await TEST_HELPERS.isElementVisible(this.page, selector);
  }

  /**
   * Get element text
   */
  async getText(selector: string): Promise<string | null> {
    return await TEST_HELPERS.getElementText(this.page, selector);
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(url: string | RegExp) {
    await this.page.waitForURL(url);
  }

  /**
   * Simulate mobile viewport
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Simulate tablet viewport
   */
  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  /**
   * Simulate desktop viewport
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Wait for network request to complete
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mock API response
   */
  async mockAPIResponse(url: string, response: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Check for console errors
   */
  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    return errors;
  }

  /**
   * Wait for specific text to appear
   */
  async waitForText(text: string, timeout = 5000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /**
   * Wait for specific text to disappear
   */
  async waitForTextToDisappear(text: string, timeout = 5000) {
    await this.page.waitForSelector(`text=${text}`, { state: 'hidden', timeout });
  }
}
