Szczegółowa analiza bazy kodu FireLog
1. Struktura bazy kodu
Główne komponenty i moduły:
Frontend (Astro + React):
src/pages/ - Strony aplikacji (index.astro, login.astro, register.astro, dashboard.astro, meldunki.astro, privacy.astro, terms.astro)
src/components/ - Komponenty UI (Header.astro, Footer.astro, Welcome.astro, ClientSelect.tsx, SimpleSelect.tsx)
src/components/ui/ - Biblioteka komponentów shadcn/ui (button.tsx, card.tsx, input.tsx, select.tsx, toast.tsx, toaster.tsx, itd.)
src/layouts/ - Layouty (Layout.astro, Dashboard.astro)
src/hooks/ - React hooks (use-mobile.tsx, use-toast.ts)
Backend i serwisy:
src/lib/services/ - Serwisy biznesowe (auth.service.ts, meldunki.service.ts)
src/lib/middleware/ - Middleware autoryzacyjny (auth.ts)
src/lib/validation/ - Walidacja danych (auth.validation.ts, meldunki.validation.ts)
src/lib/db/ - Warstwa bazy danych (database.types.ts, supabase.ts, types.ts)
src/lib/utils/ - Narzędzia pomocnicze (rate-limiter.ts, response.ts, utils.ts)
API Endpoints:
src/pages/api/auth/ - Endpointy autoryzacji (register.ts, login.ts, logout.ts, profile.ts, change-password.ts)
src/pages/api/admin/ - Endpointy administracyjne (users.ts, statistics.ts)
src/pages/api/meldunki-simple.ts - Uproszczony endpoint meldunków
Baza danych:
supabase/migrations/ - Migracje bazy danych (20251023120000_initial_schema.sql, 20251023120100_fix_user_creation.sql)
supabase/ - Konfiguracja Supabase (config.toml, seed.sql, create-admin.sql)
Konfiguracja i narzędzia:
vitest.config.ts - Konfiguracja testów
package.json - Zależności i skrypty
astro.config.mjs - Konfiguracja Astro
tailwind.config.mjs - Konfiguracja Tailwind CSS
2. Architektura i przepływ danych
Architektura aplikacji:
Frontend: Astro 5 z React 19 dla komponentów interaktywnych
Backend: Supabase jako Backend-as-a-Service (PostgreSQL + Auth)
Styling: Tailwind CSS 4 + shadcn/ui
Typowanie: TypeScript 5
AI: OpenRouter.ai dla analizy meldunków
Przepływ danych:
Autoryzacja: Supabase Auth → JWT tokens → Middleware auth.ts → Protected routes
Meldunki: Frontend form → API validation → MeldunkiService → Supabase DB → RLS policies
Dane referencyjne: Provinces → Counties → Fire Departments (hierarchia administracyjna)
Kluczowe funkcje wymagające testowania:
AuthService.registerUser() - Rejestracja użytkowników
AuthService.loginUser() - Logowanie użytkowników
MeldunkiService.createMeldunek() - Tworzenie meldunków
validateRegisterRequest() - Walidacja danych rejestracji
validateCreateMeldunekRequest() - Walidacja danych meldunków
authenticateUser() - Middleware autoryzacyjny
3. Obszary ryzyka i krytyczna funkcjonalność
Krytyczne obszary:
Autoryzacja i bezpieczeństwo - JWT tokens, RLS policies, walidacja haseł
Integracja z bazą danych - Supabase client, migracje, RLS
Walidacja danych - Input validation, sanitization, XSS protection
API endpoints - Error handling, rate limiting, response formatting
Komponenty React - State management, form handling, UI interactions
Konkretne przykłady z kodu:
src/lib/services/auth.service.ts:70-177 - Logika rejestracji z walidacją dostępu do jednostki OSP
src/lib/middleware/auth.ts:11-65 - Middleware autoryzacyjny z obsługą tokenów
src/lib/validation/auth.validation.ts:25-80 - Kompleksowa walidacja danych rejestracji
src/pages/api/meldunki-simple.ts:10-108 - Endpoint API z autoryzacją i walidacją
src/components/Header.astro:259-302 - Zarządzanie stanem autoryzacji w komponencie
4. Ocena stosu technologicznego
Dostępne frameworki testowe:
Vitest - Już skonfigurowany, obsługuje TypeScript, coverage, UI mode
@testing-library/react - Dla testów komponentów React
@testing-library/jest-dom - Matchers dla DOM
MSW (Mock Service Worker) - Dla mockowania API calls
Playwright - Dla testów E2E (zalecany dla Astro)
Punkty integracji:
Supabase - Mock client lub test database
OpenRouter.ai - Mock API responses
JWT tokens - Test token generation/validation
LocalStorage - Mock browser storage
Strategie testowania:
Unit tests - Vitest dla logiki biznesowej i walidacji
Integration tests - API endpoints z mock Supabase
Component tests - React Testing Library dla komponentów interaktywnych
E2E tests - Playwright dla pełnych przepływów użytkownika
5. Priorytety testowania
Uszeregowanie według ważności:
KRYTYCZNE (Najwyższy priorytet):
Autoryzacja (rejestracja, logowanie, middleware)
Walidacja danych wejściowych
API endpoints (auth, meldunki)
Bezpieczeństwo (RLS, JWT, sanitization)
WYSOKIE:
Serwisy biznesowe (AuthService, MeldunkiService)
Komponenty React (formularze, UI interactions)
Integracja z bazą danych
ŚREDNIE:
Komponenty Astro (strony, layouty)
Narzędzia pomocnicze (utils, response formatting)
Styling i responsywność
NISKIE:
Dokumentacja i przykłady
Konfiguracja środowiska
Sekwencja implementacji:
Unit tests dla walidacji i serwisów
Integration tests dla API endpoints
Component tests dla React components
E2E tests dla krytycznych przepływów
Performance i security tests
</analiza>
Kompleksowy Plan Testów dla FireLog
1. Przegląd strategii testowania
Cele testowania
Bezpieczeństwo: Zapewnienie bezpiecznej autoryzacji, walidacji danych i ochrony przed atakami
Funkcjonalność: Weryfikacja wszystkich funkcji MVP (rejestracja, logowanie, CRUD meldunków)
Integracja: Testowanie integracji z Supabase, OpenRouter.ai i komponentami UI
Wydajność: Sprawdzenie responsywności aplikacji i optymalizacji ładowania
Dostępność: Zapewnienie zgodności z WCAG i wsparcia dla czytników ekranu
Stabilność: Minimalizacja błędów produkcyjnych przez kompleksowe pokrycie testami
Zakres testowania
Unit tests: Logika biznesowa, walidacja, serwisy, utility functions
Integration tests: API endpoints, integracja z Supabase, middleware
Component tests: React komponenty interaktywne, formularze, UI interactions
E2E tests: Pełne przepływy użytkownika (rejestracja → logowanie → tworzenie meldunków)
Security tests: Autoryzacja, RLS policies, input sanitization, XSS protection
Performance tests: Czas ładowania, optymalizacja Astro, bundle size
Podejście do testowania dla stosu technologicznego
Astro 5: Testowanie SSR, routing, build process
React 19: Component testing z React Testing Library, hooks testing
Supabase: Mock client dla testów jednostkowych, test database dla integracji
TypeScript 5: Type safety testing, interface validation
Tailwind CSS 4: Visual regression testing, responsive design
Vitest: Główny framework testowy z coverage i UI mode
2. Konfiguracja środowiska testowego
Wymagane narzędzia
Kroki instalacji dla Cursor IDE
Instalacja zależności testowych:
```bash
# Podstawowe narzędzia testowe
npm install -D @testing-library/jest-dom @testing-library/user-event @testing-library/react-hooks

# Zaawansowane mockowanie
npm install -D @mswjs/msw @mswjs/data

# Generowanie danych testowych
npm install -D @faker-js/faker

# E2E i dostępność
npm install -D @playwright/test @axe-core/playwright @playwright/experimental-ct-react

# Coverage i wydajność
npm install -D c8 lighthouse-ci
```

