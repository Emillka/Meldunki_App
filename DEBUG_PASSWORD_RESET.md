# 🔍 Debugowanie Resetu Hasła

## Problem: Maile resetujące hasło nie przychodzą

Jeśli maile resetujące hasło nie przychodzą, wykonaj następujące kroki:

## Krok 1: Sprawdź logi aplikacji

### W produkcji (Render):
1. Przejdź do Render Dashboard
2. Wybierz swój serwis
3. Kliknij "Logs"
4. Szukaj logów zaczynających się od `=== Password Reset Request ===`

### Lokalnie:
1. Otwórz terminal gdzie działa aplikacja
2. Szukaj logów zaczynających się od `=== Password Reset Request ===`

### Co sprawdzić w logach:
- ✅ `Email:` - czy email jest poprawny
- ✅ `Redirect URL:` - czy URL jest poprawny
- ✅ `User exists in database:` - czy użytkownik istnieje
- ❌ `Password reset request error:` - czy są błędy
- ✅ `Password reset email sent successfully` - czy email został wysłany

## Krok 2: Sprawdź konfigurację Supabase

### 2.1. Redirect URLs
1. Supabase Dashboard → Settings → Auth → URL Configuration
2. Sprawdź czy dodane są:
   - `https://meldunki-app.onrender.com/reset-password`
   - `https://meldunki-app.onrender.com/**` (wildcard)

### 2.2. Email Templates
1. Supabase Dashboard → Settings → Auth → Email Templates
2. Sprawdź czy template "Reset Password" jest **włączony**
3. Sprawdź czy link w template zawiera: `{{ .ConfirmationURL }}`

### 2.3. SMTP Configuration
1. Supabase Dashboard → Settings → Auth → SMTP Settings
2. Sprawdź czy SMTP jest skonfigurowany
3. Jeśli nie - zobacz `SUPABASE_EMAIL_SETUP.md`

### 2.4. Rate Limiting
1. Supabase Dashboard → Settings → Auth → Rate Limits
2. Sprawdź limity dla "Password Reset"
3. Może być limit na liczbę emaili na godzinę

## Krok 3: Sprawdź czy użytkownik istnieje

### Problem:
Supabase **nie wysyła** maila resetującego jeśli użytkownik nie istnieje, ale **nie zwraca błędu** (dla bezpieczeństwa).

### Rozwiązanie:
1. Sprawdź w logach: `User exists in database: true/false`
2. Jeśli `false` - użytkownik nie istnieje w bazie
3. Upewnij się, że używasz tego samego emaila co przy rejestracji

## Krok 4: Sprawdź Supabase Auth Logs

1. Supabase Dashboard → Logs → Auth Logs
2. Szukaj wpisów związanych z `resetPasswordForEmail`
3. Sprawdź czy są błędy SMTP

## Krok 5: Testowanie

### Test 1: Sprawdź czy endpoint działa
```bash
curl -X POST https://meldunki-app.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"twoj-email@example.com"}'
```

### Test 2: Sprawdź logi w czasie rzeczywistym
1. Otwórz Render Dashboard → Logs
2. Wprowadź email na stronie `/forgot-password`
3. Obserwuj logi w czasie rzeczywistym

## Krok 6: Typowe problemy i rozwiązania

### Problem 1: "User exists in database: false"
**Rozwiązanie:** Użytkownik nie istnieje. Upewnij się, że:
- Email jest poprawny (sprawdź wielkość liter)
- Użytkownik został zarejestrowany
- Email został zweryfikowany

### Problem 2: "Rate limit exceeded"
**Rozwiązanie:** Zbyt wiele prób resetu hasła. Poczekaj godzinę lub:
- Sprawdź limity w Supabase Dashboard
- Zwiększ limity jeśli to możliwe

### Problem 3: "SMTP configuration issue"
**Rozwiązanie:** SMTP nie jest skonfigurowany. Zobacz `SUPABASE_EMAIL_SETUP.md`

### Problem 4: Email przychodzi, ale link nie działa
**Rozwiązanie:** Problem z Redirect URL. Sprawdź:
- Czy URL jest dodany do whitelist w Supabase
- Czy URL jest poprawny (bez końcowego slash)
- Czy używasz HTTPS w produkcji

### Problem 5: Brak błędów, ale email nie przychodzi
**Możliwe przyczyny:**
1. Email trafia do SPAM - sprawdź folder SPAM
2. Supabase ma limit emaili - sprawdź limity
3. SMTP ma problemy - sprawdź logi Supabase
4. Email nie istnieje w bazie - sprawdź logi aplikacji

## Krok 7: Alternatywne rozwiązanie

Jeśli standardowe `resetPasswordForEmail` nie działa, możesz użyć Admin API:

```typescript
// W Supabase Dashboard → Settings → API
// Użyj Service Role Key (nie anon key!)

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
await adminSupabase.auth.admin.generateLink({
  type: 'recovery',
  email: email,
  options: {
    redirectTo: redirectUrl
  }
});
```

**⚠️ Uwaga:** To wymaga Service Role Key i powinno być używane tylko server-side!

## 📞 Wsparcie

Jeśli problem nadal występuje:
1. Sprawdź wszystkie logi (aplikacja + Supabase)
2. Sprawdź konfigurację Supabase (SMTP, Redirect URLs, Templates)
3. Sprawdź czy użytkownik istnieje w bazie
4. Sprawdź folder SPAM w skrzynce email

---

**Pamiętaj:** Supabase nie zwraca błędu jeśli email nie istnieje (dla bezpieczeństwa). Zawsze sprawdzaj logi aplikacji!

