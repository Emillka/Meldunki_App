# Architektura UI dla FireLog

## 1. Przegląd struktury UI

FireLog to aplikacja webowa dla jednostek Ochotniczej Straży Pożarnej (OSP) do rejestrowania i zarządzania meldunkami z akcji. Architektura UI została zaprojektowana z myślą o prostocie użytkowania, responsywności i bezpieczeństwie, uwzględniając specyfikę pracy strażaków w terenie.

**Główne założenia architektury:**
- **Prostota**: Intuicyjny interfejs dostosowany do użytkowników o różnym poziomie znajomości technologii
- **Responsywność**: Pełne wsparcie dla urządzeń mobilnych, tabletów i desktopów
- **Bezpieczeństwo**: Autoryzacja JWT, Row Level Security, walidacja po obu stronach
- **Wydajność**: Minimalna ilość JavaScript, optymalizacja dla szybkiego ładowania
- **Dostępność**: Zgodność z WCAG, wsparcie dla czytników ekranu

**Stack technologiczny:**
- **Framework**: Astro 5 z React 19 dla komponentów interaktywnych
- **Styling**: Tailwind 4 + Shadcn/ui + custom design system
- **Typowanie**: TypeScript 5
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Openrouter.ai dla analizy meldunków

## 2. Lista widoków

### 2.1. Strona główna (`/`)
- **Ścieżka**: `/`
- **Główny cel**: Prezentacja aplikacji, status systemu, nawigacja do logowania/rejestracji
- **Kluczowe informacje**: 
  - Opis aplikacji FireLog
  - Status autentykacji użytkownika
  - Linki do logowania/rejestracji
  - Informacje o gotowości systemu
- **Kluczowe komponenty**:
  - Hero section z logo i opisem
  - Status cards (autentykacja, testy, dokumentacja)
  - Quick links (dashboard dla zalogowanych, logowanie, rejestracja)
  - Info cards z metrykami systemu
- **UX, dostępność i bezpieczeństwo**:
  - Automatyczne wykrywanie statusu zalogowania
  - Dynamiczne pokazywanie/ukrywanie elementów
  - Czytelne call-to-action buttons
  - Responsywny grid layout

### 2.2. Strona logowania (`/login`)
- **Ścieżka**: `/login`
- **Główny cel**: Uwierzytelnienie użytkownika w systemie
- **Kluczowe informacje**:
  - Formularz logowania (email, hasło)
  - Link do rejestracji
  - Link powrotu do strony głównej
- **Kluczowe komponenty**:
  - Login form z walidacją
  - Message container dla feedback
  - Navigation links
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja formularza w czasie rzeczywistym
  - Rate limiting (5 prób na 15 minut)
  - Bezpieczne przechowywanie tokenów JWT
  - Autocomplete dla pól formularza
  - Obsługa błędów z szczegółowymi komunikatami

### 2.3. Strona rejestracji (`/register`)
- **Ścieżka**: `/register`
- **Główny cel**: Rejestracja nowego użytkownika w systemie
- **Kluczowe informacje**:
  - Formularz rejestracji (email, hasło, imię, nazwisko, ID jednostki)
  - Wymagania dotyczące hasła
  - Link do logowania
- **Kluczowe komponenty**:
  - Registration form z walidacją
  - Password requirements display
  - Message container dla feedback
- **UX, dostępność i bezpieczeństwo**:
  - Silne wymagania dotyczące hasła (8+ znaków, wielka/mała litera, cyfra, znak specjalny)
  - Walidacja email w czasie rzeczywistym
  - Automatyczne tworzenie profilu po rejestracji
  - Bezpieczne przechowywanie danych

### 2.4. Dashboard (`/dashboard`)
- **Ścieżka**: `/dashboard`
- **Główny cel**: Główny panel użytkownika z dostępem do wszystkich funkcji
- **Kluczowe informacje**:
  - Status zalogowania użytkownika
  - Liczba meldunków
  - Nawigacja między zakładkami
- **Kluczowe komponenty**:
  - Navigation header z logo i user menu
  - Tab navigation (Meldunki, Nowy Meldunek, Profil)
  - User status display
  - Logout functionality
- **UX, dostępność i bezpieczeństwo**:
  - Sprawdzanie autoryzacji przy każdym wejściu
  - Responsywny header z user menu
  - Smooth transitions między zakładkami
  - Bezpieczne wylogowanie z czyszczeniem tokenów

