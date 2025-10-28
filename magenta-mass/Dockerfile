# Multi-stage Dockerfile dla aplikacji Astro + Supabase
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików package.json i package-lock.json
COPY magenta-mass/package*.json ./

# Instalacja zależności
RUN npm ci --only=production --silent

# Kopiowanie kodu źródłowego
COPY magenta-mass/ .

# Build aplikacji
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Instalacja dumb-init dla proper signal handling
RUN apk add --no-cache dumb-init

# Utworzenie użytkownika non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S astro -u 1001

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie package.json dla production dependencies
COPY magenta-mass/package*.json ./

# Instalacja tylko production dependencies
RUN npm ci --only=production --silent && npm cache clean --force

# Kopiowanie zbudowanej aplikacji z builder stage
COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=builder --chown=astro:nodejs /app/public ./public

# Kopiowanie plików konfiguracyjnych
COPY --chown=astro:nodejs magenta-mass/astro.config.mjs ./
COPY --chown=astro:nodejs magenta-mass/tsconfig.json ./

# Zmiana właściciela plików
RUN chown -R astro:nodejs /app

# Przełączenie na użytkownika non-root
USER astro

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4321/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Uruchomienie aplikacji z dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "./dist/server/entry.mjs"]
