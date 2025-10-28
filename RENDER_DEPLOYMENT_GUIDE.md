# Render Deployment Guide - Meldunki App

## Przegląd

Ten przewodnik przeprowadzi Cię przez proces deploymentu aplikacji Meldunki App na Render.com (darmowy tier).

## Krok 1: Przygotowanie konta Render

### 1.1 Utworzenie konta
1. Przejdź do [render.com](https://render.com)
2. Kliknij "Get Started for Free"
3. Zaloguj się przez GitHub (zalecane)

### 1.2 Połączenie z GitHub
1. W Render Dashboard kliknij "New +"
2. Wybierz "Web Service"
3. Połącz z GitHub i wybierz swoje repo `Meldunki_App`

## Krok 2: Konfiguracja serwisu

### 2.1 Podstawowe ustawienia
- **Name**: `meldunki-app` (lub dowolna nazwa)
- **Root Directory**: `magenta-mass`
- **Environment**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm run preview`
- **Plan**: `Free`

### 2.2 Zaawansowane ustawienia
- **Branch**: `main`
- **Region**: `Frankfurt` (najbliższy do Polski)
- **Health Check Path**: `/api/health`
- **Auto Deploy**: `Yes` (automatyczny deployment przy push)

## Krok 3: Zmienne środowiskowe

W sekcji "Environment Variables" dodaj:

### 3.1 Supabase (Production)
```
PUBLIC_SUPABASE_URL = https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
```

### 3.2 Aplikacja
```
NODE_ENV = production
```

### 3.3 Opcjonalne
```
LOG_LEVEL = info
```

## Krok 4: GitHub Secrets

Dodaj do GitHub Secrets (Settings → Secrets and variables → Actions):

### 4.1 Supabase (Test)
```
TEST_SUPABASE_URL = https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY = your-test-anon-key
TEST_SUPABASE_SERVICE_ROLE_KEY = your-test-service-role-key
```

### 4.2 Supabase (Production)
```
PROD_SUPABASE_URL = https://your-project.supabase.co
PROD_SUPABASE_ANON_KEY = your-anon-key
```

### 4.3 Render
```
RENDER_APP_URL = https://your-app-name.onrender.com
RENDER_DEPLOY_URL = https://dashboard.render.com/services/your-service-id
```

## Krok 5: Deployment

### 5.1 Automatyczny deployment
1. Kliknij "Create Web Service" w Render
2. Render automatycznie:
   - Sklonuje repo
   - Zainstaluje zależności
   - Zbuduje aplikację
   - Uruchomi serwis

### 5.2 Ręczny deployment (opcjonalnie)
```bash
# Użyj skryptu deploymentu
chmod +x scripts/deploy-render.sh
./scripts/deploy-render.sh <render-api-key> <app-name>
```

## Krok 6: Weryfikacja

### 6.1 Sprawdzenie deploymentu
1. Przejdź do Render Dashboard
2. Kliknij na swój serwis
3. Sprawdź logi w zakładce "Logs"
4. Sprawdź status w zakładce "Deploys"

### 6.2 Test aplikacji
1. Otwórz URL aplikacji (np. `https://meldunki-app.onrender.com`)
2. Sprawdź health check: `https://meldunki-app.onrender.com/api/health`
3. Przetestuj funkcjonalności aplikacji

## Krok 7: Konfiguracja domeny (opcjonalne)

### 7.1 Custom domain
1. W Render Dashboard → Settings → Custom Domains
2. Dodaj swoją domenę
3. Skonfiguruj DNS w swoim providerze

### 7.2 SSL
- Render automatycznie zapewnia SSL dla wszystkich domen
- Certyfikaty są automatycznie odnawiane

## Monitoring i Logi

### Dostęp do logów
1. Render Dashboard → Twój serwis → Logs
2. Logi są dostępne w czasie rzeczywistym
3. Można filtrować po poziomie (info, warn, error)

### Metryki
1. Render Dashboard → Twój serwis → Metrics
2. Dostępne metryki:
   - CPU usage
   - Memory usage
   - Response time
   - Request count

## Rozwiązywanie problemów

### Częste problemy

#### 1. Build failed
```bash
# Sprawdź logi build w Render Dashboard
# Częste przyczyny:
# - Błędne zmienne środowiskowe
# - Problemy z zależnościami
# - Błędna konfiguracja Astro
```

#### 2. App not starting
```bash
# Sprawdź:
# - Start command: npm run preview
# - Root directory: magenta-mass
# - Node version: 20
```

#### 3. Health check failed
```bash
# Sprawdź czy endpoint /api/health działa
# Sprawdź logi aplikacji
# Sprawdź zmienne środowiskowe Supabase
```

#### 4. Slow performance
```bash
# Render Free tier ma ograniczenia:
# - 750h/miesiąc
# - Sleep po 15min nieaktywności
# - Ograniczona pamięć
```

### Debugowanie

#### Włączanie debugowania
```bash
# W Render Environment Variables:
LOG_LEVEL = debug
DEBUG = *
```

#### Sprawdzanie statusu
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Sprawdzenie zmiennych środowiskowych
# Render Dashboard → Environment Variables
```

## Optymalizacja

### 1. Build optimization
```bash
# W package.json dodaj:
"scripts": {
  "build": "astro build",
  "preview": "astro preview --host 0.0.0.0 --port $PORT"
}
```

### 2. Environment variables
```bash
# Używaj tylko niezbędnych zmiennych
# Unikaj dużych wartości w env vars
```

### 3. Dependencies
```bash
# Używaj npm ci zamiast npm install
# Render automatycznie używa npm ci
```

## Limity darmowego planu

### Render Free Tier
- **750 godzin/miesiąc** - wystarczy dla małych aplikacji
- **Sleep po 15min** - aplikacja "zasypia" po nieaktywności
- **512MB RAM** - ograniczona pamięć
- **Brak custom domains** - tylko *.onrender.com
- **Public repos** - tylko publiczne repozytoria GitHub

### Supabase Free Tier
- **500MB database** - wystarczy dla małych aplikacji
- **2GB bandwidth** - limit transferu
- **50MB file storage** - limit plików
- **50,000 monthly active users** - limit użytkowników

## Następne kroki

1. **Monitoring**: Skonfiguruj alerty w Render
2. **Backup**: Regularne backup bazy danych Supabase
3. **Performance**: Monitoruj metryki i optymalizuj
4. **Scaling**: Rozważ upgrade do płatnego planu przy wzroście

## Wsparcie

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Astro Docs**: [docs.astro.build](https://docs.astro.build)

W przypadku problemów sprawdź logi w Render Dashboard lub skontaktuj się z supportem.