### 2.5. Zakładka Meldunki (w Dashboard)
- **Ścieżka**: `/dashboard#meldunki`
- **Główny cel**: Wyświetlanie i zarządzanie listą meldunków użytkownika
- **Kluczowe informacje**:
  - Lista meldunków z podstawowymi informacjami
  - Status każdego meldunku
  - Liczba meldunków
  - Filtry i sortowanie
- **Kluczowe komponenty**:
  - Meldunki list z kartami
  - Loading state
  - Empty state z call-to-action
  - Error state
  - Meldunek cards z akcjami
- **UX, dostępność i bezpieczeństwo**:
  - Lazy loading dla dużych list
  - Skeleton loading podczas pobierania danych
  - Intuicyjne akcje (edycja, usuwanie)
  - Potwierdzenie przed usunięciem
  - Responsywny grid layout

### 2.6. Zakładka Nowy Meldunek (w Dashboard)
- **Ścieżka**: `/dashboard#nowy`
- **Główny cel**: Tworzenie nowego meldunku z akcji
- **Kluczowe informacje**:
  - Formularz z wszystkimi wymaganymi polami
  - Walidacja w czasie rzeczywistym
  - Podgląd przed wysłaniem
- **Kluczowe komponenty**:
  - Multi-section form (podstawowe info, szczegóły, dodatkowe)
  - Real-time validation
  - Character counters
  - Submit button z loading state
  - Message container
- **UX, dostępność i bezpieczeństwo**:
  - Progressive disclosure (sekcje formularza)
  - Walidacja po stronie klienta i serwera
  - Auto-save draft (przyszłość)
  - Accessibility labels i ARIA attributes
  - Mobile-friendly form layout

### 2.7. Zakładka Profil (w Dashboard)
- **Ścieżka**: `/dashboard#profil`
- **Główny cel**: Zarządzanie profilem użytkownika
- **Kluczowe informacje**:
  - Dane użytkownika (imię, nazwisko, email)
  - Informacje o jednostce OSP
  - Ustawienia konta
- **Kluczowe komponenty**:
  - Profile information display
  - Edit profile form
  - Account settings
  - Unit information
- **UX, dostępność i bezpieczeństwo**:
  - Read-only display z opcją edycji
  - Walidacja zmian
  - Bezpieczne aktualizowanie danych
  - Confirmation dialogs

### 2.8. Strona 404 (`/404`)
- **Ścieżka**: `/404`
- **Główny cel**: Obsługa nieprawidłowych URL-i
- **Kluczowe informacje**:
  - Komunikat o błędzie
  - Linki powrotu
  - Nawigacja do głównych sekcji
- **Kluczowe komponenty**:
  - Error message
  - Navigation links
  - Search functionality (przyszłość)
- **UX, dostępność i bezpieczeństwo**:
  - Przyjazny komunikat o błędzie
  - Jasne opcje nawigacji
  - Accessibility compliance

## 3. Mapa podróży użytkownika

### 3.1. Główny przepływ użytkownika (nowy użytkownik)

1. **Wejście na stronę główną** (`/`)
   - Użytkownik widzi opis aplikacji
   - Status systemu pokazuje "nie zalogowany"
   - Dostępne opcje: Logowanie, Rejestracja

2. **Rejestracja** (`/register`)
   - Wypełnienie formularza rejestracji
   - Walidacja danych w czasie rzeczywistym
   - Potwierdzenie rejestracji
   - Automatyczne logowanie po rejestracji

3. **Przekierowanie do Dashboard** (`/dashboard`)
   - Sprawdzenie autoryzacji
   - Wyświetlenie statusu użytkownika
   - Domyślnie zakładka "Meldunki" (pusta)

4. **Tworzenie pierwszego meldunku** (`/dashboard#nowy`)
   - Przejście do zakładki "Nowy Meldunek"
   - Wypełnienie formularza
   - Walidacja i wysłanie
   - Potwierdzenie utworzenia

5. **Przeglądanie meldunków** (`/dashboard#meldunki`)
   - Powrót do zakładki "Meldunki"
   - Wyświetlenie utworzonego meldunku
   - Możliwość edycji/usunięcia

### 3.2. Przepływ zalogowanego użytkownika

1. **Wejście na stronę główną** (`/`)
   - Automatyczne wykrycie zalogowania
   - Wyświetlenie karty "Dashboard"
   - Ukrycie opcji logowania

2. **Przejście do Dashboard** (`/dashboard`)
   - Sprawdzenie tokenu JWT
   - Załadowanie danych użytkownika
   - Wyświetlenie zakładki "Meldunki"