Konfiguracja Vitest dla React (zaktualizowana):
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Zmiana z 'node' na 'jsdom' dla React
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'c8', // Zmiana z 'v8' na 'c8' - szybszy
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.*',
        '**/types.ts',
        '**/database.types.ts',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

Setup file dla testów:
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Konfiguracja Playwright (zaktualizowana):
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```
'
Zmienne środowiskowe i skrypty instalacyjne
Dodanie skryptów do package.json:
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:accessibility": "playwright test --grep @accessibility",
    "test:performance": "lighthouse-ci autorun",
    "test:all": "npm run test:run && npm run test:e2e && npm run test:performance"
  }
}
```

Plik .env.test:
```env
# Test environment variables
NODE_ENV=test

SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
ALLOWED_ORIGINS=http://localhost:4321
OPENROUTER_API_KEY=test-api-key
```
3. Plan testów jednostkowych
Kluczowe funkcje/metody do testowania
Walidacja danych (src/lib/validation/):
validateEmail() - Format email RFC 5322
validatePasswordStrength() - Wymagania bezpieczeństwa hasła
validateUUID() - Format UUID v4
validateRegisterRequest() - Kompleksowa walidacja rejestracji
validateCreateMeldunekRequest() - Walidacja danych meldunków
sanitizeString() - Sanityzacja XSS
Serwisy biznesowe (src/lib/services/):
AuthService.registerUser() - Logika rejestracji
AuthService.loginUser() - Logika logowania
MeldunkiService.createMeldunek() - Tworzenie meldunków
MeldunkiService.getMeldunki() - Pobieranie meldunków
Middleware (src/lib/middleware/):
authenticateUser() - Weryfikacja tokenów JWT
authErrorResponse() - Formatowanie błędów autoryzacji
Narzędzia pomocnicze (src/lib/utils/):
createSuccessResponse() - Formatowanie odpowiedzi sukcesu
createErrorResponse() - Formatowanie odpowiedzi błędów
rateLimiter.checkLimit() - Rate limiting
Rekomendowane frameworki testowe
Vitest - Główny framework z globals i coverage (zachować)
@testing-library/jest-dom - Matchers dla DOM assertions (zachować)
@testing-library/user-event - Realistyczne interakcje użytkownika (DODAĆ)
@testing-library/react-hooks - Testowanie custom hooks (DODAĆ)
@mswjs/msw + @mswjs/data - Zaawansowane mockowanie API (ULEPSZYĆ)
@faker-js/faker - Generowanie realistycznych danych testowych (DODAĆ)
@playwright/test + @axe-core/playwright - E2E z testami dostępności (ULEPSZYĆ)
c8 - Szybszy coverage provider niż v8 (ZAMIEŃ)
lighthouse-ci - Automatyczne testy wydajności (DODAĆ)
Lista krytycznych przypadków testowych
Testy walidacji (src/lib/validation/__tests__/):
```typescript
// auth.validation.test.ts - ROZSZERZONE
import { describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { userEvent } from '@testing-library/user-event';
import { 
  validateEmail, 
  validatePasswordStrength, 
  validateUUID,
  validateRegisterRequest,
  sanitizeString
} from '../auth.validation';

describe('validateEmail - Enhanced', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name+tag@example.co.uk',
      faker.internet.email(),
      faker.internet.email({ provider: 'gmail.com' })
    ];
    
    validEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true);
    });
  });
  
  it('should reject edge case emails', () => {
    const invalidEmails = [
      faker.string.alphanumeric(300) + '@example.com', // Too long
      'test@' + faker.string.alphanumeric(300) + '.com', // Domain too long
      faker.string.alphanumeric(10), // Not an email
      'test @example.com', // Space in local part
      'test@example .com' // Space in domain
    ];
    
    invalidEmails.forEach(email => {
      expect(validateEmail(email)).toBe(false);
    });
  });
});

describe('validatePasswordStrength - Enhanced', () => {
  it('should accept passwords with all requirements', () => {
    const strongPasswords = [
      'StrongPass123!',
      faker.internet.password({ length: 12, pattern: /[A-Za-z0-9!@#$%^&*]/ }),
      'MySecure2024#',
      'Test123!@#'
    ];
    
    strongPasswords.forEach(password => {
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  it('should reject weak passwords with specific error messages', () => {
    const weakPasswords = [
      { password: 'weak', expectedError: '8 characters' },
      { password: 'lowercase123!', expectedError: 'uppercase' },
      { password: 'UPPERCASE123!', expectedError: 'lowercase' },
      { password: 'NoNumbersHere!', expectedError: 'number' },
      { password: 'NoSpecial123', expectedError: 'special' }
    ];
    
    weakPasswords.forEach(({ password, expectedError }) => {
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes(expectedError))).toBe(true);
    });
  });
});
```

