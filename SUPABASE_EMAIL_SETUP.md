# 📧 Konfiguracja Email w Supabase

## Problem: Maile resetujące hasło nie przychodzą

Jeśli maile resetujące hasło nie przychodzą, najprawdopodobniej problem jest w konfiguracji SMTP w Supabase.

## 🔧 Rozwiązanie: Konfiguracja SMTP w Supabase

### Krok 1: Przejdź do ustawień Supabase

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **Auth** → **Email Templates**

### Krok 2: Sprawdź konfigurację SMTP

1. W sekcji **SMTP Settings** sprawdź czy SMTP jest skonfigurowany
2. Jeśli nie ma konfiguracji SMTP, Supabase używa domyślnego serwera (który może mieć limity)

### Krok 3: Skonfiguruj własny SMTP (Zalecane)

#### Opcja A: Użyj SendGrid (Darmowy plan: 100 emaili/dzień)

1. **Utwórz konto SendGrid:**
   - Przejdź do https://sendgrid.com
   - Zarejestruj się (darmowy plan)
   - Zweryfikuj email

2. **Utwórz API Key:**
   - Settings → API Keys → Create API Key
   - Nadaj nazwę (np. "Supabase SMTP")
   - Wybierz uprawnienia: "Full Access" lub "Mail Send"
   - Skopiuj API Key (będzie potrzebny tylko raz)

3. **Skonfiguruj w Supabase:**
   - Settings → Auth → SMTP Settings
   - Włącz "Enable Custom SMTP"
   - Wypełnij:
     ```
     SMTP Host: smtp.sendgrid.net
     SMTP Port: 587
     SMTP User: apikey
     SMTP Password: [Twój SendGrid API Key]
     Sender Email: noreply@twoja-domena.com (lub użyj weryfikowanego emaila)
     Sender Name: FireLog (lub dowolna nazwa)
     ```

#### Opcja B: Użyj Gmail SMTP

1. **Włącz 2FA w Gmail:**
   - Ustawienia Google → Security → 2-Step Verification

2. **Utwórz App Password:**
   - Google Account → Security → App passwords
   - Wybierz "Mail" i "Other"
   - Skopiuj wygenerowane hasło

3. **Skonfiguruj w Supabase:**
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: twoj-email@gmail.com
   SMTP Password: [App Password z Google]
   Sender Email: twoj-email@gmail.com
   Sender Name: FireLog
   ```

#### Opcja C: Użyj innego dostawcy SMTP

Popularne opcje:
- **Mailgun** (darmowy: 5000 emaili/miesiąc przez 3 miesiące)
- **Amazon SES** (bardzo tanie, ~$0.10 za 1000 emaili)
- **Postmark** (darmowy: 100 emaili/miesiąc)
- **Resend** (darmowy: 3000 emaili/miesiąc)

### Krok 4: Skonfiguruj Email Templates (Opcjonalne)

1. W Supabase Dashboard → Settings → Auth → Email Templates
2. Możesz dostosować szablon emaila resetującego hasło
3. Upewnij się, że link zawiera: `{{ .ConfirmationURL }}`

### Krok 5: Sprawdź Site URL i Redirect URLs

1. W Supabase Dashboard → Settings → Auth → URL Configuration
2. Upewnij się, że **Site URL** jest ustawiony na:
   - Produkcja: `https://meldunki-app.onrender.com` (lub twoja domena)
   - Development: `http://localhost:4321`
3. Dodaj **Redirect URLs** (ważne dla resetu hasła!):
   - `https://meldunki-app.onrender.com/reset-password`
   - `https://meldunki-app.onrender.com/**` (wildcard dla wszystkich ścieżek)
   - `http://localhost:4321/reset-password` (dla developmentu)
   - `http://localhost:4321/**` (wildcard dla developmentu)

**⚠️ Ważne:** Jeśli maile aktywacyjne działają, ale reset hasła nie, sprawdź czy:
- Redirect URL dla resetu hasła jest dodany do whitelist
- Email template dla "Reset Password" jest włączony
- SMTP jest skonfigurowany (wymagane dla obu typów emaili)

### Krok 6: Testowanie

1. Przejdź do `/forgot-password` w aplikacji
2. Wprowadź email
3. Sprawdź logi w Supabase Dashboard → Logs → Auth Logs
4. Sprawdź skrzynkę email (również folder SPAM)

## 🔍 Debugowanie

### Sprawdź logi aplikacji

W logach aplikacji (Render Dashboard lub lokalnie) powinieneś zobaczyć:
```
Requesting password reset for email: ...
Redirect URL: https://meldunki-app.onrender.com/reset-password
Password reset email sent successfully
```

### Sprawdź logi Supabase

1. Supabase Dashboard → Logs → Auth Logs
2. Szukaj wpisów związanych z `resetPasswordForEmail`
3. Sprawdź czy są błędy SMTP

### Typowe błędy

1. **"SMTP configuration issue"**
   - Sprawdź czy SMTP jest poprawnie skonfigurowany
   - Sprawdź czy port jest poprawny (587 dla TLS, 465 dla SSL)

2. **"Email not sent"**
   - Sprawdź czy sender email jest zweryfikowany
   - Sprawdź limity dostawcy SMTP

3. **"Invalid redirect URL"**
   - Sprawdź czy URL jest dodany do Redirect URLs w Supabase
   - Sprawdź czy URL jest poprawny (bez końcowego slash)

## ⚠️ Ważne uwagi

1. **Darmowy plan Supabase:**
   - Ma limit emaili (około 3 na godzinę)
   - Może nie działać niezawodnie bez własnego SMTP

2. **Bezpieczeństwo:**
   - Nigdy nie commituj kluczy SMTP do git
   - Używaj zmiennych środowiskowych
   - Rotuj klucze regularnie

3. **Produkcja:**
   - Zawsze używaj własnego SMTP w produkcji
   - Monitoruj limity i użycie
   - Skonfiguruj alerty dla błędów

## 📚 Więcej informacji

- [Supabase Email Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**Po skonfigurowaniu SMTP, maile resetujące hasło powinny działać poprawnie!** ✅

