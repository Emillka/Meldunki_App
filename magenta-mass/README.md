# FireLog App (Magenta Mass)

Nowoczesna aplikacja webowa do rejestrowania i zarządzania meldunkami dla jednostek Ochotniczej Straży Pożarnej (OSP), zbudowana w **Astro 5 + TypeScript**.

## 🚀 Szybki start

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

## 📋 Konfiguracja

### Zmienne środowiskowe

Skopiuj `test.env.example` do `.env` i uzupełnij:

```env
PUBLIC_SUPABASE_URL=twoja_supabase_url
PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key  # Opcjonalnie, dla skryptów admin
OPENROUTER_API_KEY=twoj_openrouter_key  # Dla analizy AI
```

## 🎯 Kluczowe funkcje

### Strony i routing

- **`/`** - Strona główna z landing page i statusem systemu
- **`/login`** - Logowanie użytkowników (email i hasło)
- **`/register`** - Rejestracja nowych użytkowników z powiązaniem do jednostki OSP
- **`/forgot-password`** - Prośba o reset hasła (wysyłka e-maila resetującego)
- **`/reset-password`** - Resetowanie hasła używając tokena z e-maila
- **`/dashboard`** - Panel użytkownika z zakładkami:
  - **Profil** - Wyświetlanie i edycja danych osobowych, zmiana hasła
  - **Nowy Meldunek** - Formularz tworzenia meldunku z automatyczną analizą AI
  - **Admin** ⭐ - Panel administracyjny (tylko dla administratorów)
- **`/meldunki`** - Lista wszystkich meldunków z zaawansowanym filtrowaniem i sortowaniem

### 🔐 Autoryzacja i bezpieczeństwo

#### Rejestracja i aktywacja konta
- **Formularz rejestracji** - Wymagane pola: email, hasło, wybór jednostki OSP, opcjonalnie imię i nazwisko
- **Walidacja hasła** - Min. 8 znaków, wielka litera, cyfra, znak specjalny
- **E-mail aktywacyjny** - Po rejestracji użytkownik otrzymuje e-mail z linkiem aktywacyjnym
- **Aktywacja konta** - Kliknięcie w link aktywuje konto i przekierowuje do logowania
- **Automatyczne tworzenie profilu** - Po rejestracji automatycznie tworzony jest profil w bazie danych

#### Logowanie i sesje
- **Bezpieczne logowanie** - Email i hasło z walidacją po stronie serwera
- **Sesje JWT** - Tokeny dostępowe z 7-dniową ważnością
- **Automatyczne odświeżanie** - System automatycznie odnawia wygasające tokeny
- **Persystencja sesji** - Użytkownik pozostaje zalogowany między sesjami przeglądarki

#### Reset hasła
- **Inicjacja resetu** - Użytkownik może poprosić o reset na `/forgot-password`
- **E-mail resetujący** - System wysyła bezpieczny link na podany adres
- **Strona resetu** - Dedykowana strona `/reset-password` z walidacją tokena
- **Walidacja nowego hasła** - Te same wymagania co przy rejestracji
- **Rate limiting** - Ochrona przed nadużyciami (max 3 żądania na godzinę)
- **Reset przez administratora** - Admin może wysłać e-mail resetujący dla dowolnego użytkownika

### 👤 Role użytkowników

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
- **Pełne uprawnienia** - Dostęp do wszystkich funkcji aplikacji
- **Uprawnienia administracyjne:**
  - ✅ Zarządzanie użytkownikami jednostki (przeglądanie, usuwanie, resetowanie haseł)
  - ✅ Zmiana ról użytkowników (awansowanie/degradowanie)
  - ✅ Przeglądanie wszystkich meldunków jednostki
  - ✅ Edycja i usuwanie dowolnego meldunku w jednostce
  - ✅ Dostęp do szczegółowych statystyk jednostki
- **Ograniczenia bezpieczeństwa:**
  - Nie może usunąć własnego konta
  - Może zarządzać tylko użytkownikami ze swojej jednostki OSP

### 👥 Panel administracyjny ⭐

**Dostęp:** Tylko dla użytkowników z rolą `admin` (pojawia się jako trzecia zakładka w dashboardzie)

#### Zarządzanie użytkownikami jednostki
- **Lista użytkowników** - Przegląd wszystkich członków jednostki (imię, nazwisko, email, rola, data rejestracji)
- **Usuwanie użytkowników** - Trwałe usunięcie konta z systemu (z wyjątkiem własnego konta)
- **Reset hasła użytkownika** - Wysyłka e-maila resetującego hasło dla wybranego użytkownika
- **Zmiana ról** - Awansowanie/degradowanie użytkowników (member ↔ admin)

