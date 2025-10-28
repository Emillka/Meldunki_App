# CI/CD Setup - Meldunki App

## Przegląd

Ten dokument opisuje kompletny setup CI/CD dla aplikacji Meldunki App, opartej na Astro, React, TypeScript i Supabase. Pipeline jest zaprojektowany do uruchamiania automatycznie przy push do brancha `main` oraz ręcznie przez GitHub Actions.

## Architektura CI/CD

### Workflow GitHub Actions

Pipeline składa się z następujących kroków:

1. **Test** - Testy jednostkowe, integracyjne, wydajnościowe i bezpieczeństwa
2. **E2E Tests** - Testy end-to-end z Playwright
3. **Build** - Budowanie aplikacji produkcyjnej
4. **Security** - Skanowanie bezpieczeństwa z Trivy
5. **Deploy** - Deployment na Render (tylko dla main branch)

### Platformy deploymentu

- **Render** (zalecane) - Darmowy tier, automatyczny deployment
- **DigitalOcean** (opcjonalne) - Płatny, pełna kontrola

### Struktura plików

```
.github/workflows/
├── ci-cd.yml                 # Główny workflow CI/CD (DigitalOcean)
├── ci-cd-render.yml         # Workflow CI/CD dla Render

magenta-mass/
├── Dockerfile               # Konteneryzacja aplikacji
├── .dockerignore           # Docker ignore file

scripts/
├── test-ci-local.sh         # Lokalne testowanie pipeline
├── deploy.sh               # Skrypt deploymentu (DigitalOcean)
├── deploy-render.sh         # Skrypt deploymentu (Render)
└── backup.sh               # Backup i restore bazy danych

docker-compose.yml          # Development environment
docker-compose.prod.yml     # Production environment (DigitalOcean)
nginx.prod.conf             # Konfiguracja Nginx
prometheus.yml             # Monitoring configuration
render.yaml                # Konfiguracja Render
env.production.example      # Przykład zmiennych środowiskowych
```

## Konfiguracja

### 1. Zmienne środowiskowe GitHub Secrets

Skonfiguruj następujące secrets w GitHub:

#### Supabase
- `TEST_SUPABASE_URL` - URL testowego projektu Supabase
- `TEST_SUPABASE_ANON_KEY` - Anon key dla testów
- `TEST_SUPABASE_SERVICE_ROLE_KEY` - Service role key dla testów
- `PROD_SUPABASE_URL` - URL produkcyjnego projektu Supabase
- `PROD_SUPABASE_ANON_KEY` - Anon key dla produkcji

