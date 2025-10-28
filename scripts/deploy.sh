#!/bin/bash

# Skrypt do deploymentu na DigitalOcean
# Używa Docker Compose do uruchomienia aplikacji w środowisku produkcyjnym

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
if [ $# -lt 3 ]; then
    error "Usage: $0 <host> <username> <ssh-key-path> [environment]"
    echo "Example: $0 192.168.1.100 root ~/.ssh/id_rsa production"
    exit 1
fi

HOST=$1
USERNAME=$2
SSH_KEY_PATH=$3
ENVIRONMENT=${4:-production}

log "🚀 Starting deployment to DigitalOcean..."
log "Host: $HOST"
log "Username: $USERNAME"
log "Environment: $ENVIRONMENT"

# Sprawdzenie czy plik SSH key istnieje
if [ ! -f "$SSH_KEY_PATH" ]; then
    error "SSH key file not found: $SSH_KEY_PATH"
fi

# Sprawdzenie czy plik .env.production istnieje
if [ ! -f ".env.production" ]; then
    warn ".env.production file not found. Using example file..."
    if [ -f "env.production.example" ]; then
        cp env.production.example .env.production
        warn "Please update .env.production with your actual values before deploying!"
        read -p "Press Enter to continue or Ctrl+C to abort..."
    else
        error ".env.production file not found and no example file available"
    fi
fi

# Sprawdzenie czy docker-compose.prod.yml istnieje
if [ ! -f "docker-compose.prod.yml" ]; then
    error "docker-compose.prod.yml file not found"
fi

# Kopiowanie plików na serwer
log "📁 Copying files to server..."
scp -i "$SSH_KEY_PATH" -r . "$USERNAME@$HOST:/opt/meldunki-app/"

# Uruchomienie deploymentu na serwerze
log "🔧 Running deployment on server..."
ssh -i "$SSH_KEY_PATH" "$USERNAME@$HOST" << EOF
    set -e
    
    echo "📁 Navigating to application directory..."
    cd /opt/meldunki-app
    
    echo "🐳 Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down || true
    
    echo "🧹 Cleaning up old images..."
    docker system prune -f
    
    echo "🏗️ Building and starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "⏳ Waiting for services to start..."
    sleep 30
    
    echo "🔍 Checking service health..."
    docker-compose -f docker-compose.prod.yml ps
    
    echo "✅ Deployment completed!"
EOF

# Health check
log "🏥 Performing health check..."
sleep 10

# Sprawdzenie czy aplikacja odpowiada
if command -v curl >/dev/null 2>&1; then
    APP_URL=$(grep "APP_URL" .env.production | cut -d '=' -f2)
    if [ -n "$APP_URL" ]; then
        log "Testing application at $APP_URL..."
        if curl -f -s "$APP_URL/api/health" >/dev/null; then
            log "✅ Health check passed!"
        else
            warn "Health check failed - application might not be ready yet"
        fi
    else
        warn "APP_URL not found in .env.production - skipping health check"
    fi
else
    warn "curl not available - skipping health check"
fi

log "🎉 Deployment completed successfully!"
log "🌐 Your application should be available at: $APP_URL"
log "📊 Monitor logs with: ssh -i $SSH_KEY_PATH $USERNAME@$HOST 'cd /opt/meldunki-app && docker-compose -f docker-compose.prod.yml logs -f'"
