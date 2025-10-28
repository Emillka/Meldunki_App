#!/bin/bash

# Skrypt do deploymentu na Render.com
# Automatycznie konfiguruje i deployuje aplikację

set -e

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja do logowania
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Sprawdzenie argumentów
if [ $# -lt 2 ]; then
    echo "Usage: $0 <render-api-key> <app-name>"
    echo ""
    echo "Example: $0 rnd_xxxxx meldunki-app"
    echo ""
    echo "How to get Render API key:"
    echo "1. Go to https://dashboard.render.com/"
    echo "2. Account Settings → API Keys"
    echo "3. Create New API Key"
    echo "4. Copy the key (starts with 'rnd_')"
    exit 1
fi

RENDER_API_KEY=$1
APP_NAME=$2

log "🚀 Starting Render deployment setup..."

# Sprawdzenie czy plik .env.production istnieje
if [ ! -f ".env.production" ]; then
    warn ".env.production file not found. Using example file..."
    if [ -f "env.production.example" ]; then
        cp env.production.example .env.production
        warn "Please update .env.production with your actual values!"
        read -p "Press Enter to continue or Ctrl+C to abort..."
    else
        error ".env.production file not found and no example file available"
    fi
fi

# Sprawdzenie czy Render CLI jest zainstalowany
if ! command -v render &> /dev/null; then
    log "Installing Render CLI..."
    curl -fsSL https://cli.render.com/install.sh | sh
    export PATH="$HOME/.render/bin:$PATH"
fi

# Sprawdzenie połączenia z Render API
log "🔐 Testing Render API connection..."
if ! render --api-key "$RENDER_API_KEY" services list &> /dev/null; then
    error "Failed to connect to Render API. Check your API key."
fi

# Tworzenie serwisu na Render
log "🏗️ Creating Render service..."

# Sprawdzenie czy serwis już istnieje
if render --api-key "$RENDER_API_KEY" services list | grep -q "$APP_NAME"; then
    warn "Service '$APP_NAME' already exists. Updating..."
    SERVICE_ID=$(render --api-key "$RENDER_API_KEY" services list | grep "$APP_NAME" | awk '{print $1}')
else
    log "Creating new service..."
    SERVICE_ID=$(render --api-key "$RENDER_API_KEY" services create \
        --name "$APP_NAME" \
        --type web \
        --build-command "npm run build" \
        --start-command "npm run preview" \
        --root-dir "magenta-mass" \
        --branch "main" \
        --plan free \
        --region frankfurt \
        --health-check-path "/api/health" \
        --auto-deploy true \
        --repo https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/') \
        --output json | jq -r '.id')
fi

log "✅ Service created/updated: $SERVICE_ID"

# Ustawianie zmiennych środowiskowych
log "🔧 Setting environment variables..."

# Wczytanie zmiennych z .env.production
while IFS='=' read -r key value; do
    # Pomiń komentarze i puste linie
    if [[ ! $key =~ ^# ]] && [[ -n $key ]]; then
        # Usuń cudzysłowy jeśli istnieją
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        log "Setting $key..."
        render --api-key "$RENDER_API_KEY" env-vars set \
            --service-id "$SERVICE_ID" \
            --key "$key" \
            --value "$value" || warn "Failed to set $key"
    fi
done < .env.production

# Trigger deployment
log "🚀 Triggering deployment..."
render --api-key "$RENDER_API_KEY" deploys create --service-id "$SERVICE_ID"

# Pobranie URL aplikacji
APP_URL=$(render --api-key "$RENDER_API_KEY" services show "$SERVICE_ID" --output json | jq -r '.serviceDetails.url')

log "✅ Deployment initiated!"
log "🌐 Your app will be available at: $APP_URL"
log "📊 Monitor deployment at: https://dashboard.render.com/services/$SERVICE_ID"

# Dodanie URL do GitHub Secrets (opcjonalne)
if command -v gh &> /dev/null; then
    log "🔐 Adding Render URL to GitHub Secrets..."
    gh secret set RENDER_APP_URL --body "$APP_URL" || warn "Failed to set GitHub secret"
    gh secret set RENDER_DEPLOY_URL --body "https://dashboard.render.com/services/$SERVICE_ID" || warn "Failed to set GitHub secret"
fi

log "🎉 Render deployment setup completed!"
log ""
log "Next steps:"
log "1. Wait for deployment to complete (usually 2-5 minutes)"
log "2. Test your app at: $APP_URL"
log "3. Check logs at: https://dashboard.render.com/services/$SERVICE_ID"
log "4. Set up custom domain if needed"
