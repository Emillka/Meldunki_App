# FireLog App (Magenta Mass)

Aplikacja webowa do rejestrowania i zarządzania meldunkami dla jednostek Ochotniczej Straży Pożarnej (OSP), zbudowana w Astro 5 + TypeScript.

## Szybki start

### Instalacja i uruchomienie

```bash
# Instalacja zależności
npm i

# Uruchomienie serwera deweloperskiego
npm run dev

# Build produkcyjny
npm run build

# Podgląd builda
npm run preview
```

## Konfiguracja

### Zmienne środowiskowe

Skopiuj `test.env.example` do `.env` i uzupełnij:

```env
PUBLIC_SUPABASE_URL=twoja_supabase_url
PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key  # Opcjonalnie, dla skryptów admin
OPENROUTER_API_KEY=twoj_openrouter_key  # Dla analizy AI
```

## Kluczowe funkcje

### Strony i routing

- **`/`** - Strona główna z landing page i statusem systemu
- **`/login`** - Logowanie użytkowników (email i hasło) z linkiem do resetowania hasła
- **`/register`** - Rejestracja nowych użytkowników z powiązaniem do jednostki OSP
- **`/forgot-password`** - Formularz żądania resetu hasła (wysyła email z linkiem resetującym)
- **`/reset-password`** - Strona ustawiania nowego hasła (dostępna przez link z emaila)
- **`/dashboard`** - Panel użytkownika z zakładkami:
  - **Profil** - Wyświetlanie i edycja danych osobowych, zmiana hasła
  - **Nowy Meldunek** - Formularz tworzenia meldunku z automatyczną analizą AI
  - **Admin** - Panel administracyjny (tylko dla administratorów)
- **`/meldunki`** - Lista wszystkich meldunków z filtrowaniem i sortowaniem
- **`/privacy`** - Polityka prywatności
- **`/terms`** - Regulamin

### Autoryzacja i bezpieczeństwo

#### Rejestracja i aktywacja konta
- **Formularz rejestracji** - Wymagane pola: email, hasło, wybór jednostki OSP, opcjonalnie imię i nazwisko
- **Walidacja hasła** - Min. 8 znaków, wielka litera, cyfra, znak specjalny
- **E-mail aktywacyjny** - Po rejestracji użytkownik otrzymuje e-mail z linkiem aktywacyjnym
- **Aktywacja konta** - Kliknięcie w link aktywuje konto i przekierowuje do logowania
- **Automatyczne tworzenie profilu** - Po rejestracji automatycznie tworzony jest profil w bazie danych

#### Logowanie i sesje
- **Bezpieczne logowanie** - Email i hasło z walidacją po stronie serwera
- **Sesje JWT** - Tokeny dostępowe z automatycznym odświeżaniem
- **Automatyczne odświeżanie** - System automatycznie odnawia wygasające tokeny (TokenManager)
- **Persystencja sesji** - Użytkownik pozostaje zalogowany między sesjami przeglądarki

#### Resetowanie hasła
- **Żądanie resetu** - Formularz na `/forgot-password` do żądania resetu hasła
- **Email resetujący** - Automatyczna wysyłka emaila z linkiem resetującym (przez Supabase)
- **Bezpieczeństwo** - System nie ujawnia czy email istnieje w bazie (zawsze zwraca sukces)
- **Ustawianie nowego hasła** - Strona `/reset-password` z walidacją siły hasła
- **Token jednorazowy** - Token resetujący jest jednorazowy i ma czas wygaśnięcia (1 godzina)
- **Automatyczne przekierowanie** - Po pomyślnym resetcie automatyczne przekierowanie do logowania

### Role użytkowników

#### Rola: Member (Strażak)
- **Domyślna rola** - Wszyscy nowo zarejestrowani użytkownicy
- **Uprawnienia:**
  - Tworzenie, przeglądanie, edycja i usuwanie własnych meldunków
  - Zarządzanie własnym profilem
  - Zmiana własnego hasła
- **Ograniczenia:**
  - Brak dostępu do panelu administracyjnego
  - Brak możliwości zarządzania użytkownikami

#### Rola: Admin (Administrator)
- **Uprawnienia administracyjne:**
  - ✅ Zarządzanie użytkownikami jednostki (przeglądanie, usuwanie)
  - ✅ Przeglądanie wszystkich meldunków swojej jednostki
  - ✅ Usuwanie dowolnego meldunku w swojej jednostce
  - ✅ Dostęp do statystyk jednostki
- **Ograniczenia:**
  - ❌ Nie może resetować hasła innych użytkowników
  - ❌ Nie może zmieniać ról użytkowników (awansowanie/degradowanie)
  - ❌ Nie może edytować cudzych meldunków


### Panel administracyjny

**Dostęp:** Tylko dla użytkowników z rolą `admin` (pojawia się jako trzecia zakładka w dashboardzie)

#### Zarządzanie użytkownikami jednostki
- Lista użytkowników - przegląd wszystkich członków jednostki (imię, nazwisko, email, rola, data rejestracji)
- Usuwanie użytkowników - trwałe usunięcie konta z systemu (z wyjątkiem własnego konta)

#### Statystyki jednostki
- Liczba użytkowników - całkowita liczba członków jednostki
- Liczba meldunków - wszystkie meldunki w systemie jednostki
- Aktywni użytkownicy - liczba użytkowników z aktywnością w ostatnich 30 dniach
- Meldunki w bieżącym miesiącu - statystyki miesięczne
- Najaktywniejszy użytkownik - ranking aktywności (najwięcej meldunków)

Jak utworzyć konto administratora: [../ADMIN_SETUP.md](../ADMIN_SETUP.md)

