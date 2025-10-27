# Setup Guide: POST /api/auth/register

## 🚀 Szybki Start

Endpoint rejestracji został zaimplementowany i jest gotowy do użycia. Poniżej znajdziesz instrukcje konfiguracji.

---

## 📋 Wymagania

### 1. Zmienne Środowiskowe

Utwórz plik `.env` w katalogu `magenta-mass/`:

```bash
cd magenta-mass
touch .env
```

Dodaj następujące zmienne:

```env
# Supabase Configuration (WYMAGANE)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Node Environment
NODE_ENV=development
```

**Gdzie znaleźć klucze Supabase:**
1. Przejdź do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Settings → API
4. Skopiuj:
   - `URL` → `PUBLIC_SUPABASE_URL`
   - `anon public` → `PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ NIGDY nie ujawniaj publicznie!)

---

## 🗄️ Weryfikacja Bazy Danych

### 1. Sprawdź czy tabele istnieją

Upewnij się, że w Supabase masz utworzone tabele:
- ✅ `provinces`
- ✅ `counties`
- ✅ `fire_departments`
- ✅ `profiles`

### 2. Sprawdź czy trigger działa

Trigger `handle_new_user()` powinien automatycznie tworzyć profil po rejestracji użytkownika.

Sprawdź w SQL Editor:

```sql
-- Sprawdź czy funkcja istnieje
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Sprawdź czy trigger istnieje
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Jeśli nie istnieją, uruchom migracje:

```bash
cd ..  # wrócz do głównego katalogu projektu
supabase db push
```

### 3. Dodaj testową jednostkę OSP

Musisz mieć przynajmniej jedną jednostkę OSP w bazie, aby móc się zarejestrować:

```sql
-- 1. Dodaj województwo
INSERT INTO provinces (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'mazowieckie')
ON CONFLICT (name) DO NOTHING;

-- 2. Dodaj powiat
INSERT INTO counties (id, province_id, name) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'warszawski'
)
ON CONFLICT (name, province_id) DO NOTHING;

-- 3. Dodaj jednostkę OSP
INSERT INTO fire_departments (id, county_id, name) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440002',
  'OSP Warszawa Mokotów'
)
ON CONFLICT (name, county_id) DO NOTHING;
```

⚠️ **Zapisz UUID jednostki OSP** - będzie Ci potrzebny do testowania!

---

## 🧪 Testowanie Endpointa

### 1. Uruchom serwer deweloperski

```bash
npm run dev
```

Endpoint będzie dostępny pod: `http://localhost:4321/api/auth/register`

### 2. Testowy request (cURL)

```bash
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "fire_department_id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "Jan",
    "last_name": "Kowalski"
  }'
```

**Oczekiwany wynik (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "created_at": "..."
    },
    "profile": {
      "id": "...",
      "fire_department_id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "role": "member",
      "created_at": "...",
      "updated_at": "..."
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "...",
      "expires_at": 1730030400,
      "expires_in": 604800
    }
  },
  "message": "User registered successfully"
}
```

### 3. Testuj błędy walidacji

**Słabe hasło:**
```bash
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "weak",
    "fire_department_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Oczekiwany wynik (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "password": "Must be at least 8 characters; Must contain uppercase letter; ..."
    }
  }
}
```

**Nieprawidłowy fire_department_id:**
```bash
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@example.com",
    "password": "TestPassword123!",
    "fire_department_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Oczekiwany wynik (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "FIRE_DEPARTMENT_NOT_FOUND",
    "message": "The specified fire department does not exist",
    "details": {
      "fire_department_id": "00000000-0000-0000-0000-000000000000"
    }
  }
}
```

---

## 🧪 Uruchomienie Testów Jednostkowych

```bash
# Pojedyncze uruchomienie
npm run test:run

# Watch mode (automatyczne uruchamianie)
npm test

# Z interfejsem UI
npm run test:ui

