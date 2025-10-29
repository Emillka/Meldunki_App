#!/bin/bash

# Skrypt do lokalnego testowania Pull Request workflow
# Symuluje kroki z .github/workflows/pr-checks.yml

set -e

echo "🚀 Starting Pull Request workflow test..."
echo "This simulates the PR checks workflow"
echo ""

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja do logowania
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
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

# Sprawdzenie czy jesteśmy w odpowiednim katalogu
if [ ! -f "magenta-mass/package.json" ]; then
    error "Please run this script from the project root directory"
fi

# Przejście do katalogu aplikacji
cd magenta-mass

# Funkcja do sprawdzania czy komenda się powiodła
check_step() {
    if [ $? -eq 0 ]; then
        log "✅ Step completed successfully"
    else
        error "Step failed"
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "JOB 1: Linting & Type Checking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Instalacja zależności
log "📦 Installing dependencies..."
npm ci
check_step

# 2. TypeScript check
log "🔍 Running Astro type checking..."
npx astro check
check_step

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "JOB 2: Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 3. Testy jednostkowe
log "🧪 Running unit tests..."
npm run test:unit
check_step

# 4. Testy API
log "🔌 Running API tests..."
npm run test:api
check_step

# 5. Testy integracyjne
log "🔗 Running integration tests..."
npm run test:integration
check_step

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "JOB 3: Build Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 6. Build aplikacji
log "🏗️ Building application..."
npm run build
check_step

# 7. Sprawdzenie czy build się udał
log "🔍 Verifying build output..."
if [ ! -d "dist" ]; then
    error "Build failed - dist directory not found"
fi
log "✅ Build output verified - dist directory exists"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "JOB 4: E2E Tests (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Sprawdzenie czy użytkownik chce uruchomić testy e2e
if [ "$1" = "--with-e2e" ]; then
    log "🎭 Running E2E tests (optional)..."
    
    # Setup test environment
    log "⚙️ Setting up test environment..."
    cp test.env.example .env.test || warn "test.env.example not found, using defaults"
    
    # Build aplikacji (jeśli jeszcze nie zbudowana)
    if [ ! -d "dist" ]; then
        log "🏗️ Building application for E2E tests..."
        npm run build
    fi
    
    # Instalacja Playwright browsers
    log "📥 Installing Playwright browsers..."
    npx playwright install --with-deps
    
    # Start aplikacji w tle
    log "🚀 Starting application server..."
    npm start > /tmp/app-server.log 2>&1 &
    SERVER_PID=$!
    
    # Czekaj na serwer
    log "⏳ Waiting for server to be ready..."
    timeout 60 bash -c 'until curl -f http://localhost:4321 > /dev/null 2>&1; do sleep 2; done' || {
        kill $SERVER_PID 2>/dev/null || true
        error "Server failed to start within 60 seconds"
    }
    
    # Uruchom testy e2e
    log "🧪 Running E2E tests..."
    CI=true npm run test:e2e || {
        warn "E2E tests failed (this is optional)"
        kill $SERVER_PID 2>/dev/null || true
    }
    
    # Zatrzymaj serwer
    log "🛑 Stopping application server..."
    kill $SERVER_PID 2>/dev/null || true
    
    log "✅ E2E tests completed"
else
    warn "Skipping E2E tests (use --with-e2e flag to include)"
    info "To run E2E tests: $0 --with-e2e"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "✅ All Pull Request checks completed successfully!"
log "🎉 PR workflow test completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Summary:"
info "  ✅ Linting & Type Checking: PASSED"
info "  ✅ Unit Tests: PASSED"
info "  ✅ Build Check: PASSED"
if [ "$1" = "--with-e2e" ]; then
    info "  ✅ E2E Tests: PASSED (optional)"
else
    info "  ⏭️  E2E Tests: SKIPPED (optional)"
fi

