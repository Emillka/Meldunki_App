# 🔒 Naprawa wycieku klucza Supabase Service Role Key

## 🚨 Problem
Supabase Service Role Key został wykryty jako publicznie wyeksponowany w repozytorium przez GitHub Secret Scanning.

## ✅ Co zostało naprawione?
- ✅ Usunięto klucz z pliku `PRODUCTION_FIX_INSTRUCTIONS.md`
- ✅ Zastąpiono go placeholderem

## ⚠️ CRITICAL: Co musisz zrobić TERAZ

### 1. Zrotuj klucz w Supabase (WYMAGANE!)

**Klucz został publicznie wyeksponowany i MUSI być zrotowany natychmiast.**

1. Przejdź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Znajdź sekcję **service_role** key
5. Kliknij **"Reset"** lub **"Rotate"** aby wygenerować nowy klucz
6. **Skopiuj nowy klucz** (zapisz go w bezpiecznym miejscu)

### 2. Zaktualizuj zmienne środowiskowe w Render.com

1. Przejdź do [Render Dashboard](https://dashboard.render.com)
2. Kliknij na swój serwis aplikacji
3. Przejdź do zakładki **"Environment"**
4. Znajdź zmienną `SUPABASE_SERVICE_ROLE_KEY`
5. Zaktualizuj ją na **nowy klucz** z Supabase
6. Zapisz zmiany

### 3. Zrestartuj aplikację

Po zaktualizowaniu zmiennej:
1. W Render Dashboard kliknij **"Manual Deploy"** → **"Deploy latest commit"**
2. Lub poczekaj na automatyczny restart

### 4. Sprawdź historię Git i usuń wyciek z historii (opcjonalne, ale zalecane)

Jeśli klucz był w historii commitów, powinieneś go usunąć:

```bash
# Uwaga: Ta operacja przepisuje historię Git
# Upewnij się, że masz backup i współpracownicy są świadomi

# Użyj git-filter-repo lub BFG Repo-Cleaner
# Przykład z git-filter-repo:
pip install git-filter-repo
git filter-repo --replace-text <(echo "STARY_KLUCZ==>REDACTED")

# Lub użyj BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/
```

**Alternatywnie:** Jeśli repozytorium jest publiczne, rozważ:
- Przeniesienie do prywatnego repozytorium
- Lub utworzenie nowego repozytorium i przeniesienie kodu

### 5. Zamknij alert w GitHub

1. Przejdź do sekcji **Security** → **Secret scanning alerts** w GitHub
2. Zamknij alert jako "Resolved" po wykonaniu powyższych kroków

## 🔍 Sprawdzenie czy wszystko działa

Po rotacji klucza:

1. Zaloguj się do aplikacji
2. Sprawdź czy możesz wykonywać operacje wymagające autoryzacji
3. Sprawdź logi w Render Dashboard czy nie ma błędów autoryzacji
4. Sprawdź czy wszystkie endpointy API działają poprawnie

## 📝 Zapobieganie w przyszłości

### Używaj plików .env (nigdy nie commituj!)

```bash
# Dodaj do .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### Używaj przykładów zamiast prawdziwych kluczy

W plikach dokumentacji zawsze używaj:
```env
SUPABASE_SERVICE_ROLE_KEY=twój-service-role-key-tutaj
```

Zamiast:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Używaj GitHub Secrets dla CI/CD

W GitHub Actions używaj Secrets zamiast hardcodowania:
```yaml
env:
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## ⚡ Priorytet

**Wykonaj kroki 1-3 NATYCHMIAST** - stary klucz jest zagrożeniem bezpieczeństwa!

