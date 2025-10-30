# 🚨 Instrukcja naprawy problemu autoryzacji na produkcji

## Problem
Użytkownicy są przekierowywani do logowania po każdym kliknięciu w aplikacji produkcyjnej.

## Przyczyna
Brak zmiennej środowiskowej `SUPABASE_SERVICE_ROLE_KEY` w konfiguracji Render.com.

## Rozwiązanie

### 1. Dodaj zmienną środowiskową w Render Dashboard

1. Przejdź do swojego projektu na [Render Dashboard](https://dashboard.render.com)
2. Kliknij na swój serwis aplikacji
3. Przejdź do zakładki **"Environment"**
4. Dodaj nową zmienną środowiskową:

```
SUPABASE_SERVICE_ROLE_KEY = twój-service-role-key-tutaj
```

**⚠️ UWAGA:** Zastąp `twój-service-role-key-tutaj` prawdziwym kluczem z Supabase Dashboard (Settings → API → service_role key)

### 2. Jak znaleźć Service Role Key

1. Przejdź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj **service_role** key (nie anon key!)

### 3. Restart aplikacji

Po dodaniu zmiennej środowiskowej:
1. W Render Dashboard kliknij **"Manual Deploy"** → **"Deploy latest commit"**
2. Lub poczekaj na automatyczny restart

## Sprawdzenie

Po restarcie aplikacji:
1. Zaloguj się do aplikacji
2. Sprawdź czy możesz nawigować między stronami bez przekierowań
3. Sprawdź logi w Render Dashboard czy nie ma błędów autoryzacji

## Dodatkowe zmienne środowiskowe (opcjonalne)

Jeśli chcesz pełną funkcjonalność, dodaj też:

```
PUBLIC_SITE_URL = https://twoja-aplikacja.onrender.com
```

## Uwagi bezpieczeństwa

- **NIE** udostępniaj service_role key publicznie
- Service role key ma pełny dostęp do bazy danych
- Używaj go tylko w backend/serwer-side kodzie

## Testowanie lokalne

Aby przetestować lokalnie, utwórz plik `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=twój-service-role-key
PUBLIC_SUPABASE_URL=twój-supabase-url
PUBLIC_SUPABASE_ANON_KEY=twój-anon-key
```

## Kontakt

Jeśli problem nadal występuje, sprawdź:
1. Logi aplikacji w Render Dashboard
2. Konsole przeglądarki (F12 → Console)
3. Network tab w przeglądarce dla błędów API
