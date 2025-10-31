# 🚀 Checklist Deployment na Produkcję - FireLog

## Przed deploymentem

### ✅ Przygotowanie projektu

- [ ] **Git Repository**
  - [ ] Wszystkie zmiany są commitowane
  - [ ] Branch `main` jest aktualny
  - [ ] Brak niepotrzebnych plików w repo (sprawdź `.gitignore`)
  
- [ ] **Zmienne środowiskowe**
  - [ ] Masz dostęp do Supabase Production
  - [ ] Masz `PUBLIC_SUPABASE_URL` (production URL)
  - [ ] Masz `PUBLIC_SUPABASE_ANON_KEY` (production key)
  - [ ] Masz `SUPABASE_SERVICE_ROLE_KEY` (dla operacji admin)
  - [ ] Masz `OPENROUTER_API_KEY` (jeśli używane)

### ✅ Testy lokalne

- [ ] **Build test**
  ```bash
  cd magenta-mass
  npm run build
  ```
  - [ ] Build zakończył się sukcesem
  - [ ] Folder `dist/` został utworzony
  
- [ ] **Preview test**
  ```bash
  npm run preview
  ```
  - [ ] Aplikacja uruchamia się lokalnie
  - [ ] Health check działa: `curl http://localhost:4321/api/health`
  - [ ] Strona główna się ładuje

- [ ] **Testy**
  ```bash
  npm run test:ci
  ```
  - [ ] Wszystkie testy przechodzą

### ✅ Baza danych (Supabase Production)

- [ ] **Migracje**
  - [ ] Wszystkie migracje są w `supabase/migrations/`
  - [ ] Migracje zostały wykonane na produkcji
  - [ ] Schema jest zgodny z kodem aplikacji

- [ ] **RLS Policies**
  - [ ] Row Level Security jest włączone
  - [ ] Polityki RLS są skonfigurowane
  - [ ] Polityki działają poprawnie (przetestowane)

- [ ] **Dane testowe**
  - [ ] Usunięte dane testowe z produkcji
  - [ ] Tylko produkcyjne dane w bazie
  - [ ] Backup bazy danych został wykonany

### ✅ Bezpieczeństwo

- [ ] **Secrets**
  - [ ] Wszystkie klucze są bezpieczne
  - [ ] `.env` NIE jest commitowany do repo
  - [ ] `.env.production` NIE jest commitowany
  - [ ] Service Role Key jest tylko na serwerze

- [ ] **Rate Limiting**
  - [ ] Rate limiting jest włączony
  - [ ] Limity są odpowiednio ustawione

## Deployment na Render.com

### ✅ Konfiguracja Render