### Endpointy API

#### Autoryzacja
- `POST /api/auth/register` - Rejestracja użytkownika (wysyłka e-maila aktywacyjnego)
- `POST /api/auth/login` - Logowanie (zwraca sesję JWT)
- `POST /api/auth/logout` - Wylogowanie (unieważnienie sesji)
- `POST /api/auth/refresh` - Odświeżanie tokenu dostępu
- `GET /api/auth/profile` - Pobierz profil użytkownika
- `PATCH /api/auth/profile` - Edytuj profil użytkownika
- `POST /api/auth/change-password` - Zmiana hasła (wymagane aktualne hasło)
- `POST /api/auth/forgot-password` - Żądanie resetu hasła (wysyła email z linkiem)
- `POST /api/auth/reset-password` - Ustawienie nowego hasła (używając tokenu z emaila)

#### Meldunki
- `GET /api/meldunki` - Lista meldunków (z filtrowaniem i sortowaniem)
- `POST /api/meldunki` - Utwórz nowy meldunek
- `GET /api/meldunki/[id]` - Szczegóły meldunku
- `PATCH /api/meldunki/[id]` - Edytuj meldunek
- `DELETE /api/meldunki/[id]` - Usuń meldunek
- `POST /api/meldunki/[id]/analyze` - Analiza AI meldunku

#### Panel administracyjny
- `GET /api/admin/users` - Lista użytkowników jednostki (tylko dla adminów)
- `GET /api/admin/users/[id]` - Szczegóły użytkownika (tylko dla adminów)
- `DELETE /api/admin/users/[id]` - Usuń użytkownika (tylko dla adminów, z wyjątkiem własnego konta)
- `PATCH /api/admin/users/[id]/assign-department` - Przypisanie użytkownika do jednostki OSP
- `GET /api/admin/statistics` - Statystyki jednostki (liczba użytkowników, meldunków, aktywność)

#### Inne
- `GET /api/fire-departments` - Lista jednostek OSP
- `GET /api/health` - Status zdrowia systemu

### Struktura projektu

```
src/
├── pages/
│   ├── api/                    # API endpoints
│   │   ├── auth/              # Endpointy autoryzacji
│   │   ├── admin/             # Endpointy administracyjne
│   │   ├── meldunki/          # Endpointy meldunków
│   │   ├── fire-departments.ts # Lista jednostek OSP
│   │   └── health.ts          # Status systemu
│   ├── index.astro            # Strona główna
│   ├── login.astro            # Strona logowania
│   ├── register.astro         # Strona rejestracji
│   ├── forgot-password.astro   # Formularz resetu hasła
│   ├── reset-password.astro    # Ustawianie nowego hasła
│   ├── dashboard.astro        # Dashboard (przekierowanie)
│   ├── meldunki.astro         # Lista meldunków
│   ├── privacy.astro          # Polityka prywatności
│   └── terms.astro            # Regulamin
├── layouts/
│   ├── Layout.astro           # Główny layout
│   └── Dashboard.astro        # Layout dashboardu z panelami
├── components/
│   ├── Header.astro           # Nagłówek z nawigacją
│   ├── Footer.astro           # Stopka
│   ├── ClientSelect.tsx       # Komponent wyboru klienta
│   ├── SimpleSelect.tsx        # Prosty select
│   └── ui/                    # Komponenty shadcn/ui
├── lib/
│   ├── services/              # Serwisy biznesowe
│   │   ├── auth.service.ts    # Serwis autoryzacji
│   │   └── meldunki.service.ts # Serwis meldunków
│   ├── db/                    # Integracja z Supabase
│   │   ├── supabase.ts        # Klient Supabase
│   │   └── database.types.ts  # Typy TypeScript
│   ├── utils/                 # Narzędzia pomocnicze
│   │   ├── token-manager.ts   # Zarządzanie tokenami
│   │   ├── response.ts       # Formatowanie odpowiedzi API
│   │   └── rate-limiter.ts    # Rate limiting
│   ├── validation/            # Walidacja danych
│   │   └── auth.validation.ts # Walidacja autoryzacji
│   └── types.ts               # Typy TypeScript
├── hooks/                     # React hooks
│   ├── use-mobile.tsx         # Hook wykrywania mobile
│   └── use-toast.ts          # Hook toast notifications
└── styles/
    ├── globals.css            # Style globalne (primary = czerwony)
    └── design-system.css      # Design system
```

## Styl i design

- **Primary color:** Czerwony (#dc2626) - Kolorystyka OSP
- **Framework:** Tailwind CSS 3.4
- **Komponenty:** shadcn/ui (Radix UI + Tailwind)
- **Ikony:** Material Icons
- **Responsywność:** Mobile-first approach
- **Design System:** Material Design 3 (M3) inspiracja

## Testy

Szczegółowe informacje o testach: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

```bash
# Testy jednostkowe
npm run test

# Testy E2E
npm run test:e2e

# Pokrycie kodem
npm run test:coverage
```

## Dokumentacja

- **Główny README:** [../README.md](../README.md) - Pełny opis funkcjonalności aplikacji
- **Instrukcja Admin:** [../ADMIN_SETUP.md](../ADMIN_SETUP.md) - Jak utworzyć konto administratora
- **Przewodnik testów:** [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Szczegółowy przewodnik po testach
- **Quick Start:** [../QUICK_START.md](../QUICK_START.md) - Szybki start z projektem
- **Deployment Guide:** [../RENDER_DEPLOYMENT_GUIDE.md](../RENDER_DEPLOYMENT_GUIDE.md) - Instrukcje wdrożenia
