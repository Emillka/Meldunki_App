# 🚀 Szybki Deployment na Render.com

## Krok 1: Przygotowanie

1. **Masz konto Render?**
   - Jeśli nie: https://render.com → Get Started for Free
   - Zaloguj się przez GitHub (zalecane)

2. **Masz Supabase Production?**
   - Utwórz projekt na https://supabase.com
   - Skopiuj URL i klucze (Settings → API)

## Krok 2: Utworzenie serwisu w Render

1. **Nowy Web Service**
   - Render Dashboard → "New +" → "Web Service"
   - Połącz z GitHub → wybierz repo `Meldunki_App`

2. **Ustawienia podstawowe**
   ```
   Name: meldunki-app
   Root Directory: magenta-mass
   Environment: Node
   Branch: main
   Region: Frankfurt (lub inny europejski)
   Plan: Free
   ```

3. **Build & Start Commands**
   ```
   Build Command: npm ci && npm run build
   Start Command: npm start
   ```

4. **Health Check**
   ```
   Health Check Path: /api/health
   ```

## Krok 3: Environment Variables

W sekcji "Environment Variables" dodaj:

```
PUBLIC_SUPABASE_URL=https://twój-projekt.supabase.co
PUBLIC_SUPABASE_ANON_KEY=twój-anon-key
SUPABASE_SERVICE_ROLE_KEY=twój-service-role-key
NODE_ENV=production
```

**Opcjonalnie:**
```
OPENROUTER_API_KEY=twój-openrouter-key (jeśli używasz AI)
```

## Krok 4: Deploy!

1. Kliknij **"Create Web Service"**
2. Render automatycznie:
   - Sklonuje repo
   - Zainstaluje zależności (`npm ci`)
   - Zbuduje aplikację (`npm run build`)
   - Uruchomi serwis (`npm start`)

## Krok 5: Weryfikacja

1. **Poczekaj na zakończenie build** (2-5 minut)
2. **Sprawdź status** - powinien być "Live"
3. **Sprawdź URL** - Render wygeneruje URL (np. `https://meldunki-app.onrender.com`)
4. **Test health check:**
   ```bash
   curl https://meldunki-app.onrender.com/api/health
   ```
5. **Otwórz w przeglądarce:**
   - Strona główna: `https://meldunki-app.onrender.com`
   - Login: `https://meldunki-app.onrender.com/login`
   - Register: `https://meldunki-app.onrender.com/register`

## 🎉 Gotowe!

Aplikacja jest na produkcji! Każdy push do `main` automatycznie zaktualizuje aplikację.

## ⚠️ Ważne informacje

### Render Free Tier:
- **Sleep po 15min** - aplikacja "zasypia" po nieaktywności
- **Cold start** - pierwsze request po "obudzeniu" może być wolny (10-30s)
- **750h/miesiąc** - limit godzin działania
- **512MB RAM** - ograniczona pamięć

### Automatyczny deployment:
- Render automatycznie deployuje przy push do `main`
- Możesz też ręcznie uruchomić deployment w Render Dashboard

### Logi i monitoring:
- **Logi**: Render Dashboard → Twój serwis → Logs
- **Metryki**: Render Dashboard → Twój serwis → Metrics
- **Status**: Render Dashboard → Twój serwis → Status

## 🔧 Rozwiązywanie problemów

### Build failed?
1. Sprawdź logi w Render Dashboard → Logs
2. Sprawdź czy build działa lokalnie: `npm run build`
3. Sprawdź czy wszystkie zmienne środowiskowe są ustawione

### App not starting?
1. Sprawdź Start Command: `npm start`
2. Sprawdź logi aplikacji
3. Sprawdź zmienne środowiskowe Supabase

### Health check failed?
1. Sprawdź czy `/api/health` endpoint istnieje
2. Sprawdź czy zmienne środowiskowe Supabase są poprawne
3. Sprawdź logi aplikacji

## 📚 Więcej informacji

- **Szczegółowy przewodnik**: [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Render Docs**: https://render.com/docs

---

**Powodzenia! 🚀**