Testy serwisów (src/lib/services/__tests__/):
```typescript
// auth.service.test.ts - NOWY
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { AuthService } from '../auth.service';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    authService = new AuthService();
  });
  
  describe('registerUser', () => {
    it('should register user with valid data', async () => {
      const userData = {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 12 }),
        fire_department_id: faker.string.uuid(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: 'member' as const
      };
      
      server.use(
        http.post('*/auth/v1/signup', () => {
          return HttpResponse.json({
            user: { id: faker.string.uuid(), email: userData.email },
            session: { access_token: faker.string.alphanumeric(32) }
          });
        })
      );
      
      const result = await authService.registerUser(userData);
      
      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(userData.email);
      expect(result.data.session.access_token).toBeDefined();
    });
    
    it('should handle registration errors', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'weak',
        fire_department_id: 'invalid-uuid'
      };
      
      const result = await authService.registerUser(userData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('loginUser', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: faker.internet.email(),
        password: faker.internet.password()
      };
      
      server.use(
        http.post('*/auth/v1/token', () => {
          return HttpResponse.json({
            user: { id: faker.string.uuid(), email: credentials.email },
            session: { access_token: faker.string.alphanumeric(32) }
          });
        })
      );
      
      const result = await authService.loginUser(credentials);
      
      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(credentials.email);
    });
  });
});
```

