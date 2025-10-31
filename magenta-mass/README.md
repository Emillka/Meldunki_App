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
- **`/login`** - Logowanie użytkowników
- **`/register`** - Rejestracja nowych użytkowników
- **`/dashboard`** - Panel użytkownika z zakładkami:
  - **Profil** - Zarządzanie danymi osobowymi i hasłem
  - **Nowy Meldunek** - Formularz tworzenia meldunku
  - **Admin** ⭐ - Panel administracyjny (tylko dla administratorów)
- **`/meldunki`** - Lista wszystkich meldunków z filtrowaniem i sortowaniem

### Panel administracyjny ⭐

**Dostęp:** Tylko dla użytkowników z rolą `admin`

**Funkcje:**
- Zarządzanie użytkownikami jednostki OSP
- Przegląd wszystkich meldunków jednostki
- Edycja i usuwanie meldunków w jednostce
- Statystyki jednostki (liczba użytkowników, meldunków, aktywność)
- Awansowanie/degradowanie użytkowników

📖 **Jak utworzyć konto administratora:** Zobacz [../ADMIN_SETUP.md](../ADMIN_SETUP.md)

### API Endpoints

#### Autoryzacja
- `POST /api/auth/register` - Rejestracja użytkownika
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/logout` - Wylogowanie
- `GET /api/auth/profile` - Pobierz profil użytkownika
- `POST /api/auth/reset-password` - Reset hasła

#### Meldunki
- `GET /api/meldunki` - Lista meldunków (z filtrowaniem i sortowaniem)
- `POST /api/meldunki` - Utwórz nowy meldunek
- `GET /api/meldunki/[id]` - Szczegóły meldunku
- `PATCH /api/meldunki/[id]` - Edytuj meldunek
- `DELETE /api/meldunki/[id]` - Usuń meldunek
- `POST /api/meldunki/[id]/analyze` - Analiza AI meldunku

#### Panel administracyjny
- `GET /api/admin/users` - Lista użytkowników jednostki
- `PATCH /api/admin/users/[id]/role` - Zmiana roli użytkownika
- `GET /api/admin/statistics` - Statystyki jednostki

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