1. **Utworzenie konta i serwisu**
   - [ ] Masz konto na [render.com](https://render.com)
   - [ ] Połączono GitHub repo z Render
   - [ ] Utworzono Web Service w Render Dashboard

2. **Ustawienia serwisu w Render**
   - [ ] **Name**: `meldunki-app` (lub wybrana nazwa)
   - [ ] **Root Directory**: `magenta-mass`
   - [ ] **Environment**: `Node`
   - [ ] **Build Command**: `npm ci && npm run build`
   - [ ] **Start Command**: `npm start`
   - [ ] **Branch**: `main`
   - [ ] **Plan**: `Free` (lub wybrany plan)
   - [ ] **Region**: `Frankfurt` (lub inny europejski)

3. **Environment Variables w Render**
   
   Dodaj w sekcji "Environment Variables":
   
   ```
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   OPENROUTER_API_KEY=your-openrouter-key (opcjonalnie)
   PORT=10000 (Render automatycznie ustawia, ale można być explicit)
   ```

4. **Health Check**
   - [ ] **Health Check Path**: `/api/health`
   - [ ] Health check endpoint działa lokalnie

### ✅ Deployment

1. **Automatyczny deployment**
   - [ ] Push do brancha `main` w GitHub
   - [ ] Render automatycznie wykryje zmiany
   - [ ] Render rozpocznie build

2. **Monitorowanie deploymentu**
   - [ ] Otwórz Render Dashboard → Twój serwis → Logs
   - [ ] Sprawdź czy build się powiódł
   - [ ] Sprawdź czy aplikacja się uruchomiła
   - [ ] Sprawdź status serwisu (powinien być "Live")

### ✅ Weryfikacja po deploymentzie

- [ ] **Health Check**
  ```bash
  curl https://your-app.onrender.com/api/health
  ```
  - [ ] Zwraca status 200
  - [ ] Response zawiera `"status": "healthy"`
  - [ ] Database service jest "healthy"

- [ ] **Strona główna**
  - [ ] Strona główna się ładuje: `https://your-app.onrender.com`
  - [ ] Brak błędów w konsoli przeglądarki
  - [ ] Wszystkie zasoby się ładują (CSS, JS, obrazy)

- [ ] **Funkcjonalności**
  - [ ] Strona logowania działa: `/login`
  - [ ] Strona rejestracji działa: `/register`
  - [ ] Dashboard działa po zalogowaniu: `/dashboard`
  - [ ] Lista meldunków działa: `/meldunki`
  - [ ] API endpoints odpowiadają

- [ ] **Baza danych**
  - [ ] Połączenie z Supabase działa
  - [ ] Rejestracja użytkownika działa
  - [ ] Logowanie działa
  - [ ] Tworzenie meldunków działa
  - [ ] Panel admin działa (jeśli masz konto admin)

## Po deploymentzie

### ✅ Monitoring

- [ ] **Logi**
  - [ ] Sprawdzasz logi w Render Dashboard
  - [ ] Brak błędów w logach
  - [ ] Wszystkie requesty są logowane

- [ ] **Metryki**
  - [ ] Sprawdzasz metryki w Render Dashboard
  - [ ] CPU usage jest normalne
  - [ ] Memory usage jest normalne
  - [ ] Response time jest akceptowalny (<2s)

### ✅ Dokumentacja

- [ ] **README**
  - [ ] URL produkcji jest zaktualizowany w README (jeśli wymagane)
  - [ ] Dokumentacja jest aktualna

## Rozwiązywanie problemów

### Build failed

**Objawy**: Build kończy się błędem w Render Dashboard

**Rozwiązanie**:
1. Sprawdź logi build w Render Dashboard
2. Sprawdź czy wszystkie zależności są w `package.json`
3. Sprawdź czy Node version jest zgodny (>=20)
4. Sprawdź czy build działa lokalnie: `npm run build`

### App not starting

**Objawy**: Build się powiódł, ale aplikacja nie startuje

**Rozwiązanie**:
1. Sprawdź Start Command: powinno być `npm start`
2. Sprawdź logi aplikacji w Render Dashboard
3. Sprawdź czy PORT jest ustawiony (Render ustawia automatycznie)
4. Sprawdź czy zmienne środowiskowe są poprawne

### Health check failed

**Objawy**: Render pokazuje, że health check nie działa

**Rozwiązanie**:
1. Sprawdź czy endpoint `/api/health` istnieje
2. Sprawdź czy health check path w Render to `/api/health`
3. Sprawdź logi aplikacji
4. Sprawdź połączenie z Supabase (zmienne środowiskowe)

### Slow performance

**Objawy**: Aplikacja jest wolna

**Rozwiązanie**:
1. Render Free tier ma ograniczenia - aplikacja "zasypia" po 15min nieaktywności
2. Pierwsze request po "obudzeniu" może być wolne (cold start)
3. Rozważ upgrade do płatnego planu dla lepszej wydajności

## Użyteczne komendy

```bash
# Sprawdzenie statusu aplikacji
curl https://your-app.onrender.com/api/health

# Testowanie API endpoints
curl https://your-app.onrender.com/api/meldunki \
  -H "Authorization: Bearer YOUR_TOKEN"

# Sprawdzenie logów (w Render Dashboard)
# Render Dashboard → Twój serwis → Logs
```

## Kontakt i wsparcie

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Astro Docs**: https://docs.astro.build

---

**Data utworzenia**: $(date)
**Ostatnia aktualizacja**: $(date)
**Status**: ✅ Gotowy do deploymentu
