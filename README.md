# FireLog (Meldunki_App)

Nowoczesny system do rejestrowania i zarządzania meldunkami dla jednostek OSP.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/yourusername/firelog)
[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow.svg)](https://github.com/yourusername/firelog)

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**FireLog** is a modern web application designed to enable fire departments (OSP - Ochotnicza Straż Pożarna) to quickly and systematically create electronic reports from their action operations. The application aims to replace traditional paper-based reporting systems with a simple, efficient, and centralized digital solution.

### Problem Statement

Currently, most fire departments maintain their reports using notebooks, Excel spreadsheets, or informal systems. This approach creates significant challenges:

- Difficulty in finding historical action data
- Inability to analyze the number and types of interventions effectively
- Complications in reporting to commands or government offices

### Solution

FireLog solves these problems by:

- **Centralizing all reports** in one accessible location
- **Automating data analysis** using AI-powered categorization and summarization
- **Providing CRUD operations** for managing action reports
- **Securing access** through email and password authentication
- **Ensuring data persistence** with JWT-based session management

### Key Features

- 🔐 Rejestracja/logowanie/reset hasła (Supabase Auth)
- 🧭 Dashboard z zakładkami: Profil, Nowy Meldunek, Admin (rola admin)
- 📝 Lista meldunków z filtrowaniem, sortowaniem i paginacją
- ✏️ Tworzenie/edycja/usuwanie meldunków (CRUD) przez API `/api/meldunki`
- 🔎 Podgląd szczegółów meldunku w modalu, przejście do edycji
- 🎨 Akcent kolorystyczny OSP (czerwony jako primary)
- ✅ Testy E2E i unit + CI/CD

## Tech Stack

### Frontend
- **[Astro 5](https://astro.build/)** - Fast, efficient web framework with minimal JavaScript
- **[React 19](https://react.dev/)** - Interactive components where needed
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static typing and improved IDE support
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library

### Backend
- **[Supabase](https://supabase.com/)** - Open-source Backend-as-a-Service
  - PostgreSQL database
  - Built-in user authentication
  - Multi-language SDK support
  - Self-hosting capability

### AI Integration
- **[OpenRouter.ai](https://openrouter.ai/)** - AI model gateway
  - Access to multiple AI providers (OpenAI, Anthropic, Google, etc.)
  - Cost-effective model selection
  - API key spending limits

### Testing & Quality Assurance
- **[Vitest](https://vitest.dev/)** - Fast unit testing framework with TypeScript support
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)** - React component testing utilities
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro/)** - Realistic user interaction simulation
- **[@testing-library/jest-dom](https://testing-library.com/docs/ecosystem-jest-dom/)** - Custom DOM matchers for assertions
- **[MSW (Mock Service Worker)](https://mswjs.io/)** - API mocking for integration tests
- **[@faker-js/faker](https://fakerjs.dev/)** - Realistic test data generation
- **[Playwright](https://playwright.dev/)** - End-to-end testing across browsers
- **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** - Accessibility testing integration
- **[c8](https://github.com/bcoe/c8)** - Fast code coverage reporting
- **[lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)** - Automated performance testing

### CI/CD & Hosting
- **GitHub Actions** - testy i deployment
- **Render** lub Docker/Nginx

### Public URL (Deployment)

Patrz `RENDER_DEPLOYMENT_GUIDE.md`. Po wdrożeniu uzupełnij URL:

- App URL: <TBD>

## Getting Started Locally

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **Git**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/firelog.git
   cd firelog
   ```

2. Navigate to the project directory:
   ```bash
   cd magenta-mass
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   Skopiuj `magenta-mass/test.env.example` do `magenta-mass/.env` i uzupełnij:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcjonalny, do serwera)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:4321`

## Available Scripts

The following scripts are available in the project:

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Starts the development server with hot-reload |
| **build** | `npm run build` | Builds the application for production |
| **preview** | `npm run preview` | Previews the production build locally |
| **astro** | `npm run astro` | Runs Astro CLI commands directly |

### Examples

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run Astro CLI commands
npm run astro -- --help
```

## Testing

Jednostkowe (Vitest) i E2E (Playwright). Patrz `magenta-mass/TESTING_GUIDE.md`.

### Testing Strategy

#### Unit Tests
- **Framework**: Vitest with jsdom environment for React components
- **Coverage**: c8 provider for fast coverage reporting (>90% threshold)
- **Scope**: Business logic, validation functions, services, and utilities
- **Key Areas**:
  - Authentication and authorization logic
  - Data validation and sanitization
  - Business services (AuthService, MeldunkiService)
  - Utility functions and helpers

#### Integration Tests
- **Framework**: Vitest with MSW (Mock Service Worker)
- **Scope**: API endpoints, database operations, external service integrations
- **Key Areas**:
  - Supabase authentication and database operations
  - OpenRouter.ai AI analysis integration
  - API endpoint testing with realistic data
  - Row Level Security (RLS) policies

#### Component Tests
- **Framework**: React Testing Library with user-event
- **Scope**: Interactive React components and user interactions
- **Key Areas**:
  - Form components with validation
  - ClientSelect and SimpleSelect components
  - User interaction flows
  - State management and UI updates

#### End-to-End Tests
- **Framework**: Playwright with multi-browser support
- **Scope**: Complete user workflows across different browsers
- **Key Areas**:
  - User registration and authentication flows
  - Meldunki creation, editing, and deletion
  - Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
  - Mobile responsiveness testing

#### Accessibility Tests
- **Framework**: @axe-core/playwright integration
- **Scope**: WCAG 2.1 AA compliance across all pages
- **Key Areas**:
  - Keyboard navigation
  - Screen reader compatibility
  - Color contrast and visual accessibility
  - Form accessibility and error handling

#### Performance Tests
- **Framework**: lighthouse-ci for automated performance monitoring
- **Scope**: Core Web Vitals and performance metrics
- **Key Areas**:
  - Page load times and bundle size optimization
  - Lighthouse performance scores (>90 target)
  - Bundle size monitoring (<500KB gzipped)

### Available Test Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **test** | `npm run test` | Run unit tests in watch mode |
| **test:run** | `npm run test:run` | Run unit tests once |
| **test:ui** | `npm run test:ui` | Open Vitest UI for interactive testing |
| **test:coverage** | `npm run test:coverage` | Run tests with coverage report |
| **test:watch** | `npm run test:watch` | Run tests in watch mode |
| **test:e2e** | `npm run test:e2e` | Run end-to-end tests |
| **test:e2e:ui** | `npm run test:e2e:ui` | Open Playwright UI |
| **test:e2e:debug** | `npm run test:e2e:debug` | Debug E2E tests |
| **test:accessibility** | `npm run test:accessibility` | Run accessibility tests |
| **test:performance** | `npm run test:performance` | Run performance tests |
| **test:all** | `npm run test:all` | Run all test suites |

### Test Examples

```bash
# Run all tests with coverage
npm run test:coverage

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run accessibility tests
npm run test:accessibility

# Run performance tests
npm run test:performance
```

### Quality Gates

The project enforces strict quality standards:

- **Coverage Threshold**: >90% (branches, functions, lines, statements)
- **Performance Score**: >90 (Lighthouse)
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Security**: No high-severity vulnerabilities (CVSS < 7.0)
- **Bundle Size**: <500KB (gzipped)
- **Test Execution**: All tests must pass before deployment

## Project Scope

### MVP Features ✅

The Minimum Viable Product (MVP) includes the following features:

#### 1. Authorization
- User registration with email and password
- Secure login and logout functionality
- User session persistence with JWT tokens (7-day validity)
- Password hashing using bcrypt
- Protected routes accessible only to authenticated users

#### 2. CRUD Operations for Reports (Meldunki)
Każdy meldunek zawiera m.in.:
- nazwę zdarzenia, datę
- opis i lokalizację (adres)
- siły i środki, dowódca, kierowca
- status i typ (wyliczane przez logikę)

Operations:
- **Create**: Add new action reports
- **Read**: View list and details of all reports
- **Update**: Edit existing reports
- **Delete**: Remove reports

#### 3. Business Logic
- Reguły kategoryzacji tekstu zdarzenia po stronie API
- Generowanie `summary` (krótki opis)

#### 4. Testing
- Unit tests for text analysis functions
- Optional end-to-end tests for report submission

#### 5. CI/CD
- Automatic test execution on repository changes
- Optional automated deployment pipeline

### Out of Scope (for MVP) 🚫

The following features are planned for future releases:

- Advanced user roles and permissions system
- SMS notifications
- PDF report generation
- Monthly statistics and charts
- Map integrations
- Email notification system
- Multi-unit administration dashboard

### Future Enhancements 🚀

Planned features after MVP completion:

- 📄 PDF report generation
- 📊 Monthly charts and statistics dashboard
- 🗺️ Integration with mapping services
- 📧 Email and SMS notification system
- 👥 Advanced user role management
- 🏢 Multi-unit support

## Project Status

**Current Version:** 0.0.1 (MVP in Development)

**Development Stage:** Active Development

### Success Criteria

The MVP will be considered complete when:

- ✅ Users can create accounts using email and password
- ✅ Users can log in and log out successfully
- ✅ System maintains user sessions using JWT
- ✅ Users can add, edit, and delete reports
- ✅ Analysis function works correctly
- ✅ All tests pass successfully
- ✅ CI/CD automatically runs tests on code changes

### Roadmap

- Faza 1: Auth i CRUD
- Faza 2: Testy i CI/CD
- Faza 3: Produkcja (Render/Nginx)
- Faza 4: Rozszerzenia po-MVP

## License

This project is currently unlicensed. License information will be added in future releases.

---

**Note:** This is an active development project. Features and documentation are subject to change as the application evolves.

For questions, issues, or contributions, please refer to the project repository or contact the development team.

# Force deploy