# Z coverage
npm run test:coverage
```

**Oczekiwany wynik:**
```
✓ src/lib/validation/__tests__/auth.validation.test.ts (38 tests)
Test Files  1 passed (1)
Tests  38 passed (38)
```

---

## 🔍 Weryfikacja Instalacji

### Sprawdź TypeScript

```bash
npx astro check
```

**Oczekiwany wynik:**
```
Result (X files): 
- 0 errors
- 0 warnings
- 0 hints
```

### Sprawdź czy pliki istnieją

```bash
# Validation
ls src/lib/validation/auth.validation.ts

# Service
ls src/lib/services/auth.service.ts

# Utils
ls src/lib/utils/response.ts
ls src/lib/utils/rate-limiter.ts

# API Route
ls src/pages/api/auth/register.ts

# Tests
ls src/lib/validation/__tests__/auth.validation.test.ts

# Config
ls vitest.config.ts
```

Wszystkie pliki powinny istnieć.

---

## 🐛 Troubleshooting

### Problem: "Cannot find module '@supabase/supabase-js'"

**Rozwiązanie:**
```bash
npm install @supabase/supabase-js
```

### Problem: "FIRE_DEPARTMENT_NOT_FOUND"

**Przyczyna:** Brak jednostki OSP w bazie lub nieprawidłowy UUID

**Rozwiązanie:**
1. Sprawdź UUID w bazie:
   ```sql
   SELECT id, name FROM fire_departments;
   ```
2. Użyj prawidłowego UUID w request

### Problem: "Profile not created"

**Przyczyna:** Trigger `handle_new_user()` nie działa

**Rozwiązanie:**
1. Sprawdź czy trigger istnieje:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
2. Jeśli nie istnieje, uruchom migracje:
   ```bash
   supabase db push
   ```

### Problem: Rate limit exceeded (429)

**Przyczyna:** Przekroczony limit 3 żądań/godzinę

**Rozwiązanie (development only):**
Zrestartuj serwer lub poczekaj 1 godzinę. W produkcji to normalne zabezpieczenie.

### Problem: TypeScript errors

**Rozwiązanie:**
```bash
# Sprawdź błędy
npx astro check

# Zrestartuj TypeScript server w IDE
# VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## 📝 Notatki dla Produkcji

### Przed wdrożeniem na produkcję:

1. **Zmień zmienne środowiskowe:**
   - Użyj produkcyjnych kluczy Supabase
   - Ustaw `NODE_ENV=production`

2. **Skonfiguruj CORS:**
   ```env
   ALLOWED_ORIGINS=https://twoja-domena.pl
   ```

3. **Rate Limiting:**
   - Rozważ Redis zamiast in-memory rate limiter
   - Dostosuj limity do rzeczywistego ruchu

4. **Monitoring:**
   - Dodaj Sentry lub inny error tracking
   - Skonfiguruj logi (np. LogRocket)

5. **Security:**
   - Włącz HTTPS
   - Ustaw httpOnly cookies dla tokenów
   - Dodaj CSRF protection

---

## 📚 Dodatkowa Dokumentacja

- [API Endpoint README](./src/pages/api/auth/README.md) - Pełna dokumentacja API
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Podsumowanie implementacji
- [API Plan](../.ai/api-plan.md) - Kompletna specyfikacja API

---

## ✅ Checklist Gotowości

Przed rozpoczęciem użytkowania, upewnij się że:

- [ ] Zmienne środowiskowe są ustawione (`.env`)
- [ ] Supabase projekt jest skonfigurowany
- [ ] Tabele bazy danych istnieją
- [ ] Trigger `handle_new_user()` działa
- [ ] Przynajmniej jedna jednostka OSP istnieje w bazie
- [ ] Testy jednostkowe przechodzą (`npm run test:run`)
- [ ] TypeScript compilation działa (`npx astro check`)
- [ ] Serwer deweloperski działa (`npm run dev`)
- [ ] Testowy request zwraca 201 Created

---

## 🎉 Gotowe!

Jeśli wszystkie kroki zostały wykonane, endpoint jest gotowy do użycia!

**Następne kroki:**
1. Zintegruj z frontend (formularz rejestracji)
2. Dodaj przechowywanie tokenu (localStorage/cookies)
3. Zaimplementuj kolejne endpointy (login, logout, etc.)

---

**Pytania?** Sprawdź dokumentację lub otwórz issue w repozytorium.

**Last Updated:** October 23, 2025

