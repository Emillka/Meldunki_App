# FireLog (Meldunki_App)

Nowoczesny system do rejestrowania i zarządzania meldunkami dla jednostek OSP.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/yourusername/firelog)
[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow.svg)](https://github.com/yourusername/firelog)

## ⭐ Główne atuty aplikacji

**FireLog** to nowoczesny, kompleksowy system do zarządzania meldunkami dla jednostek Ochotniczej Straży Pożarnej. Aplikacja oferuje pełne zarządzanie użytkownikami, bezpieczną autoryzację, inteligentną analizę danych oraz szczegółowe statystyki jednostki.

### 🎯 Funkcjonalność
- ✅ **Kompletny system CRUD** dla meldunków z zaawansowanym filtrowaniem i sortowaniem
- ✅ **Zaawansowany panel administracyjny** z pełnym zarządzaniem użytkownikami jednostki
- ✅ **AI-powered analiza** - Automatyczna kategoryzacja i generowanie podsumowań meldunków
- ✅ **Bezpieczeństwo klasy enterprise** - RLS, JWT, rate limiting, walidacja danych
- ✅ **System ról użytkowników** - Role administratora i zwykłego użytkownika (member)
- ✅ **Zarządzanie użytkownikami** - Dodawanie, usuwanie, edycja, resetowanie haseł
- ✅ **Szczegółowe statystyki** - Metryki jednostki, aktywności użytkowników, najaktywniejszy strażak
- ✅ **System e-maili** - Aktywacyjne maile rejestracyjne i e-maile resetowania hasła

### 🚀 Technologia
- ✅ **Nowoczesny stack** - Astro 5, React 19, TypeScript 5, Tailwind CSS 4
- ✅ **Supabase backend** - Skalowalna baza PostgreSQL z wbudowaną autoryzacją
- ✅ **OpenRouter.ai** - Dostęp do najnowszych modeli AI (GPT-4, Claude, Gemini)
- ✅ **Responsywny design** - Pełne wsparcie dla mobile, tablet i desktop

### 🧪 Jakość
- ✅ **Pokrycie testami >90%** - Unit, E2E, integracyjne, dostępności
- ✅ **CI/CD** - Automatyczne testy i deployment przy każdej zmianie
- ✅ **WCAG 2.1 AA** - Pełna dostępność dla użytkowników z niepełnosprawnościami
- ✅ **Lighthouse >90** - Doskonała wydajność i SEO

### 👥 Zarządzanie jednostką
- ✅ **Pełna kontrola** - Administratorzy mogą zarządzać wszystkimi meldunkami i użytkownikami
- ✅ **Statystyki jednostki** - Metryki aktywności, liczby meldunków, najaktywniejszych użytkowników
- ✅ **Zarządzanie rolami** - Awansowanie/degradowanie członków jednostki
- ✅ **Przegląd danych** - Szybki dostęp do wszystkich informacji jednostki OSP

## Table of Contents

- [Główne atuty aplikacji](#-główne-atuty-aplikacji)
- [Szczegółowy opis funkcjonalności](#-szczegółowy-opis-funkcjonalności)
  - [System autoryzacji i bezpieczeństwa](#-system-autoryzacji-i-bezpieczeństwa)
  - [Role użytkowników](#-role-użytkowników)
  - [Panel użytkownika (Dashboard)](#-panel-użytkownika-dashboard)
  - [Zarządzanie meldunkami](#-zarządzanie-meldunkami)
  - [Analiza AI (OpenRouter.ai)](#-analiza-ai-openrouterai)
  - [Panel administracyjny](#-panel-administracyjny-)
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Creating Admin Account](#creating-admin-account)
- [Administrator Panel](#administrator-panel-)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
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

## 📖 Szczegółowy opis funkcjonalności

### 🔐 System autoryzacji i bezpieczeństwa

FireLog zapewnia kompleksowy system bezpieczeństwa oparty na najlepszych praktykach branżowych:

#### Rejestracja użytkowników
- **Rejestracja przez formularz** - Prosty formularz rejestracji na stronie `/register`
- **Walidacja danych** - Sprawdzanie poprawności emaila, siły hasła (min. 8 znaków, wielka litera, cyfra, znak specjalny)
- **Powiązanie z jednostką OSP** - Każdy użytkownik musi być przypisany do jednostki Ochotniczej Straży Pożarnej
- **Automatyczne tworzenie profilu** - Po rejestracji automatycznie tworzony jest profil użytkownika w bazie danych

#### E-maile aktywacyjne
- **Wysyłka maila potwierdzającego** - Po rejestracji użytkownik otrzymuje e-mail z linkiem aktywacyjnym
- **Link aktywacyjny** - Kliknięcie w link aktywuje konto i przekierowuje do strony logowania
- **Konfiguracja przekierowania** - Możliwość ustawienia docelowego URL po aktywacji konta
- **Bezpieczne tokeny** - Linki zawierają bezpieczne, czasowo ważne tokeny JWT

#### Logowanie i sesje
- **Bezpieczne logowanie** - Logowanie przez email i hasło z walidacją
- **Sesje JWT** - Bezpieczne przechowywanie tokenów dostępowych (7-dniowa ważność)
- **Automatyczne odświeżanie tokenów** - System automatycznie odnawia wygasające tokeny
- **Logowanie w tle** - Użytkownik pozostaje zalogowany między sesjami przeglądarki

#### Reset hasła
- **Inicjacja przez użytkownika** - Użytkownik może poprosić o reset hasła na stronie `/forgot-password`
- **E-mail resetujący** - System wysyła bezpieczny link resetujący na podany adres e-mail
- **Bezpieczna strona resetu** - Dedykowana strona `/reset-password` z walidacją tokena
- **Walidacja siły hasła** - Nowe hasło musi spełniać wymagania bezpieczeństwa
- **Rate limiting** - Ochrona przed nadużyciami (max 3 żądania na godzinę)
- **Admin może resetować hasła** - Administrator może wysłać e-mail resetujący dla dowolnego użytkownika z jednostki

#### Bezpieczeństwo systemu
- **Row Level Security (RLS)** - Ochrona danych na poziomie bazy danych PostgreSQL
- **Rate limiting** - Ograniczenie liczby żądań API (ochrona przed brute-force i nadużyciami)
- **Walidacja wejścia** - Sanityzacja wszystkich danych wejściowych przed przetworzeniem
- **Hashowanie haseł** - Hasła przechowywane w bezpiecznej formie (bcrypt przez Supabase)
- **Ochrona przed SQL Injection** - Użycie parametrowanych zapytań Supabase
- **Ochrona przed XSS** - Sanityzacja i escapowanie danych wyjściowych

### 👤 Role użytkowników

Aplikacja FireLog obsługuje system ról, który określa uprawnienia użytkowników:

#### Rola: Member (Strażak)
- **Domyślna rola** - Wszyscy nowo zarejestrowani użytkownicy otrzymują rolę `member`
- **Uprawnienia podstawowe**:
  - Tworzenie własnych meldunków
  - Przeglądanie i edycja własnych meldunków
  - Usuwanie własnych meldunków
  - Zarządzanie własnym profilem
  - Zmiana własnego hasła
- **Ograniczenia**:
  - Nie ma dostępu do panelu administracyjnego
  - Nie może przeglądać meldunków innych użytkowników (poza jednostką w trybie readonly)
  - Nie może zarządzać użytkownikami

#### Rola: Admin (Administrator)
- **Pełne uprawnienia** - Administrator ma dostęp do wszystkich funkcji aplikacji
- **Uprawnienia administracyjne**:
  - ✅ **Zarządzanie użytkownikami jednostki**:
    - Przeglądanie wszystkich użytkowników w jednostce
    - Usuwanie kont użytkowników (z wyjątkiem własnego konta)
    - Wysyłanie e-maili resetujących hasło dla innych użytkowników
    - Zmiana ról użytkowników (awansowanie/degradowanie: member ↔ admin)
  - ✅ **Zarządzanie meldunkami jednostki**:
    - Przeglądanie wszystkich meldunków w jednostce
    - Edycja dowolnego meldunku w jednostce
    - Usuwanie dowolnego meldunku w jednostce
  - ✅ **Statystyki jednostki**:
    - Liczba wszystkich użytkowników
    - Liczba wszystkich meldunków
    - Liczba aktywnych użytkowników (ostatnie 30 dni)
    - Liczba meldunków w bieżącym miesiącu
    - Najaktywniejszy użytkownik (ranking)
  - ✅ **Wszystkie uprawnienia użytkownika zwykłego**
- **Ograniczenia bezpieczeństwa**:
  - Administrator nie może usunąć własnego konta (zapobiega zablokowaniu jednostki)
  - Administrator może zarządzać tylko użytkownikami ze swojej jednostki OSP
  - Wszystkie operacje są logowane i weryfikowane przez RLS

### 📊 Panel użytkownika (Dashboard)

Każdy zalogowany użytkownik ma dostęp do wielozakładkowego dashboardu na stronie `/dashboard`:

#### Zakładka: Profil
- **Wyświetlanie danych profilu**:
  - Imię i nazwisko
  - Adres e-mail (tylko do odczytu)
  - Data rejestracji
  - Rola w systemie
  - Powiązana jednostka OSP
- **Edycja profilu**:
  - Zmiana imienia
  - Zmiana nazwiska
  - Walidacja wprowadzanych danych
- **Zmiana hasła**:
  - Wymagane podanie aktualnego hasła
  - Walidacja nowego hasła (min. 8 znaków, wymagania bezpieczeństwa)
  - Potwierdzenie nowego hasła

#### Zakładka: Nowy Meldunek
- **Formularz tworzenia meldunku**:
  - **Nazwa zdarzenia** (wymagane) - Tytuł meldunku
  - **Data zdarzenia** (wymagane) - Data i czas zdarzenia (picker daty)
  - **Lokalizacja** (opcjonalne) - Adres lub opis miejsca zdarzenia
  - **Opis** (wymagane) - Szczegółowy opis zdarzenia
  - **Siły i środki** (opcjonalne) - Użyte pojazdy, sprzęt, liczba strażaków
  - **Dowódca** (opcjonalne) - Imię i nazwisko dowódcy akcji
  - **Kierowca** (opcjonalne) - Imię i nazwisko kierowcy
- **Automatyczna analiza AI**:
  - Po zapisaniu, system automatycznie analizuje meldunek
  - Określa kategorię zdarzenia (Pożar, Miejscowe Zagrożenie, Wypadek Drogowy, Fałszywy Alarm, Inne)
  - Generuje krótkie podsumowanie (max 200 znaków)
- **Walidacja formularza**:
  - Sprawdzanie wymaganych pól przed wysłaniem
  - Walidacja formatu daty
  - Informacje zwrotne o błędach

#### Zakładka: Admin (tylko dla administratorów)
Pełny opis w sekcji [Panel Administracyjny](#administrator-panel-)

### 📝 Zarządzanie meldunkami

#### Tworzenie meldunków
- **Prosty formularz** - Intuicyjny formularz w zakładce "Nowy Meldunek" dashboardu
- **Walidacja danych** - Sprawdzanie poprawności przed zapisaniem
- **Automatyczna kategoryzacja** - System automatycznie określa typ zdarzenia używając AI
- **Generowanie podsumowania** - AI tworzy krótkie streszczenie meldunku

#### Przeglądanie meldunków
- **Lista meldunków** - Strona `/meldunki` z pełną listą wszystkich meldunków użytkownika
- **Dla administratorów** - Dostęp do wszystkich meldunków jednostki (parametr `department=true`)
- **Filtrowanie**:
  - Po dacie zdarzenia
  - Po kategorii (typie zdarzenia)
  - Po użytkowniku (dla administratorów)
- **Sortowanie**:
  - Po dacie zdarzenia (rosnąco/malejąco)
  - Po dacie utworzenia
  - Po nazwie zdarzenia
- **Paginacja** - Podział wyników na strony dla lepszej wydajności
- **Modalny podgląd** - Szybki dostęp do szczegółów bez przeładowania strony

#### Edycja meldunków
- **Edycja własnych meldunków** - Każdy użytkownik może edytować swoje meldunki
- **Edycja przez administratora** - Administrator może edytować wszystkie meldunki w jednostce
- **Walidacja** - Te same zasady walidacji co przy tworzeniu
- **Historia zmian** - Pola `created_at` i `updated_at` śledzą zmiany

#### Usuwanie meldunków
- **Usuwanie własnych** - Użytkownik może usunąć swoje meldunki
- **Usuwanie przez administratora** - Administrator może usunąć dowolny meldunek w jednostce
- **Potwierdzenie usunięcia** - Dialog potwierdzający przed usunięciem (zapobiega przypadkowym usunięciom)
- **Nieodwracalność** - Usunięcie jest trwałe (w przyszłości: soft delete/archiwizacja)

### 🤖 Analiza AI (OpenRouter.ai)

System wykorzystuje sztuczną inteligencję do automatycznej analizy meldunków:

#### Automatyczna kategoryzacja
- **Analiza opisu zdarzenia** - AI analizuje tekst opisu meldunku
- **Kategorie zdarzeń**:
  - 🔥 **Pożar** - Wszystkie zdarzenia związane z ogniem, dymem, spalaniem
  - 🚑 **Miejscowe Zagrożenie** - Inne sytuacje wymagające interwencji (zalania, usunięcie drzew, etc.)
  - 🚗 **Wypadek Drogowy** - Kolizje, zderzenia, wypadki komunikacyjne
  - 📞 **Fałszywy Alarm** - Nieprawdziwe zgłoszenia, ćwiczenia
  - ❓ **Inne** - Wszystkie pozostałe kategorie
- **Algorytm kategoryzacji**:
  - Analiza słów kluczowych w opisie
  - Integracja z OpenRouter.ai dla zaawansowanej analizy
  - Fallback do prostego algorytmu regułowego w przypadku braku połączenia z AI

#### Generowanie podsumowań
- **Krótkie streszczenie** - AI generuje zwięzłe podsumowanie meldunku (max 200 znaków)
- **Kluczowe informacje** - Podsumowanie zawiera najważniejsze fakty ze zdarzenia
- **Format**: `[Nazwa zdarzenia]. [Lokalizacja]. [Krótki opis]`
- **Automatyczne przycinanie** - System automatycznie skraca zbyt długie podsumowania

#### Integracja z OpenRouter.ai
- **Wielomodelowe API** - Dostęp do wielu modeli AI (GPT-4, Claude, Gemini)
- **Optymalizacja kosztów** - Wybór modelu w zależności od wymagań i kosztów
- **Obsługa błędów** - Fallback do prostego algorytmu w przypadku problemów z API
- **Rate limiting** - Ochrona przed nadmiernym użyciem API

### 👥 Panel administracyjny ⭐

Panel administracyjny jest dostępny wyłącznie dla użytkowników z rolą `admin` i pojawia się jako trzecia zakładka w dashboardzie.

#### 1. Zarządzanie użytkownikami jednostki

**Lista użytkowników:**
- **Przegląd wszystkich członków** - Pełna lista użytkowników przypisanych do jednostki OSP administratora
- **Wyświetlane informacje**:
  - Imię i nazwisko
  - Adres e-mail
  - Rola w systemie (Administrator / Strażak)
  - Data rejestracji
  - Status konta

**Operacje na użytkownikach:**

- **Usuwanie użytkowników**:
  - Przycisk "Usuń" przy każdym użytkowniku (poza własnym kontem)
  - Dialog potwierdzający przed usunięciem
  - Trwałe usunięcie konta z systemu (kaskadowe usunięcie z bazy danych)
  - Ochrona przed usunięciem własnego konta

- **Reset hasła użytkownika**:
  - Przycisk "Zresetuj hasło" przy każdym użytkowniku
  - Administrator wysyła e-mail resetujący hasło do wybranego użytkownika
  - Użytkownik otrzymuje standardowy e-mail z linkiem resetującym
  - Bezpieczny link przekierowuje na stronę `/reset-password`

- **Zmiana ról użytkowników**:
  - Awansowanie: `member` → `admin`
  - Degradowanie: `admin` → `member`
  - API endpoint: `PATCH /api/admin/users/[id]/role`
  - Walidacja uprawnień przed zmianą roli
  - Ochrona przed degradacją własnego konta (można zrezygnować z tej ochrony)

#### 2. Zarządzanie meldunkami jednostki

**Pełny dostęp do meldunków:**
- **Przegląd wszystkich meldunków** - Administrator widzi wszystkie meldunki utworzone przez użytkowników swojej jednostki
- **Filtrowanie**:
  - Po użytkowniku (sprawdzenie aktywności poszczególnych członków)
  - Po dacie zdarzenia
  - Po kategorii zdarzenia
- **Edycja dowolnego meldunku**:
  - Administrator może edytować każdy meldunek w jednostce
  - Przydatne do korygowania błędów w danych
  - Aktualizacja kategorii i podsumowania po zmianie opisu
- **Usuwanie meldunków**:
  - Możliwość usunięcia dowolnego meldunku w jednostce
  - Dialog potwierdzający przed usunięciem
  - Przydatne do archiwizacji nieprawidłowych lub przestarzałych meldunków

#### 3. Statystyki jednostki

Panel statystyk wyświetla kluczowe metryki jednostki OSP:

- **Liczba użytkowników** - Całkowita liczba zarejestrowanych członków jednostki
- **Liczba meldunków** - Całkowita liczba wszystkich meldunków w systemie jednostki
- **Aktywni użytkownicy** - Liczba użytkowników, którzy utworzyli meldunek w ostatnich 30 dniach
- **Meldunki w bieżącym miesiącu** - Liczba meldunków utworzonych w aktualnym miesiącu kalendarzowym
- **Najaktywniejszy użytkownik** - Imię i nazwisko użytkownika z największą liczbą meldunków (ranking ogólny)

**Aktualizacja statystyk:**
- Statystyki są ładowane przy otwarciu zakładki Admin
- Możliwość ręcznego odświeżenia danych
- Dane pobierane z bazy danych w czasie rzeczywistym

#### 4. Bezpieczeństwo panelu administracyjnego

- **Walidacja roli** - Każde żądanie API sprawdza, czy użytkownik ma rolę `admin`
- **Ochrona RLS** - Row Level Security zapewnia, że administrator widzi tylko dane swojej jednostki
- **Ograniczenia jednostki** - Administrator nie może zarządzać użytkownikami ani meldunkami z innych jednostek
- **Rate limiting** - Wszystkie operacje administracyjne są objęte limitem żądań
- **Logowanie operacji** - Wszystkie operacje administracyjne są logowane (w przyszłości: audit log)

📖 **Instrukcja tworzenia konta administratora:** Zobacz [ADMIN_SETUP.md](./ADMIN_SETUP.md)

#### 🎨 Interface i UX
- **Responsywny design** - Pełne wsparcie dla mobile, tablet i desktop
- **Design system** - Spójny styl z akcentem kolorystycznym OSP (czerwony)
- **Tailwind CSS + shadcn/ui** - Nowoczesne, dostępne komponenty
- **Material Icons** - Intuicyjne ikony dla lepszej nawigacji

#### ✅ Jakość i testy
- **Testy E2E (Playwright)** - Kompletne testy przepływów użytkownika
- **Testy jednostkowe (Vitest)** - Pokrycie >90% kodu
- **Testy dostępności** - Zgodność z WCAG 2.1 AA
- **Testy wydajności** - Lighthouse CI (>90 punktów)
- **CI/CD** - Automatyczne uruchamianie testów przy każdej zmianie

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

## Creating Admin Account

Aby uzyskać dostęp do panelu administracyjnego, musisz utworzyć konto administratora. System oferuje **trzy metody** tworzenia konta admina:

### Metoda 1: Skrypt SQL (ZALECANE) ⭐

Najprostsza i najszybsza metoda:

1. Otwórz [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt FireLog
3. Przejdź do zakładki **SQL Editor**
4. Skopiuj zawartość pliku `supabase/create-admin.sql`
5. Wklej do SQL Editor i kliknij **Run**

**Dane logowania:**
- Email: `admin@firelog.pl`
- Hasło: `Admin123!@#`
- ⚠️ **WAŻNE:** Zmień hasło po pierwszym logowaniu!

### Metoda 2: Skrypt Node.js

```bash
cd magenta-mass
npm install dotenv
node src/scripts/create-admin-user.js
```

### Metoda 3: Rejestracja + zmiana roli

1. Zarejestruj się przez `/register`
2. W Supabase Dashboard → Tabela `profiles` → Zmień `role` na `admin`

📖 **Szczegółowa instrukcja:** Zobacz [ADMIN_SETUP.md](./ADMIN_SETUP.md)

### Dostęp do panelu administracyjnego

Po zalogowaniu jako administrator:
1. Wejdź na `/login` i zaloguj się danymi administratora
2. Przejdź do `/dashboard`
3. Zakładka **"Admin"** pojawi się automatycznie (wcześniej ukryta dla zwykłych użytkowników)

## Administrator Panel

Panel administracyjny to kompleksowy system zarządzania jednostką OSP, dostępny wyłącznie dla użytkowników z rolą `admin`.

### 🎯 Główne funkcje

#### 1. Zarządzanie użytkownikami
- **Przegląd wszystkich członków** jednostki OSP
- **Lista z danymi** - Imię, nazwisko, email, data rejestracji, rola
- **Awansowanie/degradowanie** - Zmiana ról użytkowników (member ↔ admin)
- **Filtrowanie i wyszukiwanie** - Szybkie znajdowanie użytkowników

#### 2. Zarządzanie meldunkami jednostki
- **Pełny dostęp** - Przegląd wszystkich meldunków w jednostce
- **Edycja każdego meldunku** - Modyfikacja danych bez ograniczeń
- **Usuwanie meldunków** - Możliwość usunięcia dowolnego meldunku
- **Filtrowanie po użytkownikach** - Sprawdzenie aktywności poszczególnych członków

#### 3. Statystyki jednostki
- **Liczba użytkowników** - Wszyscy członkowie jednostki
- **Liczba meldunków** - Wszystkie meldunki w systemie
- **Aktywni użytkownicy** - Członkowie z aktywnością w ostatnim okresie
- **Meldunki w bieżącym miesiącu** - Statystyki miesięczne
- **Najaktywniejszy użytkownik** - Ranking aktywności

#### 4. Uprawnienia administratora

Zgodnie z regulaminem aplikacji, administrator jednostki OSP ma prawo do:

✅ **Zarządzania użytkownikami jednostki**
- Tworzenie kont dla nowych członków
- Przeglądanie listy użytkowników
- Zmiana ról i uprawnień
- Usuwanie kont (w przyszłości)

✅ **Przeglądania wszystkich meldunków jednostki**
- Pełny dostęp do wszystkich meldunków
- Filtrowanie i wyszukiwanie
- Eksport danych (planowane)

✅ **Edycji i usuwania meldunków w jednostce**
- Modyfikacja każdego meldunku
- Korekta błędów w danych
- Archiwizacja nieaktualnych meldunków

✅ **Dostępu do statystyk jednostki**
- Metryki użytkowania
- Analiza aktywności
- Raporty okresowe (planowane)

### 🔒 Bezpieczeństwo

- **Ochrona RLS** - Tylko administratorzy widzą dane swojej jednostki
- **Walidacja roli** - Sprawdzanie uprawnień przed każdą operacją
- **Rate limiting** - Ochrona przed nadużyciami API
- **Audit log** - Logowanie operacji administracyjnych (planowane)

### 📊 Interfejs panelu

Panel jest zintegrowany w Dashboard jako trzecia zakładka:
- **Automatyczna widoczność** - Pojawia się tylko dla administratorów
- **Responsywny design** - Działa na wszystkich urządzeniach
- **Intuicyjna nawigacja** - Łatwy dostęp do wszystkich funkcji

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

#### 1. Authorization & Security
- ✅ User registration with email and password
- ✅ Secure login and logout functionality
- ✅ User session persistence with JWT tokens (7-day validity)
- ✅ Password hashing using bcrypt
- ✅ Protected routes accessible only to authenticated users
- ✅ Password reset functionality
- ✅ Rate limiting for API protection
- ✅ Row Level Security (RLS) in database

#### 2. CRUD Operations for Reports (Meldunki)
Każdy meldunek zawiera m.in.:
- nazwę zdarzenia, datę
- opis i lokalizację (adres)
- siły i środki, dowódca, kierowca
- status i typ (wyliczane przez logikę/AI)

Operations:
- ✅ **Create**: Add new action reports
- ✅ **Read**: View list and details of all reports (with filtering, sorting, pagination)
- ✅ **Update**: Edit existing reports
- ✅ **Delete**: Remove reports

#### 3. AI-Powered Business Logic
- ✅ Automatyczna kategoryzacja zdarzeń (AI) - Pożar, Miejscowe Zagrożenie, Wypadek Drogowy, Fałszywy Alarm, Inne
- ✅ Generowanie `summary` (krótki opis) przez AI
- ✅ Integracja z OpenRouter.ai (GPT-4, Claude, Gemini)
- ✅ Inteligentna analiza opisu zdarzenia

#### 4. Administrator Panel ⭐
- ✅ Panel administracyjny dla użytkowników z rolą `admin`
- ✅ Zarządzanie użytkownikami jednostki OSP
- ✅ Przegląd wszystkich meldunków jednostki
- ✅ Edycja i usuwanie meldunków w jednostce
- ✅ Statystyki jednostki (liczba użytkowników, meldunków, aktywność)
- ✅ Zarządzanie rolami użytkowników (awansowanie/degradowanie)
- ✅ Lista członków z danymi kontaktowymi

📖 **Instrukcja:** [ADMIN_SETUP.md](./ADMIN_SETUP.md)

#### 5. Testing
- ✅ Unit tests for text analysis functions
- ✅ End-to-end tests for report submission (Playwright)
- ✅ Component tests (React Testing Library)
- ✅ Integration tests with MSW
- ✅ Accessibility tests (WCAG 2.1 AA)
- ✅ Performance tests (Lighthouse CI)

#### 6. CI/CD
- ✅ Automatic test execution on repository changes
- ✅ Coverage reporting (>90% threshold)
- ✅ Automated deployment pipeline (GitHub Actions)

### Out of Scope (for MVP) 🚫

The following features are planned for future releases:

- ~~Advanced user roles and permissions system~~ ✅ **IMPLEMENTED** - Basic admin role system
- SMS notifications
- PDF report generation
- Monthly statistics and charts (basic stats ✅ implemented)
- Map integrations
- Email notification system
- Multi-unit administration dashboard
- Advanced audit logging
- Bulk operations for meldunki

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
