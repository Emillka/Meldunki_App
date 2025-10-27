# 🔧 Instrukcja tworzenia konta administratora

## Opcja 1: Użycie skryptu SQL (ZALECANE)

### Krok 1: Otwórz Supabase Dashboard
1. Przejdź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt FireLog
3. Przejdź do zakładki **SQL Editor**

### Krok 2: Uruchom skrypt SQL
1. Skopiuj zawartość pliku `supabase/create-admin.sql`
2. Wklej do SQL Editor
3. Kliknij **Run** aby wykonać skrypt

### Krok 3: Sprawdź wyniki
Po wykonaniu skryptu powinieneś zobaczyć:
- Informację o utworzeniu konta administratora
- Dane logowania:
  - **Email:** `admin@firelog.pl`
  - **Hasło:** `Admin123!@#`
  - **Rola:** Administrator

## Opcja 2: Użycie skryptu Node.js

### Krok 1: Zainstaluj zależności
```bash
cd magenta-mass
npm install dotenv
```

### Krok 2: Ustaw zmienne środowiskowe
Upewnij się, że masz ustawione w pliku `.env`:
```env
PUBLIC_SUPABASE_URL=twoja_supabase_url
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key
```

### Krok 3: Uruchom skrypt
```bash
node src/scripts/create-admin-user.js
```

## Opcja 3: Ręczne utworzenie przez rejestrację

### Krok 1: Zarejestruj konto
1. Przejdź do `/register`
2. Wypełnij formularz rejestracji
3. Wybierz jednostkę OSP

### Krok 2: Zmień rolę na administratora
1. Przejdź do Supabase Dashboard
2. Otwórz tabelę `profiles`
3. Znajdź swój profil
4. Zmień `role` z `member` na `admin`

## 🔐 Dane logowania administratora

Po utworzeniu konta administratora:

- **Email:** `admin@firelog.pl`
- **Hasło:** `Admin123!@#`
- **Rola:** Administrator

## ⚠️ Ważne uwagi bezpieczeństwa

1. **Zmień hasło** po pierwszym logowaniu
2. **Nie udostępniaj** danych logowania
3. **Używaj silnego hasła** (min. 8 znaków, wielkie/małe litery, cyfry, znaki specjalne)
4. **Regularnie aktualizuj** hasło administratora

## 🎯 Funkcje administratora

Po zalogowaniu jako administrator będziesz mieć dostęp do:

### Panel administracyjny
- Zarządzanie użytkownikami jednostki OSP
- Awansowanie/degradowanie użytkowników
- Przegląd statystyk jednostki
- Zarządzanie meldunkami wszystkich użytkowników

### Uprawnienia
- **Zarządzanie użytkownikami:** Dodawanie, usuwanie, zmiana ról
- **Zarządzanie meldunkami:** Edycja, usuwanie meldunków wszystkich użytkowników
- **Statystyki:** Dostęp do szczegółowych statystyk jednostki
- **Eksport danych:** Możliwość eksportu meldunków (w przyszłości)

## 🚀 Pierwsze kroki po utworzeniu konta

1. **Zaloguj się** używając danych administratora
2. **Zmień hasło** w zakładce "Profil"
3. **Sprawdź panel administracyjny** w zakładce "Admin"
4. **Dodaj użytkowników** do swojej jednostki OSP
5. **Przetestuj funkcje** zarządzania użytkownikami

## 📞 Wsparcie

Jeśli masz problemy z utworzeniem konta administratora:

1. Sprawdź logi w Supabase Dashboard
2. Upewnij się, że masz odpowiednie uprawnienia
3. Skontaktuj się z zespołem wsparcia

---

**Powodzenia w zarządzaniu systemem FireLog! 🚒🔥**