#### Zarządzanie meldunkami jednostki
- **Przegląd wszystkich meldunków** - Pełny dostęp do wszystkich meldunków w jednostce
- **Filtrowanie po użytkownikach** - Sprawdzenie aktywności poszczególnych członków
- **Edycja meldunków** - Modyfikacja dowolnego meldunku w jednostce
- **Usuwanie meldunków** - Możliwość usunięcia dowolnego meldunku

#### Statystyki jednostki
- **Liczba użytkowników** - Całkowita liczba członków jednostki
- **Liczba meldunków** - Wszystkie meldunki w systemie jednostki
- **Aktywni użytkownicy** - Liczba użytkowników z aktywnością w ostatnich 30 dniach
- **Meldunki w bieżącym miesiącu** - Statystyki miesięczne
- **Najaktywniejszy użytkownik** - Ranking aktywności (najwięcej meldunków)

📖 **Jak utworzyć konto administratora:** Zobacz [../ADMIN_SETUP.md](../ADMIN_SETUP.md)

### API Endpoints

#### Autoryzacja
- `POST /api/auth/register` - Rejestracja użytkownika (wysyłka e-maila aktywacyjnego)
- `POST /api/auth/login` - Logowanie (zwraca sesję JWT)
- `POST /api/auth/logout` - Wylogowanie (unieważnienie sesji)
- `GET /api/auth/profile` - Pobierz profil użytkownika
- `PATCH /api/auth/profile` - Edytuj profil użytkownika
- `POST /api/auth/change-password` - Zmiana hasła (wymagane aktualne hasło)
- `POST /api/auth/forgot-password` - Prośba o reset hasła (wysyłka e-maila)
- `POST /api/auth/reset-password` - Reset hasła używając tokena z e-maila

#### Meldunki
- `GET /api/meldunki` - Lista meldunków (z filtrowaniem i sortowaniem)
- `POST /api/meldunki` - Utwórz nowy meldunek
- `GET /api/meldunki/[id]` - Szczegóły meldunku
- `PATCH /api/meldunki/[id]` - Edytuj meldunek
- `DELETE /api/meldunki/[id]` - Usuń meldunek
- `POST /api/meldunki/[id]/analyze` - Analiza AI meldunku

#### Panel administracyjny
- `GET /api/admin/users` - Lista użytkowników jednostki (tylko dla adminów)
- `DELETE /api/admin/users/[id]` - Usuń użytkownika (tylko dla adminów, z wyjątkiem własnego konta)
- `POST /api/admin/users/[id]/reset-password` - Wysyłka e-maila resetującego hasło (tylko dla adminów)
- `PATCH /api/admin/users/[id]/role` - Zmiana roli użytkownika (member ↔ admin)
- `GET /api/admin/statistics` - Statystyki jednostki (liczba użytkowników, meldunków, aktywność)

### Struktura projektu

```
src/
├── pages/
│   ├── api/              # API endpoints
│   ├── dashboard.astro   # Dashboard z panelami
│   ├── login.astro       # Strona logowania
│   ├── register.astro    # Strona rejestracji
│   └── meldunki.astro    # Lista meldunków
├── layouts/
│   ├── Layout.astro      # Główny layout
│   └── Dashboard.astro   # Layout dashboardu z panelami
├── components/
│   ├── Header.astro      # Nagłówek z nawigacją
│   ├── Footer.astro      # Stopka
│   └── ui/               # Komponenty shadcn/ui
├── lib/
│   ├── services/        # Serwisy biznesowe
│   ├── db/              # Integracja z Supabase
│   ├── utils/           # Narzędzia pomocnicze
│   └── validation/      # Walidacja danych
└── styles/
    ├── globals.css      # Style globalne (primary = czerwony)
    └── design-system.css # Design system
```

## 🎨 Styl i design

- **Primary color:** Czerwony (#dc2626) - Kolorystyka OSP
- **Framework:** Tailwind CSS 4
- **Komponenty:** shadcn/ui
- **Ikony:** Material Icons
- **Responsywność:** Mobile-first approach

## 🧪 Testy

Szczegółowe informacje o testach: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

```bash
# Testy jednostkowe
npm run test

# Testy E2E
npm run test:e2e

# Pokrycie kodem
npm run test:coverage
```

## 📚 Dokumentacja

- **Główny README:** [../README.md](../README.md)
- **Instrukcja Admin:** [../ADMIN_SETUP.md](../ADMIN_SETUP.md)
- **Przewodnik testów:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Quick Start:** [../QUICK_START.md](../QUICK_START.md)

---

# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
