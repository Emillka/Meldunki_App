# FireLog (Meldunki_App)

System do rejestrowania i zarządzania meldunkami dla jednostek OSP.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/yourusername/firelog)
[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow.svg)](https://github.com/yourusername/firelog)

## Opis aplikacji

FireLog to system do rejestrowania i zarządzania meldunkami dla jednostek Ochotniczej Straży Pożarnej. Aplikacja umożliwia zarządzanie użytkownikami, autoryzację, analizę danych oraz przegląd statystyk jednostki.

### Funkcjonalność
- Operacje CRUD dla meldunków z filtrowaniem i sortowaniem
- Panel administracyjny z zarządzaniem użytkownikami jednostki
- Automatyczna analiza AI - kategoryzacja i generowanie podsumowań meldunków
- Zabezpieczenia - RLS, JWT, rate limiting, walidacja danych
- System ról użytkowników - role administratora i zwykłego użytkownika (member)
- Zarządzanie użytkownikami - przeglądanie i usuwanie użytkowników jednostki
- Statystyki jednostki - metryki aktywności, liczba użytkowników i meldunków
- System e-maili - aktywacyjne maile rejestracyjne i resetujące hasło

### Technologia
- Stack: Astro 5, React 19, TypeScript 5, Tailwind CSS 4
- Backend: Supabase (PostgreSQL z autoryzacją)
- AI: OpenRouter.ai (dostęp do modeli GPT-4, Claude, Gemini)
- Responsywny design - obsługa urządzeń mobilnych, tabletów i desktopów

### Testy i jakość
- Pokrycie testami >90% - testy jednostkowe, E2E, integracyjne, dostępności
- CI/CD - automatyczne testy przy zmianach
- Zgodność z WCAG 2.1 AA
- Lighthouse score >90

### Zarządzanie jednostką
- Administratorzy mogą zarządzać meldunkami i użytkownikami
- Statystyki jednostki - metryki aktywności, liczba meldunków i użytkowników
- Przegląd danych jednostki OSP

## Spis treści

- [Opis aplikacji](#opis-aplikacji)
- [Szczegółowy opis funkcjonalności](#-szczegółowy-opis-funkcjonalności)
  - [System autoryzacji i bezpieczeństwa](#-system-autoryzacji-i-bezpieczeństwa)
  - [Role użytkowników](#-role-użytkowników)
  - [Panel użytkownika (Dashboard)](#-panel-użytkownika-dashboard)
  - [Zarządzanie meldunkami](#-zarządzanie-meldunkami)
  - [Analiza AI (OpenRouter.ai)](#-analiza-ai-openrouterai)
  - [Panel administracyjny](#-panel-administracyjny-)
- [Opis projektu](#opis-projektu)
- [Stack technologiczny](#stack-technologiczny)
- [Uruchomienie lokalne](#uruchomienie-lokalne)
- [Tworzenie konta administratora](#tworzenie-konta-administratora)
- [Panel administracyjny](#panel-administracyjny)
- [Dostępne skrypty](#dostępne-skrypty)
- [Testy](#testy)
- [Zakres projektu](#zakres-projektu)
- [Status projektu](#status-projektu)
- [Licencja](#licencja)

## Opis projektu

**FireLog** to aplikacja webowa do tworzenia i zarządzania meldunkami przez jednostki Ochotniczej Straży Pożarnej. Aplikacja umożliwia elektroniczne rejestrowanie zdarzeń i zastępuje tradycyjne systemy papierowe.

### Problem

Większość jednostek OSP prowadzi meldunki w zeszytach, arkuszach Excel lub nieformalnych systemach. To powoduje problemy:

- Trudności w wyszukiwaniu historycznych danych
- Brak możliwości efektywnej analizy liczby i typów interwencji
- Komplikacje w raportowaniu do komend lub urzędów

### Rozwiązanie

Aplikacja rozwiązuje te problemy poprzez:

- **Centralizację wszystkich meldunków** w jednym miejscu
- **Automatyczną analizę danych** z użyciem AI do kategoryzacji i podsumowań
- **Operacje CRUD** do zarządzania meldunkami
- **Bezpieczny dostęp** przez autoryzację email i hasło
- **Trwałość danych** dzięki sesjom JWT

## Szczegółowy opis funkcjonalności

### System autoryzacji i bezpieczeństwa

FireLog implementuje zabezpieczenia zgodnie ze standardowymi praktykami:

#### Rejestracja użytkowników
- Rejestracja przez formularz na stronie `/register`
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

#### Bezpieczeństwo systemu
- **Row Level Security (RLS)** - Ochrona danych na poziomie bazy danych PostgreSQL
- **Rate limiting** - Ograniczenie liczby żądań API (ochrona przed brute-force i nadużyciami)
- **Walidacja wejścia** - Sanityzacja wszystkich danych wejściowych przed przetworzeniem
- **Hashowanie haseł** - Hasła przechowywane w bezpiecznej formie (bcrypt przez Supabase)
- **Ochrona przed SQL Injection** - Użycie parametrowanych zapytań Supabase
- **Ochrona przed XSS** - Sanityzacja i escapowanie danych wyjściowych

### Role użytkowników

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
- Administrator ma dostęp do wszystkich funkcji aplikacji
- **Uprawnienia administracyjne**:
  - **Zarządzanie użytkownikami jednostki**:
    - Przeglądanie wszystkich użytkowników w jednostce
    - Usuwanie kont użytkowników (z wyjątkiem własnego konta)
  - **Zarządzanie meldunkami jednostki**:
    - Przeglądanie wszystkich meldunków w jednostce
    - Usuwanie dowolnego meldunku w jednostce
  - **Statystyki jednostki**:
    - Liczba wszystkich użytkowników
    - Liczba wszystkich meldunków
    - Liczba aktywnych użytkowników (ostatnie 30 dni)
    - Liczba meldunków w bieżącym miesiącu
    - Najaktywniejszy użytkownik (ranking)
  - **Wszystkie uprawnienia użytkownika zwykłego**
- **Ograniczenia bezpieczeństwa**:
  - Administrator nie może usunąć własnego konta (zapobiega zablokowaniu jednostki)
  - Administrator może zarządzać tylko użytkownikami ze swojej jednostki OSP
  - Wszystkie operacje są logowane i weryfikowane przez RLS

### Panel użytkownika (Dashboard)

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
Szczegóły w sekcji [Panel Administracyjny](#administrator-panel-)

### Zarządzanie meldunkami

#### Tworzenie meldunków
- Formularz w zakładce "Nowy Meldunek" dashboardu
- **Walidacja danych** - Sprawdzanie poprawności przed zapisaniem
- **Automatyczna kategoryzacja** - System automatycznie określa typ zdarzenia używając AI
- **Generowanie podsumowania** - AI tworzy krótkie streszczenie meldunku

#### Przeglądanie meldunków
- Lista meldunków - strona `/meldunki` z listą wszystkich meldunków użytkownika
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
- Modalny podgląd - dostęp do szczegółów bez przeładowania strony

#### Edycja meldunków
- **Edycja własnych meldunków** - Każdy użytkownik może edytować swoje meldunki
- **Walidacja** - Te same zasady walidacji co przy tworzeniu
- **Historia zmian** - Pola `created_at` i `updated_at` śledzą zmiany

#### Usuwanie meldunków
- **Usuwanie własnych** - Użytkownik może usunąć swoje meldunki
- **Usuwanie przez administratora** - Administrator może usunąć dowolny meldunek w jednostce
- **Potwierdzenie usunięcia** - Dialog potwierdzający przed usunięciem (zapobiega przypadkowym usunięciom)
- **Nieodwracalność** - Usunięcie jest trwałe (w przyszłości: soft delete/archiwizacja)

### Analiza AI (OpenRouter.ai)

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
  - Integracja z OpenRouter.ai dla analizy
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

### Panel administracyjny

Panel administracyjny jest dostępny wyłącznie dla użytkowników z rolą `admin` i pojawia się jako trzecia zakładka w dashboardzie.

#### 1. Zarządzanie użytkownikami jednostki

**Lista użytkowników:**
- Przegląd wszystkich członków - lista użytkowników przypisanych do jednostki OSP administratora
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


#### 2. Zarządzanie meldunkami jednostki

Dostęp do meldunków:
- **Przegląd wszystkich meldunków** - Administrator widzi wszystkie meldunki utworzone przez użytkowników swojej jednostki
- **Filtrowanie**:
  - Po użytkowniku (sprawdzenie aktywności poszczególnych członków)
  - Po dacie zdarzenia
  - Po kategorii zdarzenia
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

Instrukcja tworzenia konta administratora: [ADMIN_SETUP.md](./ADMIN_SETUP.md)

#### Interface i UX
- Responsywny design - obsługa urządzeń mobilnych, tabletów i desktopów
- Spójny styl z kolorystyką OSP (czerwony)
- Tailwind CSS + shadcn/ui - komponenty UI
- Material Icons - ikony interfejsu

#### Testy i jakość
- Testy E2E (Playwright) - testy przepływów użytkownika
- Testy jednostkowe (Vitest) - pokrycie >90% kodu
- Testy dostępności - zgodność z WCAG 2.1 AA
- Testy wydajności - Lighthouse CI (>90 punktów)
- CI/CD - automatyczne uruchamianie testów przy zmianach

## Stack technologiczny

### Frontend
- **[Astro 5](https://astro.build/)** - framework webowy z minimalnym JavaScriptem
- **[React 19](https://react.dev/)** - komponenty interaktywne
- **[TypeScript 5](https://www.typescriptlang.org/)** - statyczne typowanie
- **[Tailwind CSS 4](https://tailwindcss.com/)** - framework CSS utility-first
- **[shadcn/ui](https://ui.shadcn.com/)** - biblioteka komponentów React

### Backend
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
  - Baza danych PostgreSQL
  - Wbudowana autoryzacja użytkowników
  - SDK dla wielu języków
  - Możliwość self-hosting

### Integracja AI
- **[OpenRouter.ai](https://openrouter.ai/)** - gateway do modeli AI
  - Dostęp do wielu dostawców AI (OpenAI, Anthropic, Google, etc.)
  - Wybór modelu w zależności od kosztów
  - Limity wydatków na API key

### Testy i jakość kodu
- **[Vitest](https://vitest.dev/)** - framework testów jednostkowych
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)** - narzędzia do testowania komponentów React
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro/)** - symulacja interakcji użytkownika
- **[MSW (Mock Service Worker)](https://mswjs.io/)** - mockowanie API w testach integracyjnych
- **[@faker-js/faker](https://fakerjs.dev/)** - generowanie danych testowych
- **[Playwright](https://playwright.dev/)** - testy end-to-end w różnych przeglądarkach
- **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** - testy dostępności
- **[c8](https://github.com/bcoe/c8)** - raportowanie pokrycia kodu
- **[lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)** - automatyczne testy wydajności

### CI/CD i hosting
- **GitHub Actions** - testy i deployment
- **Render** lub Docker/Nginx

### URL produkcji

Zobacz `RENDER_DEPLOYMENT_GUIDE.md`. Po wdrożeniu uzupełnij URL:

- URL aplikacji: <do uzupełnienia>

## Uruchomienie lokalne

### Wymagania

Przed rozpoczęciem zainstaluj:

- **Node.js** (wersja 18.0.0 lub wyższa)
- **npm** (wersja 9.0.0 lub wyższa)
- **Git**

### Instalacja

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/yourusername/firelog.git
   cd firelog
   ```

2. Przejdź do katalogu projektu:
   ```bash
   cd magenta-mass
   ```

3. Zainstaluj zależności:
   ```bash
   npm install
   ```

4. Skonfiguruj zmienne środowiskowe:
   Skopiuj `magenta-mass/test.env.example` do `magenta-mass/.env` i uzupełnij:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcjonalne, dla serwera)

5. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```

6. Otwórz przeglądarkę i przejdź do `http://localhost:4321`

## Tworzenie konta administratora

Aby uzyskać dostęp do panelu administracyjnego, należy utworzyć konto administratora. Dostępne są trzy metody:

### Metoda 1: Skrypt SQL (zalecane)

Metoda:

1. Otwórz [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt FireLog
3. Przejdź do zakładki **SQL Editor**
4. Skopiuj zawartość pliku `supabase/create-admin.sql`
5. Wklej do SQL Editor i kliknij **Run**

**Dane logowania:**
- Email: `admin@firelog.pl`
- Hasło: `Admin123!@#`
- **Ważne:** Zmień hasło po pierwszym logowaniu

### Metoda 2: Skrypt Node.js

```bash
cd magenta-mass
npm install dotenv
node src/scripts/create-admin-user.js
```

### Metoda 3: Rejestracja + zmiana roli

1. Zarejestruj się przez `/register`
2. W Supabase Dashboard → Tabela `profiles` → Zmień `role` na `admin`

Szczegółowa instrukcja: [ADMIN_SETUP.md](./ADMIN_SETUP.md)

### Dostęp do panelu administracyjnego

Po zalogowaniu jako administrator:
1. Wejdź na `/login` i zaloguj się danymi administratora
2. Przejdź do `/dashboard`
3. Zakładka **"Admin"** pojawi się automatycznie (wcześniej ukryta dla zwykłych użytkowników)

## Panel administracyjny

Panel administracyjny umożliwia zarządzanie jednostką OSP i jest dostępny wyłącznie dla użytkowników z rolą `admin`.

### Główne funkcje

#### 1. Zarządzanie użytkownikami
- **Przegląd wszystkich członków** jednostki OSP
- **Lista z danymi** - Imię, nazwisko, email, data rejestracji, rola
- **Usuwanie użytkowników** - Możliwość usunięcia konta użytkownika (z wyjątkiem własnego konta)

**Uwaga:** Administrator może tylko przeglądać i usuwać użytkowników. Nie ma możliwości:
- Dodawania nowych użytkowników (rejestracja odbywa się przez formularz `/register`)
- Edycji danych użytkowników
- Resetowania haseł innych użytkowników
- Zmiany ról użytkowników (awansowanie/degradowanie)

#### 2. Zarządzanie meldunkami jednostki
- Przegląd wszystkich meldunków w jednostce
- **Usuwanie meldunków** - Możliwość usunięcia dowolnego meldunku w jednostce
- **Filtrowanie po użytkownikach** - Sprawdzenie aktywności poszczególnych członków

**Uwaga:** Administrator może tylko przeglądać i usuwać meldunki. Nie ma możliwości edycji cudzych meldunków.

#### 3. Statystyki jednostki
- **Liczba użytkowników** - Wszyscy członkowie jednostki
- **Liczba meldunków** - Wszystkie meldunki w systemie
- **Aktywni użytkownicy** - Członkowie z aktywnością w ostatnim okresie
- **Meldunki w bieżącym miesiącu** - Statystyki miesięczne
- **Najaktywniejszy użytkownik** - Ranking aktywności

#### 4. Uprawnienia administratora

Administrator jednostki OSP może:

- **Zarządzać użytkownikami jednostki**:
  - Przeglądanie listy użytkowników
  - Usuwanie kont użytkowników (z wyjątkiem własnego konta)

- **Przeglądać wszystkie meldunki jednostki**:
  - Dostęp do wszystkich meldunków swojej jednostki
  - Filtrowanie i wyszukiwanie
  - Eksport danych (planowane)

- **Usuwać meldunki w jednostce**:
  - Usuwanie dowolnego meldunku w jednostce
  - Archiwizacja nieaktualnych meldunków

- **Dostęp do statystyk jednostki**:
  - Metryki użytkowania
  - Analiza aktywności
  - Raporty okresowe (planowane)

### Bezpieczeństwo

- **Ochrona RLS** - Tylko administratorzy widzą dane swojej jednostki
- **Walidacja roli** - Sprawdzanie uprawnień przed każdą operacją
- **Rate limiting** - Ochrona przed nadużyciami API
- **Audit log** - Logowanie operacji administracyjnych (planowane)

### Interfejs panelu

Panel jest zintegrowany w Dashboard jako trzecia zakładka:
- **Automatyczna widoczność** - Pojawia się tylko dla administratorów
- **Responsywny design** - Działa na wszystkich urządzeniach
- Nawigacja z dostępem do wszystkich funkcji

## Dostępne skrypty

Dostępne skrypty w projekcie:

| Skrypt | Polecenie | Opis |
|--------|---------|-------------|
| **dev** | `npm run dev` | Uruchamia serwer deweloperski z hot-reload |
| **build** | `npm run build` | Buduje aplikację dla produkcji |
| **preview** | `npm run preview` | Podgląd builda produkcyjnego lokalnie |
| **astro** | `npm run astro` | Uruchamia komendy Astro CLI |

### Przykłady

```bash
# Uruchomienie serwera deweloperskiego
npm run dev

# Build dla produkcji
npm run build

# Podgląd builda produkcyjnego
npm run preview

# Komendy Astro CLI
npm run astro -- --help
```

## Testy

Testy jednostkowe (Vitest) i E2E (Playwright). Szczegóły: `magenta-mass/TESTING_GUIDE.md`.

### Strategia testów

#### Testy jednostkowe
- **Framework**: Vitest z środowiskiem jsdom dla komponentów React
- **Pokrycie**: c8 provider (>90% próg)
- **Zakres**: Logika biznesowa, funkcje walidacji, serwisy, narzędzia
- **Obszary**:
  - Logika autoryzacji i autentykacji
  - Walidacja i sanityzacja danych
  - Serwisy biznesowe (AuthService, MeldunkiService)
  - Funkcje pomocnicze

#### Testy integracyjne
- **Framework**: Vitest z MSW (Mock Service Worker)
- **Zakres**: Endpointy API, operacje bazodanowe, integracje zewnętrzne
- **Obszary**:
  - Autoryzacja Supabase i operacje bazodanowe
  - Integracja analizy AI OpenRouter.ai
  - Testowanie endpointów API z realistycznymi danymi
  - Polityki Row Level Security (RLS)

#### Testy komponentów
- **Framework**: React Testing Library z user-event
- **Zakres**: Komponenty React i interakcje użytkownika
- **Obszary**:
  - Komponenty formularzy z walidacją
  - Komponenty ClientSelect i SimpleSelect
  - Przepływy interakcji użytkownika
  - Zarządzanie stanem i aktualizacje UI

#### Testy end-to-end
- **Framework**: Playwright z obsługą wielu przeglądarek
- **Zakres**: Przepływy użytkownika w różnych przeglądarkach
- **Obszary**:
  - Rejestracja i autoryzacja użytkowników
  - Tworzenie, edycja i usuwanie meldunków
  - Kompatybilność między przeglądarkami (Chrome, Firefox, Safari, Edge)
  - Testy responsywności mobilnej

#### Testy dostępności
- **Framework**: @axe-core/playwright
- **Zakres**: Zgodność z WCAG 2.1 AA
- **Obszary**:
  - Nawigacja klawiaturą
  - Kompatybilność z czytnikami ekranu
  - Kontrast kolorów i dostępność wizualna
  - Dostępność formularzy i obsługa błędów

#### Testy wydajności
- **Framework**: lighthouse-ci
- **Zakres**: Core Web Vitals i metryki wydajności
- **Obszary**:
  - Czasy ładowania stron i optymalizacja rozmiaru bundle
  - Wyniki Lighthouse (>90 punktów)
  - Monitorowanie rozmiaru bundle (<500KB gzipped)

### Dostępne skrypty testów

| Skrypt | Polecenie | Opis |
|--------|---------|-------------|
| **test** | `npm run test` | Uruchamia testy jednostkowe w trybie watch |
| **test:run** | `npm run test:run` | Uruchamia testy jednostkowe raz |
| **test:ui** | `npm run test:ui` | Otwiera Vitest UI |
| **test:coverage** | `npm run test:coverage` | Uruchamia testy z raportem pokrycia |
| **test:watch** | `npm run test:watch` | Uruchamia testy w trybie watch |
| **test:e2e** | `npm run test:e2e` | Uruchamia testy end-to-end |
| **test:e2e:ui** | `npm run test:e2e:ui` | Otwiera Playwright UI |
| **test:e2e:debug** | `npm run test:e2e:debug` | Debug testów E2E |
| **test:accessibility** | `npm run test:accessibility` | Uruchamia testy dostępności |
| **test:performance** | `npm run test:performance` | Uruchamia testy wydajności |
| **test:all** | `npm run test:all` | Uruchamia wszystkie testy |

### Przykłady testów

```bash
# Uruchomienie wszystkich testów z pokryciem
npm run test:coverage

# Uruchomienie testów E2E w trybie debug
npm run test:e2e:debug

# Uruchomienie testów dostępności
npm run test:accessibility

# Uruchomienie testów wydajności
npm run test:performance
```

### Standardy jakości

Projekt wymusza standardy jakości:

- **Próg pokrycia**: >90% (branches, functions, lines, statements)
- **Wynik wydajności**: >90 (Lighthouse)
- **Dostępność**: 100% zgodność z WCAG 2.1 AA
- **Bezpieczeństwo**: Brak podatności wysokiego ryzyka (CVSS < 7.0)
- **Rozmiar bundle**: <500KB (gzipped)
- **Wykonanie testów**: Wszystkie testy muszą przejść przed deploymentem

## Zakres projektu

### Funkcjonalności MVP

Minimum Viable Product (MVP) obejmuje następujące funkcjonalności:

#### 1. Autoryzacja i bezpieczeństwo
- Rejestracja użytkowników przez email i hasło
- Logowanie i wylogowanie
- Sesje użytkowników z tokenami JWT (ważność 7 dni)
- Hashowanie haseł przez bcrypt
- Chronione trasy dostępne tylko dla zalogowanych użytkowników
- Funkcjonalność resetowania hasła
- Rate limiting dla ochrony API
- Row Level Security (RLS) w bazie danych

#### 2. Operacje CRUD dla meldunków
Każdy meldunek zawiera:
- nazwę zdarzenia, datę
- opis i lokalizację (adres)
- siły i środki, dowódca, kierowca
- status i typ (określane przez logikę/AI)

Operacje:
- **Create**: Dodawanie nowych meldunków
- **Read**: Przeglądanie listy i szczegółów meldunków (z filtrowaniem, sortowaniem, paginacją)
- **Update**: Edycja istniejących meldunków
- **Delete**: Usuwanie meldunków

#### 3. Logika biznesowa z AI
- Automatyczna kategoryzacja zdarzeń (AI) - Pożar, Miejscowe Zagrożenie, Wypadek Drogowy, Fałszywy Alarm, Inne
- Generowanie podsumowania (`summary`) przez AI
- Integracja z OpenRouter.ai (GPT-4, Claude, Gemini)
- Analiza opisu zdarzenia

#### 4. Panel administracyjny
- Panel administracyjny dla użytkowników z rolą `admin`
- Zarządzanie użytkownikami jednostki OSP (przeglądanie i usuwanie)
- Przegląd wszystkich meldunków jednostki
- Usuwanie meldunków w jednostce
- Statystyki jednostki (liczba użytkowników, meldunków, aktywność)
- Lista członków z danymi kontaktowymi

Instrukcja: [ADMIN_SETUP.md](./ADMIN_SETUP.md)

#### 5. Testy
- Testy jednostkowe funkcji analizy tekstu
- Testy end-to-end dla wysyłania meldunków (Playwright)
- Testy komponentów (React Testing Library)
- Testy integracyjne z MSW
- Testy dostępności (WCAG 2.1 AA)
- Testy wydajności (Lighthouse CI)

#### 6. CI/CD
- Automatyczne uruchamianie testów przy zmianach w repo
- Raportowanie pokrycia (>90% próg)
- Automatyczny pipeline deployment (GitHub Actions)

### Poza zakresem MVP

Następujące funkcjonalności są planowane w przyszłości:

- ~~Zaawansowany system ról i uprawnień~~ ZREALIZOWANE - Podstawowy system ról admin
- Powiadomienia SMS
- Generowanie raportów PDF
- Statystyki miesięczne i wykresy (podstawowe statystyki zrealizowane)
- Integracje z mapami
- System powiadomień e-mail
- Dashboard administracyjny wielu jednostek
- Zaawansowane logowanie audytu
- Operacje masowe na meldunki

### Planowane rozszerzenia

Funkcjonalności planowane po zakończeniu MVP:

- Generowanie raportów PDF
- Dashboard statystyk miesięcznych i wykresów
- Integracja z serwisami mapowymi
- System powiadomień e-mail i SMS
- Wsparcie dla wielu jednostek

## Status projektu

**Aktualna wersja:** 0.0.1 (MVP w rozwoju)

**Etap rozwoju:** Aktywny rozwój

### Kryteria sukcesu

MVP będzie uznane za kompletne gdy:

- Użytkownicy mogą tworzyć konta przez email i hasło
- Użytkownicy mogą się logować i wylogowywać
- System utrzymuje sesje użytkowników przez JWT
- Użytkownicy mogą dodawać, edytować i usuwać meldunki
- Funkcja analizy działa poprawnie
- Wszystkie testy przechodzą
- CI/CD automatycznie uruchamia testy przy zmianach

### Roadmap

- Faza 1: Autoryzacja i CRUD
- Faza 2: Testy i CI/CD
- Faza 3: Produkcja (Render/Nginx)
- Faza 4: Rozszerzenia po-MVP

## Licencja

Projekt obecnie nie ma przypisanej licencji. Informacje o licencji zostaną dodane w przyszłych wersjach.

---

**Uwaga:** Projekt jest w aktywnej fazie rozwoju. Funkcjonalności i dokumentacja mogą ulegać zmianom w miarę rozwoju aplikacji.