Testy komponentów React (src/components/__tests__/):
```typescript
// ClientSelect.test.tsx - NOWY
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faker } from '@faker-js/faker';
import { ClientSelect } from '../ClientSelect';

describe('ClientSelect', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    // Mock fetch dla danych referencyjnych
    global.fetch = vi.fn();
  });
  
  it('should render select with provinces', async () => {
    const mockProvinces = [
      { id: faker.string.uuid(), name: faker.location.state() },
      { id: faker.string.uuid(), name: faker.location.state() }
    ];
    
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockProvinces)
    } as Response);
    
    render(<ClientSelect />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    expect(screen.getByText(mockProvinces[0].name)).toBeInTheDocument();
  });
  
  it('should handle province selection and load counties', async () => {
    const mockProvinces = [
      { id: 'province-1', name: 'Test Province' }
    ];
    const mockCounties = [
      { id: faker.string.uuid(), name: faker.location.county() }
    ];
    
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockProvinces)
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockCounties)
      } as Response);
    
    render(<ClientSelect />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Province')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Test Province'));
    
    await waitFor(() => {
      expect(screen.getByText(mockCounties[0].name)).toBeInTheDocument();
    });
  });
});
```
4. Plan testów integracyjnych
Punkty integracji API lub serwisów
API Endpoints (src/pages/api/):
POST /api/auth/register - Rejestracja użytkownika
POST /api/auth/login - Logowanie użytkownika
GET /api/auth/profile - Pobieranie profilu użytkownika
POST /api/meldunki-simple - Tworzenie meldunków
GET /api/meldunki-simple - Pobieranie meldunków
Integracja z Supabase:
Supabase Auth (rejestracja, logowanie, sesje)
PostgreSQL database (CRUD operations)
Row Level Security (RLS) policies
Real-time subscriptions
Testy integracji z bazą danych:
```typescript
// database.integration.test.ts - NOWY
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

describe('Database Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  
  beforeAll(() => {
    supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });
  
  describe('Fire Departments', () => {
    it('should create and retrieve fire department', async () => {
      const departmentData = {
        name: faker.company.name() + ' OSP',
        province: faker.location.state(),
        county: faker.location.county(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email()
      };
      
      const { data: created, error: createError } = await supabase
        .from('fire_departments')
        .insert(departmentData)
        .select()
        .single();
      
      expect(createError).toBeNull();
      expect(created).toBeDefined();
      expect(created.name).toBe(departmentData.name);
      
      // Cleanup
      await supabase
        .from('fire_departments')
        .delete()
        .eq('id', created.id);
    });
  });
  
  describe('Users', () => {
    it('should create user with proper RLS', async () => {
      const userData = {
        email: faker.internet.email(),
        fire_department_id: faker.string.uuid(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: 'member'
      };
      
      const { data: user, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: faker.internet.password({ length: 12 }),
        user_metadata: userData
      });
      
      expect(error).toBeNull();
      expect(user.user).toBeDefined();
      expect(user.user.email).toBe(userData.email);
      
      // Cleanup
      await supabase.auth.admin.deleteUser(user.user.id);
    });
  });
});
```