3. **Zarządzanie meldunkami**
   - Przeglądanie listy meldunków
   - Tworzenie nowych meldunków
   - Edycja istniejących meldunków
   - Usuwanie meldunków

4. **Zarządzanie profilem**
   - Przejście do zakładki "Profil"
   - Przeglądanie danych użytkownika
   - Edycja profilu (przyszłość)

### 3.3. Przepływ wylogowania

1. **Kliknięcie "Wyloguj"** w Dashboard
2. **Potwierdzenie wylogowania**
3. **Czyszczenie tokenów** z localStorage
4. **Przekierowanie** do strony głównej
5. **Aktualizacja statusu** na stronie głównej

## 4. Układ i struktura nawigacji

### 4.1. Struktura nawigacji głównej

```
FireLog
├── Strona główna (/) - publiczna
├── Logowanie (/login) - publiczna
├── Rejestracja (/register) - publiczna
├── Dashboard (/dashboard) - chroniona
│   ├── Meldunki (#meldunki)
│   ├── Nowy Meldunek (#nowy)
│   └── Profil (#profil)
└── 404 (/404) - publiczna
```

### 4.2. System nawigacji

**Nawigacja publiczna:**
- Logo FireLog (link do strony głównej)
- Linki: Logowanie, Rejestracja
- Status systemu

**Nawigacja chroniona (Dashboard):**
- Header z logo i user menu
- Tab navigation (zakładki)
- User status display
- Logout button

**Nawigacja mobilna:**
- Hamburger menu (przyszłość)
- Collapsible navigation
- Touch-friendly buttons

### 4.3. Breadcrumbs i kontekst

**Breadcrumbs:**
- Dashboard > Meldunki
- Dashboard > Nowy Meldunek
- Dashboard > Profil

**Kontekst użytkownika:**
- Status zalogowania
- Nazwa użytkownika
- Jednostka OSP
- Liczba meldunków

## 5. Kluczowe komponenty

### 5.1. Komponenty nawigacyjne

**Header Component:**
- Logo FireLog z linkiem do strony głównej
- User menu z statusem i opcjami
- Responsywny design
- Accessibility compliance

**Tab Navigation:**
- Smooth transitions między zakładkami
- Active state indicators
- Mobile-friendly layout
- Keyboard navigation

**Breadcrumbs:**
- Hierarchiczna nawigacja
- Linki do poprzednich poziomów
- Current page indicator

### 5.2. Komponenty formularzy

**Form Components:**
- Input fields z walidacją
- Select dropdowns
- Textarea z character counters
- Date/time pickers
- File upload (przyszłość)

**Validation Components:**
- Real-time validation feedback
- Error messages
- Success indicators
- Field requirements display

**Form Sections:**
- Progressive disclosure
- Section headers z ikonami
- Collapsible sections
- Progress indicators

### 5.3. Komponenty danych

**Meldunek Cards:**
- Compact display z kluczowymi informacjami
- Status indicators
- Action buttons
- Hover effects

**Data Tables:**
- Sortable columns
- Filtering options
- Pagination
- Responsive design

**Loading States:**
- Skeleton loaders
- Spinner animations
- Progress bars
- Placeholder content

### 5.4. Komponenty feedback

**Message Components:**
- Success messages
- Error messages
- Warning messages
- Info messages

**Toast Notifications:**
- Non-intrusive notifications
- Auto-dismiss timers
- Action buttons
- Stacking support

**Modal Dialogs:**
- Confirmation dialogs
- Form modals
- Info modals
- Accessibility compliance

### 5.5. Komponenty layoutu

**Card Components:**
- Consistent styling
- Hover effects
- Shadow variations
- Responsive padding

**Grid Components:**
- Responsive grid system
- Auto-layout
- Gap controls
- Breakpoint adjustments

**Container Components:**
- Max-width constraints
- Centered content
- Responsive padding
- Background variations

### 5.6. Komponenty dostępności

**Screen Reader Support:**
- ARIA labels
- Role attributes
- Live regions
- Focus management

**Keyboard Navigation:**
- Tab order
- Focus indicators
- Keyboard shortcuts
- Escape key handling

**Color and Contrast:**
- WCAG AA compliance
- High contrast mode
- Color-blind friendly
- Dark mode support (przyszłość)

### 5.7. Komponenty bezpieczeństwa

**Authentication Guards:**
- Route protection
- Token validation
- Session management
- Auto-logout

**Input Sanitization:**
- XSS prevention
- Input validation
- Output encoding
- CSRF protection

**Error Handling:**
- Graceful degradation
- User-friendly messages
- Logging integration
- Recovery options

