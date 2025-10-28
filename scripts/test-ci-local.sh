#!/bin/bash

# Skrypt do lokalnego testowania CI/CD pipeline
# Uruchamia wszystkie testy w takiej samej kolejności jak w GitHub Actions

set -e

echo "🚀 Starting local CI/CD pipeline test..."

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Sprawdzenie czy jesteśmy w odpowiednim katalogu
if [ ! -f "magenta-mass/package.json" ]; then
    error "Please run this script from the project root directory"
fi

# Przejście do katalogu aplikacji
cd magenta-mass

# 1. Instalacja zależności
log "📦 Installing dependencies..."
npm ci

# 2. TypeScript check
log "🔍 Running TypeScript check..."
npx astro check

# 3. Testy jednostkowe
log "🧪 Running unit tests..."
npm run test:unit

# 4. Testy API
log "🔌 Running API tests..."
npm run test:api

# 5. Testy integracyjne
log "🔗 Running integration tests..."
npm run test:integration

# 6. Testy wydajności
log "⚡ Running performance tests..."
npm run test:performance

# 7. Testy bezpieczeństwa
log "🔒 Running security tests..."
npm run test:security

# 8. Coverage
log "📊 Generating test coverage..."
npm run test:coverage

# 9. Build aplikacji
log "🏗️ Building application..."
npm run build

# 10. Sprawdzenie czy build się udał
if [ ! -d "dist" ]; then
    error "Build failed - dist directory not found"
fi

log "✅ All tests passed and build successful!"
log "🎉 Local CI/CD pipeline test completed successfully!"

# Opcjonalnie: uruchomienie preview
if [ "$1" = "--preview" ]; then
    log "🌐 Starting preview server..."
    npm run preview
fi