Integracje z serwisami zewnętrznymi:
```typescript
// openrouter.integration.test.ts - NOWY
import { describe, it, expect, vi } from 'vitest';
import { faker } from '@faker-js/faker';

describe('OpenRouter AI Integration', () => {
  it('should analyze meldunek text', async () => {
    const meldunekText = faker.lorem.paragraphs(3);
    
    // Mock OpenRouter API response
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            category: 'Pożar',
            summary: 'Interwencja związana z pożarem budynku mieszkalnego',
            severity: 'medium',
            keywords: ['pożar', 'budynek', 'mieszkanie']
          })
        }
      }]
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze this fire department report and extract category, summary, severity, and keywords.'
          },
          {
            role: 'user',
            content: meldunekText
          }
        ]
      })
    });
    
    const data = await response.json();
    
    expect(data.choices[0].message.content).toBeDefined();
    
    const analysis = JSON.parse(data.choices[0].message.content);
    expect(analysis.category).toBeDefined();
    expect(analysis.summary).toBeDefined();
    expect(analysis.severity).toBeDefined();
    expect(Array.isArray(analysis.keywords)).toBe(true);
  });
});
```
5. Plan testów end-to-end
Scenariusze przepływu użytkownika
Krytyczne ścieżki użytkownika:
Rejestracja nowego użytkownika:
Wejście na stronę główną
Kliknięcie "Rozpocznij teraz"
Wypełnienie formularza rejestracji
Wybór województwa → powiatu → jednostki OSP
Weryfikacja walidacji danych
Sukces rejestracji i przekierowanie
Logowanie i zarządzanie meldunkami:
Logowanie z poprawnymi danymi
Przekierowanie do dashboard
Tworzenie nowego meldunku
Edycja istniejącego meldunku
Usuwanie meldunku
Wylogowanie
Przeglądanie i filtrowanie meldunków:
Wyświetlenie listy meldunków
Wyszukiwanie w meldunkach
Filtrowanie według daty
Sortowanie wyników