#### Render (zalecane)
- `RENDER_APP_URL` - URL aplikacji na Render (np. https://meldunki-app.onrender.com)
- `RENDER_DEPLOY_URL` - URL do dashboard Render

#### DigitalOcean (opcjonalne)
- `DO_HOST` - IP adres serwera DigitalOcean
- `DO_USERNAME` - Nazwa użytkownika SSH
- `DO_SSH_KEY` - Prywatny klucz SSH
- `PROD_URL` - URL aplikacji produkcyjnej

### 2. Konfiguracja Render (zalecane)

#### Szybki start z Render
1. Przejdź do [render.com](https://render.com) i zaloguj się przez GitHub
2. Kliknij "New +" → "Web Service"
3. Połącz z GitHub i wybierz repo `Meldunki_App`
4. Skonfiguruj:
   - **Name**: `meldunki-app`
   - **Root Directory**: `magenta-mass`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`
   - **Plan**: `Free`
5. Dodaj zmienne środowiskowe:
   - `PUBLIC_SUPABASE_URL` - URL Twojego projektu Supabase
   - `PUBLIC_SUPABASE_ANON_KEY` - Anon key z Supabase
   - `NODE_ENV` - `production`
6. Kliknij "Create Web Service"

#### Szczegółowy przewodnik
Zobacz [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) dla kompletnej instrukcji.

### 3. Konfiguracja serwera DigitalOcean (opcjonalne)

```bash
# Aktualizacja systemu
sudo apt update && sudo apt upgrade -y

# Instalacja Docker i Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalacja Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Utworzenie katalogu aplikacji
sudo mkdir -p /opt/meldunki-app
sudo chown $USER:$USER /opt/meldunki-app
```

#### Konfiguracja SSL

```bash
# Instalacja Certbot
sudo apt install certbot -y

# Generowanie certyfikatu SSL
sudo certbot certonly --standalone -d your-domain.com

# Kopiowanie certyfikatów
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/meldunki-app/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/meldunki-app/ssl/key.pem
sudo chown $USER:$USER /opt/meldunki-app/ssl/*
```

### 3. Konfiguracja lokalna

#### Przygotowanie środowiska

```bash
# Klonowanie repozytorium
git clone <your-repo-url>
cd Meldunki_App

# Instalacja zależności
cd magenta-mass
npm install

# Konfiguracja zmiennych środowiskowych
cp env.production.example .env.production
# Edytuj .env.production z odpowiednimi wartościami
```

#### Testowanie lokalne

```bash
# Uruchomienie lokalnego testu CI/CD
chmod +x scripts/test-ci-local.sh
./scripts/test-ci-local.sh

# Uruchomienie z preview
./scripts/test-ci-local.sh --preview
```

## Uruchamianie

### Automatyczne uruchamianie

Pipeline uruchamia się automatycznie:
- Przy push do brancha `main`
- Przy tworzeniu Pull Request do `main`

### Ręczne uruchamianie

1. Przejdź do zakładki "Actions" w GitHub
2. Wybierz workflow "CI/CD Pipeline - Render" (lub "CI/CD Pipeline" dla DigitalOcean)
3. Kliknij "Run workflow"
4. Wybierz branch i kliknij "Run workflow"

### Lokalne uruchamianie

```bash
# Testowanie całego pipeline lokalnie
./scripts/test-ci-local.sh

# Deployment na Render
./scripts/deploy-render.sh <render-api-key> <app-name>

# Deployment na DigitalOcean (opcjonalne)
./scripts/deploy.sh <host> <username> <ssh-key-path> [environment]
```

## Monitoring i Logi

### Render (zalecane)

#### Dostęp do logów
1. Render Dashboard → Twój serwis → Logs
2. Logi w czasie rzeczywistym
3. Filtrowanie po poziomie (info, warn, error)

#### Metryki
1. Render Dashboard → Twój serwis → Metrics
2. Dostępne metryki:
   - CPU usage
   - Memory usage
   - Response time
   - Request count

#### Health Check
- URL: `https://your-app.onrender.com/api/health`
- Automatyczne sprawdzanie przez Render

### DigitalOcean (opcjonalne)

#### Dostęp do logów
```bash
# Logi aplikacji
docker-compose -f docker-compose.prod.yml logs -f app

# Logi wszystkich serwisów
docker-compose -f docker-compose.prod.yml logs -f

# Logi konkretnego serwisu
docker-compose -f docker-compose.prod.yml logs -f postgres
```

#### Monitoring
- **Prometheus**: http://your-domain.com:9090
- **Grafana**: http://your-domain.com:3000 (admin/admin)
- **Health Check**: http://your-domain.com/health

## Backup i Restore

### Backup

```bash
# Backup lokalny
./scripts/backup.sh backup --local

# Backup do S3
./scripts/backup.sh backup --s3
```

### Restore

```bash
# Restore z lokalnego pliku
./scripts/backup.sh restore backup_2024-01-15.sql

# Restore z S3
./scripts/backup.sh restore backup_2024-01-15.sql --s3
```

## Rozwiązywanie problemów

### Częste problemy

#### 1. Testy nie przechodzą

```bash
# Sprawdzenie logów testów
npm run test:unit -- --reporter=verbose

# Uruchomienie testów z debugowaniem
DEBUG=* npm run test:unit
```

#### 2. Build nie działa

```bash
# Sprawdzenie konfiguracji Astro
npx astro check

# Clean build
rm -rf dist node_modules
npm install
npm run build
```

#### 3. Deployment nie działa

```bash
# Sprawdzenie połączenia SSH
ssh -i <ssh-key> <username>@<host>

# Sprawdzenie statusu kontenerów
docker-compose -f docker-compose.prod.yml ps

# Restart serwisów
docker-compose -f docker-compose.prod.yml restart
```

#### 4. Problemy z bazą danych

```bash
# Sprawdzenie połączenia z bazą
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d meldunki_production

# Sprawdzenie logów bazy danych
docker-compose -f docker-compose.prod.yml logs postgres
```

### Debugowanie

#### Włączanie debugowania

```bash
# W zmiennych środowiskowych
DEBUG=*
LOG_LEVEL=debug
```

#### Sprawdzanie metryk

```bash
# Metryki aplikacji
curl http://localhost:4321/api/metrics

# Metryki systemu
curl http://localhost:9090/metrics
```

## Bezpieczeństwo

### Zalecenia

1. **Regularne aktualizacje**: Aktualizuj zależności i obrazy Docker
2. **Monitorowanie**: Używaj Prometheus i Grafana do monitorowania
3. **Backup**: Regularnie tworz backup bazy danych
4. **SSL**: Zawsze używaj HTTPS w produkcji
5. **Rate Limiting**: Nginx jest skonfigurowany z rate limiting

### Skanowanie bezpieczeństwa

Pipeline automatycznie skanuje kod pod kątem podatności za pomocą Trivy. Wyniki są dostępne w zakładce "Security" w GitHub.

## Rozszerzenia

### Dodawanie nowych testów

1. Dodaj test do odpowiedniego katalogu w `src/`
2. Zaktualizuj skrypty w `package.json`
3. Dodaj krok w workflow GitHub Actions

### Dodawanie nowych serwisów

1. Dodaj serwis do `docker-compose.prod.yml`
2. Zaktualizuj konfigurację Nginx jeśli potrzebne
3. Dodaj monitoring w `prometheus.yml`

### Integracja z zewnętrznymi serwisami

Pipeline można łatwo rozszerzyć o:
- Powiadomienia Slack/Discord
- Integrację z Sentry
- Automatyczne testy wydajności
- Deployment do wielu środowisk

## Wsparcie

W przypadku problemów:
1. Sprawdź logi w GitHub Actions
2. Sprawdź logi aplikacji na serwerze
3. Użyj skryptów debugowania
4. Sprawdź dokumentację Astro i Supabase
