# 🚀 Quick Start - Testowanie Endpointa Rejestracji

## Masz 3 minuty? Oto co zrobić:

### 1️⃣ Uruchom Supabase (Terminal 1)

```bash
cd /Users/edanielewska/Desktop/Meldunki_App
supabase start
```

**Skopiuj klucze** które zobaczysz!

---

### 2️⃣ Skonfiguruj .env

```bash
cd magenta-mass

# Stwórz plik .env
cat > .env << 'EOF'
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=WKLEJ_ANON_KEY_Z_KROKU_1
SUPABASE_SERVICE_ROLE_KEY=WKLEJ_SERVICE_ROLE_KEY_Z_KROKU_1
NODE_ENV=development
EOF
```

**Zamień** `WKLEJ_ANON_KEY_Z_KROKU_1` i `WKLEJ_SERVICE_ROLE_KEY_Z_KROKU_1` na prawdziwe klucze!

---

### 3️⃣ Dodaj testowe dane

Otwórz: http://127.0.0.1:54323 (Supabase Studio)

Kliknij **SQL Editor** i wykonaj plik:
```
supabase/seed-test-data.sql
```

Lub skopiuj i wklej:

```sql
INSERT INTO provinces (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'mazowieckie')
ON CONFLICT (name) DO NOTHING;

INSERT INTO counties (id, province_id, name) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'warszawski'
)
ON CONFLICT (name, province_id) DO NOTHING;

INSERT INTO fire_departments (id, county_id, name) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440002',
  'OSP Warszawa Mokotów'
)
ON CONFLICT (name, county_id) DO NOTHING;
```

---

### 4️⃣ Uruchom Astro (Terminal 2)

```bash
cd /Users/edanielewska/Desktop/Meldunki_App/magenta-mass
npm run dev
```

---

### 5️⃣ Testuj!

Otwórz w przeglądarce:
```
http://localhost:4321/register
```

**Dane testowe:**
- Email: `test@example.com`
- Hasło: `TestPassword123!`
- Imię: `Jan`
- Nazwisko: `Kowalski`
- Fire Department ID: `550e8400-e29b-41d4-a716-446655440000` (już wpisany!)

Kliknij **"Zarejestruj się"** ✅

---

## ✅ Co powinieneś zobaczyć?

### Sukces (zielony komunikat):
```
✅ Rejestracja udana! Przekierowuję...
```

### W konsoli przeglądarki (F12):
```javascript
Zarejestrowany użytkownik: {id: "...", email: "test@example.com"}
Profil: {id: "...", first_name: "Jan", last_name: "Kowalski", ...}
Token: eyJhbGciOiJIUzI1NiI...
```

### W Supabase Studio → Authentication → Users:
```
✅ Nowy użytkownik: test@example.com
```

### W Supabase Studio → Table Editor → profiles:
```
✅ Nowy profil: Jan Kowalski
```

---

## 🧪 Testuj Błędy

### Słabe hasło:
- Hasło: `weak`
- Oczekiwany błąd: `❌ Invalid input data - password: Must be at least 8 characters; ...`

### Duplikat email:
- Zarejestruj się ponownie z tym samym emailem
- Oczekiwany błąd: `❌ An account with this email already exists`

### Nieprawidłowy fire_department_id:
- UUID: `00000000-0000-0000-0000-000000000000`
- Oczekiwany błąd: `❌ The specified fire department does not exist`

### Rate Limiting:
- Wyślij 4 żądania w ciągu godziny (z tego samego IP)
- 4-te: `❌ Too many registration attempts. Please try again later.`

---

## 🐛 Problemy?

### "Supabase nie działa"
```bash
# Sprawdź status
supabase status

# Restart
supabase stop
supabase start
```

### "Cannot find module"
```bash
cd magenta-mass
npm install
```

### "Failed to fetch"
- Sprawdź czy Astro działa: http://localhost:4321
- Sprawdź czy Supabase działa: http://127.0.0.1:54321
- Sprawdź .env - czy klucze są prawidłowe?

### "FIRE_DEPARTMENT_NOT_FOUND"
- Sprawdź czy seed data się wykonał
- W Supabase Studio → Table Editor → fire_departments
- Powinien być wpis: "OSP Warszawa Mokotów"

---

## 📊 Sprawdź Logi

### Logi Astro (Terminal 2):
```
15:44:13 [200] /api/auth/register 156ms
```

### Logi w konsoli przeglądarki (F12):
```javascript
Zarejestrowany użytkownik: {...}
```

### Logi w Supabase (jeśli błąd):
```
Registration error: {...}
```

---

## 🎉 Działa? Co dalej?

1. ✅ **Przetestuj wszystkie scenariusze błędów** (słabe hasło, duplikat, etc.)
2. ✅ **Uruchom testy jednostkowe:** `npm test`
3. ✅ **Sprawdź dokumentację:** `src/pages/api/auth/README.md`
4. 🚀 **Zaimplementuj kolejne endpointy:** login, logout, refresh
5. 🎨 **Ulepszaj UI** formularza rejestracji

---

## 📚 Przydatne Linki

- **Supabase Studio:** http://127.0.0.1:54323
- **Formularz rejestracji:** http://localhost:4321/register
- **API Docs:** `magenta-mass/src/pages/api/auth/README.md`
- **Setup Guide:** `magenta-mass/SETUP_REGISTER_ENDPOINT.md`

---

## 🆘 Potrzebujesz pomocy?

1. Sprawdź `SETUP_REGISTER_ENDPOINT.md` → Troubleshooting
2. Sprawdź logi w terminalu
3. Sprawdź konsolę przeglądarki (F12)
4. Sprawdź Supabase Studio → Logs

---

**Powodzenia! 🚀**