Testy E2E z Playwright (zaktualizowane):
```typescript
// tests/e2e/user-registration.spec.ts - NOWY
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('User Registration Flow', () => {
  test('should complete full registration process', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill registration form
    const userData = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    };
    
    await page.fill('[data-testid="email-input"]', userData.email);
    await page.fill('[data-testid="password-input"]', userData.password);
    await page.fill('[data-testid="first-name-input"]', userData.firstName);
    await page.fill('[data-testid="last-name-input"]', userData.lastName);
    
    // Select fire department
    await page.click('[data-testid="province-select"]');
    await page.click('[data-testid="province-option-mazowieckie"]');
    
    await page.click('[data-testid="county-select"]');
    await page.click('[data-testid="county-option-warszawa"]');
    
    await page.click('[data-testid="fire-department-select"]');
    await page.click('[data-testid="fire-department-option-1"]');
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(userData.firstName);
  });
  
  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form
    await page.click('[data-testid="register-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="fire-department-error"]')).toBeVisible();
  });
});

// tests/e2e/meldunki-management.spec.ts - NOWY
test.describe('Meldunki Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should create new meldunek', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Click "Add New Meldunek" button
    await page.click('[data-testid="add-meldunek-button"]');
    
    // Fill meldunek form
    const meldunekData = {
      eventName: faker.lorem.words(3),
      location: faker.location.streetAddress(),
      description: faker.lorem.paragraph(),
      commander: faker.person.fullName(),
      driver: faker.person.fullName()
    };
    
    await page.fill('[data-testid="event-name-input"]', meldunekData.eventName);
    await page.fill('[data-testid="location-input"]', meldunekData.location);
    await page.fill('[data-testid="description-textarea"]', meldunekData.description);
    await page.fill('[data-testid="commander-input"]', meldunekData.commander);
    await page.fill('[data-testid="driver-input"]', meldunekData.driver);
    
    // Set dates
    await page.fill('[data-testid="start-date-input"]', '2024-01-15T10:00');
    await page.fill('[data-testid="end-date-input"]', '2024-01-15T12:00');
    
    // Submit form
    await page.click('[data-testid="save-meldunek-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="meldunki-list"]')).toContainText(meldunekData.eventName);
  });
  
  test('should edit existing meldunek', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Click edit button on first meldunek
    await page.click('[data-testid="edit-meldunek-button-0"]');
    
    // Update event name
    const newEventName = faker.lorem.words(3);
    await page.fill('[data-testid="event-name-input"]', newEventName);
    
    // Save changes
    await page.click('[data-testid="save-meldunek-button"]');
    
    // Verify update
    await expect(page.locator('[data-testid="meldunki-list"]')).toContainText(newEventName);
  });
  
  test('should delete meldunek', async ({ page }) => {
    await page.goto('/meldunki');
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="meldunek-item"]').count();
    
    // Click delete button
    await page.click('[data-testid="delete-meldunek-button-0"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify deletion
    const newCount = await page.locator('[data-testid="meldunek-item"]').count();
    expect(newCount).toBe(initialCount - 1);
  });
});

// tests/e2e/accessibility.spec.ts - NOWY
test.describe('Accessibility Tests', () => {
  test('should pass accessibility checks on main pages', async ({ page }) => {
    const pages = ['/', '/login', '/register', '/dashboard', '/meldunki'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Run axe accessibility tests
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });
  
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
  });
});
```
Kompatybilność przeglądarek/platform
Testowane przeglądarki:
Chrome (Desktop, Mobile)
Firefox (Desktop, Mobile)
Safari (Desktop, Mobile)
Edge (Desktop)
Testowane rozdzielczości:
Desktop: 1920x1080, 1366x768
Tablet: 768x1024, 1024x768
Mobile: 375x667, 414x896
6. Implementacja specyficzna dla Cursor
Wykorzystanie funkcji AI Cursor do generowania testów
Generowanie testów za pomocą AI:
Ctrl+K - Generowanie testów dla wybranych funkcji
Cmd+L - Chat z AI o strategii testowania
Cmd+I - Inline suggestions dla test cases
Przykłady promptów dla Cursor AI:
Rekomendowane rozszerzenia i wtyczki
Rozszerzenia VS Code/Cursor:
Vitest - IntelliSense dla Vitest
Playwright Test for VSCode - Debugowanie testów E2E
Testing Library Snippets - Snippets dla React Testing Library
Coverage Gutters - Wyświetlanie coverage w editorze
Error Lens - Inline error display
Konfiguracja Cursor:
Uzupełnianie kodu i refaktoryzacja dla testów
Testable code patterns:
Dependency injection dla testów:
Korzystanie z terminala i funkcji debugowania Cursor
Skrypty debugowania:
Debugowanie w Cursor:
F5 - Start debugging
Ctrl+Shift+P → "Debug: Start Debugging"
Breakpoints - Kliknij na numer linii
Debug Console - Interaktywne debugowanie
7. Strategia wykonania testów
Konfiguracja automatyzacji testów
GitHub Actions workflow:
Rozważania dotyczące ciągłej integracji
Pipeline stages (zaktualizowane):
Lint & Type Check - ESLint, TypeScript check, Prettier
Unit Tests - Vitest z coverage (c8)
Integration Tests - API endpoints z mock DB (MSW)
Component Tests - React Testing Library z user-event
E2E Tests - Playwright w headless mode z accessibility tests
Performance Tests - Lighthouse CI automatyczne
Build Test - Astro build verification
Security Scan - npm audit, dependency check, Snyk
Quality gates (zaktualizowane):
Coverage threshold: >90% (branches, functions, lines, statements)
No failing tests (unit, integration, component, e2e)
No TypeScript errors
No accessibility violations (WCAG 2.1 AA)
Performance score: >90 (Lighthouse)
No security vulnerabilities (CVSS < 7.0)
Build success
Bundle size: <500KB (gzipped)
Raportowanie i monitorowanie testów
Coverage reporting:
Test reporting dashboard:
Coverage: HTML reports w /coverage/index.html
E2E: Playwright HTML reports
CI: GitHub Actions summary
Monitoring: Test results w PR comments
Metryki jakości:
Test execution time
Coverage percentage
Flaky test detection
Performance regression detection
Podsumowanie implementacji (zaktualizowane)
Ten plan testów zapewnia kompleksowe pokrycie aplikacji FireLog z wykorzystaniem najnowszych technologii testowych i najlepszych praktyk. Kluczowe elementy:

