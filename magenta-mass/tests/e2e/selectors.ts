// Test selectors for E2E tests
// Centralized selectors to make tests more maintainable

export const SELECTORS = {
  // Authentication
  auth: {
    loginForm: '#loginForm',
    registerForm: '#registerForm',
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    fireDepartmentIdInput: 'input[name="fireDepartmentId"]',
    firstNameInput: 'input[name="firstName"]',
    lastNameInput: 'input[name="lastName"]',
    submitButton: 'button[type="submit"]',
    loginButton: '#submitBtn',
    registerButton: '#submitBtn',
    messageContainer: '#message',
    loginLink: 'a[href="/login"]',
    registerLink: 'a[href="/register"]',
    backToHomeLink: 'a[href="/"]'
  },

  // Navigation
  navigation: {
    header: 'header',
    footer: 'footer',
    nav: 'nav',
    homeLink: 'a[href="/"]',
    dashboardLink: 'a[href="/dashboard"]',
    meldunkiLink: 'a[href="/meldunki"]',
    privacyLink: 'a[href="/privacy"]',
    termsLink: 'a[href="/terms"]'
  },

  // Dashboard
  dashboard: {
    pageTitle: 'h1',
    newMeldunekButton: 'a[href="/dashboard"]',
    statsContainer: '.grid.grid-cols-1.md\\:grid-cols-4',
    totalMeldunki: '#totalMeldunki',
    thisMonth: '#thisMonth',
    thisWeek: '#thisWeek',
    thisYear: '#thisYear'
  },

  // Meldunki
  meldunki: {
    pageTitle: 'h1',
    searchInput: '#searchInput',
    dateFromInput: '#dateFrom',
    dateToInput: '#dateTo',
    sortSelect: '#sortSelect',
    meldunkiList: '#meldunkiList',
    meldunekCard: '.hover\\:shadow-md.transition-shadow.cursor-pointer',
    meldunekTitle: 'h3.text-lg.font-semibold',
    meldunekDate: 'p.text-sm.text-muted-foreground',
    meldunekDescription: 'p.text-muted-foreground.mb-4',
    viewButton: 'button:has-text("Zobacz")',
    editButton: 'button:has-text("Edytuj")',
    newMeldunekButton: 'a[href="/dashboard"]'
  },

  // Forms
  forms: {
    card: '.w-full.max-w-md',
    cardHeader: '.text-center',
    cardTitle: 'h2.text-2xl',
    cardDescription: 'p.text-muted-foreground',
    formField: '.space-y-2',
    label: 'label',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    button: 'button',
    submitButton: 'button[type="submit"]',
    cancelButton: 'button[type="button"]'
  },

  // UI Components
  ui: {
    card: '[data-testid="card"]',
    button: '[data-testid="button"]',
    input: '[data-testid="input"]',
    select: '[data-testid="select"]',
    badge: '[data-testid="badge"]',
    alert: '[data-testid="alert"]',
    modal: '[data-testid="modal"]',
    loadingSpinner: '[data-testid="loading"]',
    errorMessage: '[data-testid="error"]',
    successMessage: '[data-testid="success"]'
  },

  // Messages and Alerts
  messages: {
    success: '.success',
    error: '.error',
    info: '.info',
    warning: '.warning',
    messageContainer: '#message',
    alertContainer: '[role="alert"]',
    toastContainer: '[data-testid="toast"]'
  },

  // Loading States
  loading: {
    spinner: '.animate-spin',
    loadingText: 'text=Ładowanie',
    skeleton: '.animate-pulse',
    disabledButton: 'button:disabled'
  },

  // Validation
  validation: {
    errorMessage: '.text-red-500',
    fieldError: '.text-sm.text-red-500',
    requiredField: '[required]',
    invalidField: ':invalid',
    validField: ':valid'
  },

  // Responsive
  responsive: {
    mobileMenu: '[data-testid="mobile-menu"]',
    desktopMenu: '[data-testid="desktop-menu"]',
    hamburgerButton: '[data-testid="hamburger"]',
    closeButton: '[data-testid="close"]'
  }
};

// Test data attributes for better element identification
export const TEST_IDS = {
  // Authentication
  LOGIN_FORM: 'login-form',
  REGISTER_FORM: 'register-form',
  EMAIL_INPUT: 'email-input',
  PASSWORD_INPUT: 'password-input',
  SUBMIT_BUTTON: 'submit-button',
  
  // Navigation
  HEADER: 'header',
  FOOTER: 'footer',
  NAVIGATION: 'navigation',
  
  // Dashboard
  DASHBOARD: 'dashboard',
  STATS_CONTAINER: 'stats-container',
  NEW_MELDUNEK_BUTTON: 'new-meldunek-button',
  
  // Meldunki
  MELDUNKI_LIST: 'meldunki-list',
  MELDUNEK_CARD: 'meldunek-card',
  SEARCH_INPUT: 'search-input',
  FILTER_CONTAINER: 'filter-container',
  
  // Forms
  FORM_CARD: 'form-card',
  FORM_FIELD: 'form-field',
  FORM_BUTTON: 'form-button',
  
  // Messages
  SUCCESS_MESSAGE: 'success-message',
  ERROR_MESSAGE: 'error-message',
  LOADING_MESSAGE: 'loading-message'
};

// Helper functions for common test operations
export const TEST_HELPERS = {
  // Wait for element to be visible
  waitForElement: async (page: any, selector: string, timeout = 5000) => {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  },

  // Wait for element to be hidden
  waitForElementHidden: async (page: any, selector: string, timeout = 5000) => {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
  },

  // Fill form field
  fillField: async (page: any, selector: string, value: string) => {
    await page.fill(selector, value);
  },

  // Click element
  clickElement: async (page: any, selector: string) => {
    await page.click(selector);
  },

  // Wait for navigation
  waitForNavigation: async (page: any, url: string) => {
    await page.waitForURL(url);
  },

  // Check if element exists
  elementExists: async (page: any, selector: string) => {
    const element = await page.locator(selector);
    return await element.count() > 0;
  },

  // Get element text
  getElementText: async (page: any, selector: string) => {
    const element = await page.locator(selector);
    return await element.textContent();
  },

  // Check if element is visible
  isElementVisible: async (page: any, selector: string) => {
    const element = await page.locator(selector);
    return await element.isVisible();
  }
};