## 6. Stany błędów i przypadki brzegowe

### 6.1. Stany błędów

**Network Errors:**
- Brak połączenia z internetem
- Timeout errors
- Server errors (500, 503)
- API rate limiting

**Authentication Errors:**
- Invalid credentials
- Expired tokens
- Session timeout
- Account locked

**Validation Errors:**
- Form validation failures
- Required field errors
- Format validation errors
- Business rule violations

**Data Errors:**
- Empty data sets
- Corrupted data
- Missing relationships
- Sync conflicts

### 6.2. Obsługa stanów błędów

**User-Friendly Messages:**
- Clear error descriptions
- Suggested actions
- Contact information
- Recovery options

**Fallback UI:**
- Offline indicators
- Retry mechanisms
- Cached content display
- Graceful degradation

**Error Recovery:**
- Automatic retries
- Manual refresh options
- Data recovery
- Session restoration

### 6.3. Przypadki brzegowe

**Empty States:**
- No meldunki created
- No search results
- No data available
- First-time user experience

**Loading States:**
- Initial page load
- Data fetching
- Form submission
- File uploads

**Edge Cases:**
- Very long text content
- Special characters
- Large file uploads
- Concurrent edits

**Performance Edge Cases:**
- Slow network connections
- Large datasets
- Memory constraints
- Battery optimization

## 7. Integracja z API

### 7.1. Mapowanie endpointów do widoków

**Authentication Endpoints:**
- `POST /api/auth/register` → Register page
- `POST /api/auth/login` → Login page
- Token validation → All protected pages

**Meldunki Endpoints:**
- `GET /api/meldunki-simple` → Meldunki tab
- `POST /api/meldunki-simple` → Nowy Meldunek tab
- `PUT /api/meldunki-simple/:id` → Edit meldunek
- `DELETE /api/meldunki-simple/:id` → Delete meldunek

### 7.2. Zarządzanie stanem

**Local State Management:**
- Component-level state
- localStorage dla tokenów
- Session storage dla tymczasowych danych
- URL state dla navigation

**Data Flow:**
- API calls → Component state
- State updates → UI re-renders
- Error handling → User feedback
- Success handling → Navigation

### 7.3. Caching Strategy

**Token Caching:**
- localStorage dla access tokens
- Automatic refresh przed wygaśnięciem
- Secure storage practices
- Cleanup on logout

**Data Caching:**
- Meldunki list caching
- User profile caching
- Form data persistence
- Offline support (przyszłość)

## 8. Responsywność i dostępność

### 8.1. Responsywny design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-First Approach:**
- Touch-friendly interfaces
- Optimized form layouts
- Collapsible navigation
- Swipe gestures

**Tablet Optimizations:**
- Two-column layouts
- Larger touch targets
- Optimized spacing
- Landscape orientation

**Desktop Enhancements:**
- Multi-column layouts
- Hover effects
- Keyboard shortcuts
- Advanced interactions

### 8.2. Dostępność

**WCAG 2.1 AA Compliance:**
- Color contrast ratios
- Keyboard navigation
- Screen reader support
- Focus management

**Semantic HTML:**
- Proper heading hierarchy
- Form labels
- Button descriptions
- Link context

**ARIA Support:**
- Live regions
- Role attributes
- State indicators
- Relationship descriptions

## 9. Bezpieczeństwo UI

### 9.1. Autoryzacja i uwierzytelnianie

**Route Protection:**
- Authentication guards
- Token validation
- Session management
- Auto-logout

**Input Security:**
- XSS prevention
- Input sanitization
- Output encoding
- CSRF protection

### 9.2. Bezpieczne praktyki

**Token Management:**
- Secure storage
- Automatic refresh
- Cleanup on logout
- Expiration handling

**Data Protection:**
- Sensitive data masking
- Secure transmission
- Local storage security
- Session management

## 10. Przyszłe rozszerzenia

### 10.1. Planowane funkcje

**Advanced Features:**
- File uploads
- Image attachments
- PDF generation
- Email notifications

**Admin Features:**
- User management
- Unit administration
- Reports generation
- Analytics dashboard

**Mobile App:**
- Native mobile app
- Offline support
- Push notifications
- GPS integration

### 10.2. Skalowalność

**Performance Optimizations:**
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

**Architecture Improvements:**
- Global state management
- Advanced routing
- Micro-frontends
- Service workers

**Monitoring and Analytics:**
- User behavior tracking
- Performance monitoring
- Error reporting
- Usage analytics