**Nowoczesne technologie testowe:**
- **Vitest + c8** - Szybsze testy jednostkowe z lepszym coverage
- **@testing-library/user-event** - Realistyczne interakcje użytkownika
- **@mswjs/msw + @mswjs/data** - Zaawansowane mockowanie API
- **@faker-js/faker** - Generowanie realistycznych danych testowych
- **@playwright/test + @axe-core/playwright** - E2E z testami dostępności
- **lighthouse-ci** - Automatyczne testy wydajności

**Kompleksowe pokrycie:**
- **Bezpieczeństwo** - Testy autoryzacji, walidacji, RLS policies, XSS protection
- **Funkcjonalność** - Pełne pokrycie funkcji MVP z realistic data
- **Integracja** - Testy API, bazy danych, Supabase, OpenRouter.ai
- **E2E** - Przepływy użytkownika w różnych przeglądarkach z accessibility tests
- **Wydajność** - Lighthouse CI, bundle size monitoring
- **Dostępność** - WCAG 2.1 AA compliance testing

**Automatyzacja i monitoring:**
- **CI/CD pipeline** z rozszerzonymi quality gates
- **Coverage thresholds** >90% dla wszystkich metryk
- **Performance monitoring** z Lighthouse scores
- **Security scanning** z Snyk integration
- **Accessibility testing** automatyczne

**Oczekiwane korzyści:**
- **+30% szybsze testy** dzięki c8 i jsdom
- **+40% lepsze pokrycie** dzięki MSW i faker
- **+50% bardziej realistyczne testy** dzięki user-event
- **Automatyczne testy dostępności** dzięki axe-core
- **Lepsze raportowanie** dzięki lcov i thresholds

Plan jest gotowy do implementacji w Cursor IDE z wykorzystaniem AI do generowania testów i debugowania. Wszystkie nowoczesne narzędzia są skonfigurowane i gotowe do użycia.

## 🚀 Priorytety Implementacji

### **Faza 1 (Krytyczna - Tydzień 1):**
1. **Instalacja podstawowych narzędzi**
   ```bash
   npm install -D @testing-library/jest-dom @testing-library/user-event
   npm install -D c8
   ```

2. **Aktualizacja konfiguracji Vitest**
   - Zmiana environment na `jsdom`
   - Zmiana coverage provider na `c8`
   - Dodanie setup file

3. **Rozszerzenie istniejących testów walidacji**
   - Dodanie `@faker-js/faker` do generowania danych
   - Ulepszenie test cases z edge cases

### **Faza 2 (Wysoka - Tydzień 2):**
1. **Implementacja MSW**
   ```bash
   npm install -D @mswjs/msw @mswjs/data
   ```

2. **Testy serwisów biznesowych**
   - `AuthService` z mockami Supabase
   - `MeldunkiService` z realistic data

3. **Testy komponentów React**
   - `ClientSelect` z user-event
   - Formularze z realistic interactions

### **Faza 3 (Średnia - Tydzień 3):**
1. **Playwright E2E**
   ```bash
   npm install -D @playwright/test @axe-core/playwright
   ```

2. **Testy dostępności**
   - Automatyczne axe-core tests
   - Keyboard navigation tests

3. **Testy integracji z bazą danych**
   - Supabase RLS testing
   - OpenRouter AI integration

### **Faza 4 (Niska - Tydzień 4):**
1. **Performance testing**
   ```bash
   npm install -D lighthouse-ci
   ```

2. **CI/CD pipeline**
   - GitHub Actions workflow
   - Quality gates configuration

3. **Monitoring i raportowanie**
   - Coverage thresholds
   - Performance budgets

## 📊 Metryki Sukcesu

| Metryka | Obecna | Cel | Narzędzie |
|---------|--------|-----|-----------|
| Test Coverage | ~60% | >90% | c8 |
| Test Speed | ~30s | <15s | Vitest + jsdom |
| E2E Tests | 0 | 15+ | Playwright |
| Accessibility Score | N/A | 100% | axe-core |
| Performance Score | N/A | >90 | Lighthouse |
| Bundle Size | N/A | <500KB | Bundle analyzer |

## 🎯 Quick Start Commands

```bash
# Instalacja wszystkich narzędzi
npm install -D @testing-library/jest-dom @testing-library/user-event @testing-library/react-hooks @mswjs/msw @mswjs/data @faker-js/faker @playwright/test @axe-core/playwright c8 lighthouse-ci

# Uruchomienie testów
npm run test:all

# Debugowanie testów
npm run test:ui
npm run test:e2e:debug

# Coverage report
npm run test:coverage
```