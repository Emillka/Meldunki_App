# API Endpoint Implementation Plan: POST /api/auth/register

## 1. Przegląd punktu końcowego

Endpoint `POST /api/auth/register` umożliwia rejestrację nowego użytkownika w systemie FireLog. Proces rejestracji obejmuje:

1. Utworzenie konta użytkownika w Supabase Auth (tabela `auth.users`)
2. Automatyczne utworzenie profilu użytkownika w tabeli `profiles` za pomocą triggera bazodanowego
3. Powiązanie użytkownika z jednostką Ochotniczej Straży Pożarnej (OSP)
4. Wygenerowanie i zwrócenie sesji JWT (access token + refresh token)

**Kluczowe cechy:**
- Publiczny dostęp (nie wymaga uwierzytelnienia)
- Transakcyjna operacja (user + profile utworzone atomowo)
- Walidacja istnienia jednostki OSP przed rejestracją
- Automatyczne hashowanie hasła przez Supabase (bcrypt)
- Zwraca pełny kontekst użytkownika (user + profile + session)

---

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
```
POST /api/auth/register
```

### Nagłówki żądania
```
Content-Type: application/json
```

### Parametry

#### Wymagane

| Parametr | Typ | Walidacja | Opis |
|----------|-----|-----------|------|
| `email` | `string` | - Format email RFC 5322<br>- Unikalność w bazie<br>- Max 255 znaków | Adres email użytkownika |
| `password` | `string` | - Min. 8 znaków<br>- Zawiera wielką literę<br>- Zawiera małą literę<br>- Zawiera cyfrę<br>- Zawiera znak specjalny | Hasło użytkownika |
| `fire_department_id` | `string (UUID)` | - Format UUID v4<br>- Istnieje w `fire_departments` | ID jednostki OSP |

#### Opcjonalne

| Parametr | Typ | Walidacja | Domyślna wartość | Opis |
|----------|-----|-----------|------------------|------|
| `first_name` | `string?` | - Max 100 znaków<br>- Trimming whitespace<br>- Sanityzacja XSS | `null` | Imię użytkownika |
| `last_name` | `string?` | - Max 100 znaków<br>- Trimming whitespace<br>- Sanityzacja XSS | `null` | Nazwisko użytkownika |
| `role` | `'member' \| 'admin'` | - Enum: 'member' lub 'admin' | `'member'` | Rola użytkownika w systemie |

### Request Body (przykład)

```json
{
  "email": "jan.kowalski@osp.pl",
  "password": "SecurePassword123!",
  "fire_department_id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "role": "member"
}
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**Request:**
```typescript
// src/lib/types.ts
import type { RegisterRequestDTO } from '@/lib/types';

interface RegisterRequestDTO {
  email: string;
  password: string;
  fire_department_id: string;
  first_name?: string;
  last_name?: string;
  role?: 'member' | 'admin';
}
```

**Response (Success):**
```typescript
// src/lib/types.ts
import type { 
  RegisterResponseDTO, 
  UserDTO, 
  ProfileDTO, 
  SessionDTO,
  ApiSuccessResponse 
} from '@/lib/types';

interface RegisterResponseDTO {
  user: UserDTO;
  profile: ProfileDTO;
  session: SessionDTO;
}

type RegisterSuccessResponse = ApiSuccessResponse<RegisterResponseDTO>;
```

**Response (Error):**
```typescript
// src/lib/types.ts
import type { ApiErrorResponse, ErrorCode } from '@/lib/types';

interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Command Models

```typescript
// src/lib/types.ts
import type { RegisterUserCommand } from '@/lib/types';

interface RegisterUserCommand {
  email: string;
  password: string;
  profile: {
    fire_department_id: string;
    first_name?: string;
    last_name?: string;
    role: 'member' | 'admin';
  };
}
```

### Database Types

```typescript
// src/lib/db/types.ts
import type { Profile, FireDepartment } from '@/lib/db/types';
```

---

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)

**Status Code:** `201 Created`

**Struktura:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "jan.kowalski@osp.pl",
      "created_at": "2025-10-23T12:00:00.000Z"
    },
    "profile": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "fire_department_id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "role": "member",
      "created_at": "2025-10-23T12:00:00.000Z",
      "updated_at": "2025-10-23T12:00:00.000Z"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "refresh_token_here",
      "expires_at": 1730030400,
      "expires_in": 604800
    }
  },
  "message": "User registered successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "password": "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character",
      "email": "Invalid email format"
    }
  }
}
```

**Przykładowe scenariusze:**
- Słabe hasło (nie spełnia wymagań)
- Nieprawidłowy format email
- Nieprawidłowy format UUID dla `fire_department_id`
- Niewłaściwa wartość `role` (nie 'member' ani 'admin')
- Brakujące wymagane pola

#### 404 Not Found - Fire Department Not Found

```json
{
  "success": false,
  "error": {
    "code": "FIRE_DEPARTMENT_NOT_FOUND",
    "message": "The specified fire department does not exist",
    "details": {
      "fire_department_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

#### 409 Conflict - Email Already Exists

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists",
    "details": {}
  }
}
```

**Uwaga:** Nie ujawniamy dokładnego emaila w szczegółach błędu ze względów bezpieczeństwa (zapobieganie email enumeration).

#### 429 Too Many Requests - Rate Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many registration attempts. Please try again later.",
    "details": {
      "retry_after": 3600
    }
  }
}
```

**Rate Limit:** 3 requests per hour per IP address

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred during registration",
    "details": {}
  }
}
```

**Uwaga:** Szczegóły błędu serwera NIE są ujawniane klientowi, ale są logowane po stronie serwera.

---

## 5. Przepływ danych

### Diagram przepływu

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /api/auth/register
     │ { email, password, fire_department_id, ... }
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  API Route: src/pages/api/auth/register.ts          │
│  ┌───────────────────────────────────────────────┐  │
│  │ 1. Walidacja request body                      │  │
│  │    - Sprawdzenie wymaganych pól                │  │
│  │    - Walidacja formatów (email, UUID)          │  │
│  │    - Walidacja siły hasła                      │  │
│  │    - Sanityzacja danych wejściowych            │  │
│  └───────────────────────────────────────────────┘  │
│                      │                               │
│                      ▼                               │
│  ┌───────────────────────────────────────────────┐  │
│  │ 2. Wywołanie AuthService.registerUser()        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  AuthService (src/lib/services/auth.service.ts)     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 3. Walidacja fire_department_id                │  │
│  │    - Zapytanie do tabeli fire_departments      │  │
│  │    - Sprawdzenie istnienia jednostki           │  │
│  └────────────┬──────────────────────────────────┘  │
│               │                                      │
│               ▼                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 4. Utworzenie użytkownika przez Supabase Auth  │  │
│  │    - supabase.auth.signUp()                    │  │
│  │    - Przekazanie metadanych profilu            │  │
│  │      (fire_department_id, role)                │  │
│  └────────────┬──────────────────────────────────┘  │
└────────────────┼──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Supabase Auth (auth.users)                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ 5. Tworzenie rekordu w auth.users              │  │
│  │    - Hashowanie hasła (bcrypt)                 │  │
│  │    - Generowanie UUID użytkownika              │  │
│  │    - Zapisanie metadanych w raw_user_meta_data │  │
│  └────────────┬──────────────────────────────────┘  │
│               │                                      │
│               │ Trigger: on_auth_user_created        │
│               ▼                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 6. Automatyczne utworzenie profilu             │  │
│  │    - Wywołanie triggera                        │  │
│  │      public.handle_new_user()                  │  │
│  └────────────┬──────────────────────────────────┘  │
└────────────────┼──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  PostgreSQL Database (profiles)                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 7. Insert do tabeli profiles                   │  │
│  │    - id = auth.users.id                        │  │
│  │    - fire_department_id z metadanych           │  │
│  │    - first_name, last_name                     │  │
│  │    - role (domyślnie 'member')                 │  │
│  │    - created_at, updated_at = NOW()            │  │
│  └────────────┬──────────────────────────────────┘  │
└────────────────┼──────────────────────────────────┘
                 │
                 │ Success
                 ▼
┌─────────────────────────────────────────────────────┐
│  AuthService                                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ 8. Pobranie utworzonego profilu                │  │
│  │    - SELECT z profiles WHERE id = user.id      │  │
│  └────────────┬──────────────────────────────────┘  │
│               │                                      │
│               ▼                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 9. Zwrócenie danych do API Route               │  │
│  │    { user, profile, session }                  │  │
│  └────────────┬──────────────────────────────────┘  │
└────────────────┼──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  API Route                                           │
│  ┌───────────────────────────────────────────────┐  │
│  │ 10. Formatowanie odpowiedzi                    │  │
│  │     - Utworzenie ApiSuccessResponse            │  │
│  │     - Status 201 Created                       │  │
│  └────────────┬──────────────────────────────────┘  │
└────────────────┼──────────────────────────────────┘
                 │
                 ▼
           ┌──────────┐
           │  Client  │
           └──────────┘
```

### Szczegółowy opis kroków

1. **Walidacja request body** - endpoint waliduje dane wejściowe zgodnie z regułami biznesowymi
2. **Delegacja do AuthService** - logika biznesowa wyodrębniona do service layer
3. **Walidacja jednostki OSP** - sprawdzenie czy `fire_department_id` istnieje w bazie
4. **Utworzenie użytkownika** - wywołanie `supabase.auth.signUp()` z metadanymi
5. **Zapis w auth.users** - Supabase tworzy rekord z zahashowanym hasłem
6. **Trigger bazodanowy** - automatyczne uruchomienie `handle_new_user()`
7. **Utworzenie profilu** - INSERT do tabeli `profiles` z danymi z metadanych
8. **Pobranie profilu** - weryfikacja utworzenia profilu
9. **Zwrot danych** - przekazanie kompletu danych (user + profile + session)
10. **Odpowiedź HTTP** - formatowanie jako `ApiSuccessResponse` z kodem 201

### Transakcyjność

- Utworzenie użytkownika i profilu odbywa się **atomowo** dzięki triggerowi bazodanowemu
- Jeśli trigger nie powiedzie się, Supabase Auth **rollbackuje** utworzenie użytkownika
- Jeśli walidacja `fire_department_id` nie powiedzie się, proces nie rozpocznie się

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie i autoryzacja

- **Endpoint publiczny** - nie wymaga uwierzytelnienia (każdy może się zarejestrować)
- **Rate limiting** - 3 requests/hour per IP address
- **JWT tokens** - sesja ważna 7 dni, zarządzana przez Supabase Auth

### 6.2. Walidacja danych wejściowych

#### Email
```typescript
function validateEmail(email: string): boolean {
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}
```

#### Password Strength
```typescript
function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### UUID Validation
```typescript
function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

#### XSS Prevention
```typescript
function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 255); // Limit length
}
```

### 6.3. Zabezpieczenie hasła

- **Hashing:** bcrypt (automatycznie przez Supabase Auth)
- **Salt rounds:** 10 (domyślnie w Supabase)
- **Nigdy nie logować** oryginalnego hasła
- **Nigdy nie zwracać** hasła w odpowiedzi API

### 6.4. Zapobieganie Email Enumeration

```typescript
// ❌ ZŁE: Ujawnia informację czy email istnieje
if (emailExists) {
  return { error: 'Email jan.kowalski@osp.pl already exists' };
}

// ✅ DOBRE: Ogólny komunikat
if (emailExists) {
  return { error: 'An account with this email already exists' };
}
```

### 6.5. SQL Injection Prevention

- Wykorzystanie Supabase SDK (parametryzowane zapytania)
- **Brak** bezpośrednich zapytań SQL z konkatenacją stringów
- Wszystkie dane wejściowe walidowane przed użyciem

### 6.6. HTTPS Enforcement

```typescript
// Middleware sprawdzający protokół w produkcji
if (import.meta.env.PROD && request.headers.get('x-forwarded-proto') !== 'https') {
  return new Response('HTTPS required', { status: 403 });
}
```

### 6.7. CORS Policy

```typescript
// Astro middleware - tylko dozwolone origins
const allowedOrigins = import.meta.env.ALLOWED_ORIGINS?.split(',') || [];
const origin = request.headers.get('Origin');

if (origin && !allowedOrigins.includes(origin)) {
  return new Response('Forbidden', { status: 403 });
}
```

### 6.8. Rate Limiting

```typescript
// Implementacja prostego rate limitera (in-memory)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimiter.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimiter.set(ip, {
      count: 1,
      resetAt: now + 3600000 // 1 hour
    });
    return true;
  }
  
  if (limit.count >= 3) {
    return false; // Rate limit exceeded
  }
  
  limit.count++;
  return true;
}
```

**Uwaga:** W produkcji zaleca się wykorzystanie Redis lub zewnętrznego service do rate limiting.

---

## 7. Obsługa błędów

### 7.1. Hierarchia obsługi błędów

```
API Route
    │
    ├─► Validation Errors (400)
    │   └─► Zwrócenie ApiErrorResponse z details
    │
    ├─► AuthService
    │   ├─► Fire Department Not Found (404)
    │   ├─► Email Already Exists (409)
    │   └─► Supabase Errors
    │       ├─► Auth Errors (500)
    │       └─► Database Errors (500)
    │
    └─► Unexpected Errors (500)
        └─► Logowanie do systemu monitoringu
```

### 7.2. Szczegółowa obsługa błędów

#### Błędy walidacji (400)

```typescript
try {
  // Walidacja formatu email
  if (!validateEmail(email)) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid email format', {
      email: 'Email must be a valid email address'
    });
  }
  
  // Walidacja siły hasła
  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid password', {
      password: passwordCheck.errors.join(', ')
    });
  }
  
  // Walidacja UUID
  if (!validateUUID(fire_department_id)) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid fire department ID', {
      fire_department_id: 'Must be a valid UUID'
    });
  }
  
  // Walidacja role
  if (role && !['member', 'admin'].includes(role)) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid role', {
      role: 'Role must be either "member" or "admin"'
    });
  }
} catch (error) {
  // Handle validation errors
}
```

#### Błąd jednostki OSP (404)

```typescript
const fireDepartment = await supabase
  .from('fire_departments')
  .select('id')
  .eq('id', fire_department_id)
  .single();

if (!fireDepartment.data) {
  return errorResponse(
    404, 
    'FIRE_DEPARTMENT_NOT_FOUND', 
    'The specified fire department does not exist',
    { fire_department_id }
  );
}
```

#### Błąd duplikatu emaila (409)

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: profileData }
});

if (error?.message.includes('already registered')) {
  return errorResponse(
    409,
    'EMAIL_ALREADY_EXISTS',
    'An account with this email already exists'
  );
}
```

#### Błąd limitu żądań (429)

```typescript
const clientIp = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';

if (!checkRateLimit(clientIp)) {
  return errorResponse(
    429,
    'TOO_MANY_REQUESTS',
    'Too many registration attempts. Please try again later.',
    { retry_after: 3600 }
  );
}
```

#### Błędy serwera (500)

```typescript
try {
  // ... registration logic
} catch (error) {
  // Log error details server-side
  console.error('Registration error:', {
    error,
    email, // Don't log password!
    fire_department_id,
    timestamp: new Date().toISOString()
  });
  
  // Return generic error to client
  return errorResponse(
    500,
    'SERVER_ERROR',
    'An unexpected error occurred during registration'
  );
}
```

### 7.3. Helper funkcja do błędów

```typescript
function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 7.4. Logowanie błędów

**Struktura logu:**
```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  endpoint: string;
  errorCode: ErrorCode;
  message: string;
  metadata: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  stack?: string;
}
```

**Przykład:**
```typescript
const errorLog: ErrorLog = {
  timestamp: new Date().toISOString(),
  level: 'error',
  endpoint: '/api/auth/register',
  errorCode: 'SERVER_ERROR',
  message: error.message,
  metadata: {
    ip: clientIp,
    userAgent: request.headers.get('user-agent') || 'unknown',
    requestId: crypto.randomUUID()
  },
  stack: error.stack
};

// W produkcji: wysłanie do external logging service (np. Sentry, LogRocket)
console.error(JSON.stringify(errorLog));
```

---

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

#### 1. Sprawdzanie istnienia fire_department
- **Problem:** Dodatkowe zapytanie do bazy danych przed rejestracją
- **Wpływ:** ~50-100ms latencji
- **Optymalizacja:** 
  - Cache listy fire_departments w Redis (TTL: 1 hour)
  - Walidacja po stronie klienta przed wysłaniem żądania

#### 2. Trigger bazodanowy (profile creation)
- **Problem:** Trigger wykonuje się synchronicznie podczas rejestracji
- **Wpływ:** ~20-50ms dodatkowej latencji
- **Optymalizacja:**
  - Obecnie wymagane dla transakcyjności
  - W przyszłości: rozważyć async job queue dla post-registration tasks

#### 3. Multiple database writes
- **Problem:** Insert do auth.users + insert do profiles
- **Wpływ:** ~100-200ms łącznie
- **Optymalizacja:**
  - Wykorzystanie connection pooling (Supabase domyślnie)
  - Monitorowanie database performance metrics

#### 4. Password hashing (bcrypt)
- **Problem:** bcrypt jest CPU-intensive (10 salt rounds)
- **Wpływ:** ~100-300ms na hash
- **Optymalizacja:**
  - Zarządzane przez Supabase - brak kontroli
  - W przyszłości: rozważyć Argon2 jeśli dostępne

### 8.2. Strategie optymalizacji

#### Caching fire_departments

```typescript
// Pseudo-code dla Redis cache
const getCachedFireDepartment = async (id: string) => {
  // Check cache first
  const cached = await redis.get(`fire_dept:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const { data } = await supabase
    .from('fire_departments')
    .select('id, name')
    .eq('id', id)
    .single();
  
  // Store in cache (1 hour TTL)
  if (data) {
    await redis.setex(`fire_dept:${id}`, 3600, JSON.stringify(data));
  }
  
  return data;
};
```

#### Database Indexes

Sprawdź istnienie indeksów:
```sql
-- Index na fire_departments.id już istnieje (PRIMARY KEY)
-- Brak dodatkowych indeksów wymaganych dla tego endpointa
```

#### Response compression

```typescript
// Astro middleware - włączenie gzip dla odpowiedzi
import compress from 'astro-compress';

// W astro.config.mjs
export default defineConfig({
  integrations: [compress()]
});
```

#### Monitoring wydajności

```typescript
// Pomiar czasu wykonania
const startTime = performance.now();

try {
  // ... registration logic
} finally {
  const duration = performance.now() - startTime;
  
  // Log performance metric
  console.log(`Registration completed in ${duration.toFixed(2)}ms`);
  
  // Alert if too slow (> 2 seconds)
  if (duration > 2000) {
    console.warn('Slow registration detected', { duration, email });
  }
}
```

### 8.3. Oczekiwana wydajność

| Metryka | Wartość docelowa | Warunek |
|---------|------------------|---------|
| **Response time (p50)** | < 500ms | Normalne obciążenie |
| **Response time (p95)** | < 1000ms | Normalne obciążenie |
| **Response time (p99)** | < 2000ms | Peak load |
| **Throughput** | 10 req/sec | Per server instance |
| **Error rate** | < 1% | Excluding user errors (4xx) |

### 8.4. Load Testing

```bash
# Przykład z Apache Bench
ab -n 100 -c 10 -p register-payload.json -T application/json \
   https://api.firelog.app/api/auth/register

# Przykład z k6
import http from 'k6/http';

export default function() {
  const payload = JSON.stringify({
    email: `user-${__ITER}@test.pl`,
    password: 'SecurePass123!',
    fire_department_id: '550e8400-e29b-41d4-a716-446655440000'
  });
  
  http.post('https://api.firelog.app/api/auth/register', payload, {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 9. Kroki implementacji

### Krok 1: Utworzenie typów i interfejsów

**Lokalizacja:** `src/lib/types.ts`

```typescript
// Dodanie brakujących typów do istniejącego pliku
// (większość już istnieje, sprawdzić completeness)

export interface RegisterRequestDTO {
  email: string;
  password: string;
  fire_department_id: string;
  first_name?: string;
  last_name?: string;
  role?: 'member' | 'admin';
}

export interface RegisterResponseDTO {
  user: UserDTO;
  profile: ProfileDTO;
  session: SessionDTO;
}

// ... (pozostałe typy już zdefiniowane)
```

**Czas:** ~15 minut  
**Testy:** Type checking (`npm run typecheck`)

---

### Krok 2: Utworzenie funkcji walidacji

**Lokalizacja:** `src/lib/validation/auth.validation.ts`

```typescript
import type { RegisterRequestDTO } from '@/lib/types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Waliduje dane wejściowe dla rejestracji użytkownika
 */
export function validateRegisterRequest(
  data: unknown
): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Type guard
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _general: 'Invalid request body' } };
  }
  
  const dto = data as Partial<RegisterRequestDTO>;
  
  // Email validation
  if (!dto.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(dto.email)) {
    errors.email = 'Invalid email format';
  }
  
  // Password validation
  if (!dto.password) {
    errors.password = 'Password is required';
  } else {
    const passwordCheck = validatePasswordStrength(dto.password);
    if (!passwordCheck.valid) {
      errors.password = passwordCheck.errors.join(', ');
    }
  }
  
  // Fire department ID validation
  if (!dto.fire_department_id) {
    errors.fire_department_id = 'Fire department ID is required';
  } else if (!validateUUID(dto.fire_department_id)) {
    errors.fire_department_id = 'Invalid fire department ID format';
  }
  
  // First name validation (optional)
  if (dto.first_name && dto.first_name.length > 100) {
    errors.first_name = 'First name must not exceed 100 characters';
  }
  
  // Last name validation (optional)
  if (dto.last_name && dto.last_name.length > 100) {
    errors.last_name = 'Last name must not exceed 100 characters';
  }
  
  // Role validation (optional)
  if (dto.role && !['member', 'admin'].includes(dto.role)) {
    errors.role = 'Role must be either "member" or "admin"';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Waliduje format email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Waliduje siłę hasła
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Must contain number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Must contain special character');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Waliduje format UUID v4
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanityzuje string (XSS prevention)
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input) return null;
  return input.trim().replace(/[<>]/g, '').substring(0, 255);
}
```

**Czas:** ~45 minut  
**Testy:** Unit testy dla każdej funkcji walidacji

---

### Krok 3: Utworzenie AuthService

**Lokalizacja:** `src/lib/services/auth.service.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { 
  RegisterUserCommand, 
  RegisterResponseDTO,
  UserDTO,
  ProfileDTO,
  SessionDTO
} from '@/lib/types';
import type { Database } from '@/lib/db/database.types';

export class AuthService {
  private supabase: ReturnType<typeof createClient<Database>>;
  
  constructor() {
    this.supabase = createClient<Database>(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  
  /**
   * Rejestruje nowego użytkownika w systemie
   */
  async registerUser(
    command: RegisterUserCommand
  ): Promise<{ data: RegisterResponseDTO | null; error: Error | null }> {
    try {
      // 1. Sprawdzenie istnienia fire_department
      const fireDeptExists = await this.validateFireDepartmentExists(
        command.profile.fire_department_id
      );
      
      if (!fireDeptExists) {
        return {
          data: null,
          error: new Error('FIRE_DEPARTMENT_NOT_FOUND')
        };
      }
      
      // 2. Utworzenie użytkownika przez Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: command.email,
        password: command.password,
        options: {
          data: {
            fire_department_id: command.profile.fire_department_id,
            first_name: command.profile.first_name,
            last_name: command.profile.last_name,
            role: command.profile.role
          }
        }
      });
      
      if (authError) {
        // Check for duplicate email
        if (authError.message.includes('already registered')) {
          return {
            data: null,
            error: new Error('EMAIL_ALREADY_EXISTS')
          };
        }
        
        return { data: null, error: authError };
      }
      
      if (!authData.user || !authData.session) {
        return {
          data: null,
          error: new Error('User or session not created')
        };
      }
      
      // 3. Pobranie utworzonego profilu (utworzonego przez trigger)
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError || !profile) {
        return {
          data: null,
          error: profileError || new Error('Profile not created')
        };
      }
      
      // 4. Formatowanie odpowiedzi
      const user: UserDTO = {
        id: authData.user.id,
        email: authData.user.email!,
        created_at: authData.user.created_at
      };
      
      const profileDTO: ProfileDTO = {
        id: profile.id,
        fire_department_id: profile.fire_department_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
      
      const session: SessionDTO = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at!,
        expires_in: authData.session.expires_in!
      };
      
      return {
        data: {
          user,
          profile: profileDTO,
          session
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
  
  /**
   * Sprawdza czy jednostka OSP istnieje w bazie
   */
  private async validateFireDepartmentExists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('fire_departments')
      .select('id')
      .eq('id', id)
      .single();
    
    return !error && !!data;
  }
}
```

**Czas:** ~1 godzina  
**Testy:** Integration tests z testową bazą Supabase

---

### Krok 4: Utworzenie utility functions

**Lokalizacja:** `src/lib/utils/response.ts`

```typescript
import type { ApiSuccessResponse, ApiErrorResponse, ErrorCode } from '@/lib/types';

/**
 * Tworzy standardową odpowiedź sukcesu
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Tworzy standardową odpowiedź błędu
 */
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

**Lokalizacja:** `src/lib/utils/rate-limiter.ts`

```typescript
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  /**
   * Sprawdza czy request może być przetworzony
   * @param key - Klucz identyfikujący klienta (np. IP address)
   * @param maxRequests - Maksymalna liczba żądań
   * @param windowMs - Okno czasowe w milisekundach
   */
  check(key: string, maxRequests: number, windowMs: number): {
    allowed: boolean;
    retryAfter?: number;
  } {
    const now = Date.now();
    const limit = this.limits.get(key);
    
    // Brak poprzednich żądań lub okno wygasło
    if (!limit || now > limit.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return { allowed: true };
    }
    
    // Przekroczono limit
    if (limit.count >= maxRequests) {
      const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    // Zwiększ licznik
    limit.count++;
    return { allowed: true };
  }
  
  /**
   * Czyszczenie wygasłych wpisów (garbage collection)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup co 5 minut
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
```

**Czas:** ~30 minut  
**Testy:** Unit tests dla rate limiter

---

### Krok 5: Utworzenie API route

**Lokalizacja:** `src/pages/api/auth/register.ts`

```typescript
import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { 
  validateRegisterRequest, 
  sanitizeString 
} from '@/lib/validation/auth.validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';
import type { RegisterRequestDTO, RegisterUserCommand } from '@/lib/types';

/**
 * POST /api/auth/register
 * Rejestruje nowego użytkownika w systemie
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const rateLimit = rateLimiter.check(
      `register:${clientIp}`,
      3, // max 3 requests
      3600000 // per hour
    );
    
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many registration attempts. Please try again later.',
        { retry_after: rateLimit.retryAfter }
      );
    }
    
    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid JSON in request body'
      );
    }
    
    // 3. Validate request data
    const validation = validateRegisterRequest(body);
    if (!validation.valid) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid input data',
        validation.errors
      );
    }
    
    const dto = body as RegisterRequestDTO;
    
    // 4. Sanitize string inputs
    const sanitizedDto: RegisterRequestDTO = {
      email: dto.email.trim().toLowerCase(),
      password: dto.password, // NEVER log or modify password
      fire_department_id: dto.fire_department_id,
      first_name: sanitizeString(dto.first_name) || undefined,
      last_name: sanitizeString(dto.last_name) || undefined,
      role: dto.role || 'member'
    };
    
    // 5. Create command model
    const command: RegisterUserCommand = {
      email: sanitizedDto.email,
      password: sanitizedDto.password,
      profile: {
        fire_department_id: sanitizedDto.fire_department_id,
        first_name: sanitizedDto.first_name,
        last_name: sanitizedDto.last_name,
        role: sanitizedDto.role!
      }
    };
    
    // 6. Call AuthService
    const authService = new AuthService();
    const { data, error } = await authService.registerUser(command);
    
    // 7. Handle errors
    if (error) {
      // Fire department not found
      if (error.message === 'FIRE_DEPARTMENT_NOT_FOUND') {
        return errorResponse(
          404,
          'FIRE_DEPARTMENT_NOT_FOUND',
          'The specified fire department does not exist',
          { fire_department_id: sanitizedDto.fire_department_id }
        );
      }
      
      // Email already exists
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return errorResponse(
          409,
          'EMAIL_ALREADY_EXISTS',
          'An account with this email already exists'
        );
      }
      
      // Generic server error
      console.error('Registration error:', {
        error: error.message,
        email: sanitizedDto.email,
        fire_department_id: sanitizedDto.fire_department_id,
        timestamp: new Date().toISOString()
      });
      
      return errorResponse(
        500,
        'SERVER_ERROR',
        'An unexpected error occurred during registration'
      );
    }
    
    // 8. Success response
    return successResponse(
      data!,
      'User registered successfully',
      201
    );
    
  } catch (error) {
    // Catch-all error handler
    console.error('Unexpected error in /api/auth/register:', error);
    
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred'
    );
  }
};
```

**Czas:** ~1 godzina  
**Testy:** E2E tests z rzeczywistymi HTTP requests

---

### Krok 6: Utworzenie testów jednostkowych

**Lokalizacja:** `src/lib/validation/__tests__/auth.validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validatePasswordStrength, 
  validateUUID,
  validateRegisterRequest
} from '../auth.validation';

describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
  });
  
  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });
  
  it('should reject too long email', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(validateEmail(longEmail)).toBe(false);
  });
});

describe('validatePasswordStrength', () => {
  it('should accept strong password', () => {
    const result = validatePasswordStrength('StrongPass123!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject weak password', () => {
    const result = validatePasswordStrength('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  it('should require uppercase letter', () => {
    const result = validatePasswordStrength('lowercase123!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
  });
  
  it('should require special character', () => {
    const result = validatePasswordStrength('NoSpecial123');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('special'))).toBe(true);
  });
});

describe('validateUUID', () => {
  it('should accept valid UUID v4', () => {
    expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });
  
  it('should reject invalid UUID', () => {
    expect(validateUUID('not-a-uuid')).toBe(false);
    expect(validateUUID('123')).toBe(false);
  });
});

describe('validateRegisterRequest', () => {
  const validDto = {
    email: 'test@example.com',
    password: 'StrongPass123!',
    fire_department_id: '550e8400-e29b-41d4-a716-446655440000'
  };
  
  it('should accept valid registration data', () => {
    const result = validateRegisterRequest(validDto);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });
  
  it('should reject missing email', () => {
    const result = validateRegisterRequest({ ...validDto, email: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });
  
  it('should reject invalid email format', () => {
    const result = validateRegisterRequest({ ...validDto, email: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toContain('Invalid');
  });
  
  it('should reject weak password', () => {
    const result = validateRegisterRequest({ ...validDto, password: 'weak' });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });
  
  it('should reject invalid role', () => {
    const result = validateRegisterRequest({ 
      ...validDto, 
      role: 'invalid_role' 
    });
    expect(result.valid).toBe(false);
    expect(result.errors.role).toBeDefined();
  });
  
  it('should accept optional fields', () => {
    const result = validateRegisterRequest({
      ...validDto,
      first_name: 'Jan',
      last_name: 'Kowalski',
      role: 'admin'
    });
    expect(result.valid).toBe(true);
  });
});
```

**Czas:** ~1 godzina  
**Coverage:** > 90%

---

### Krok 7: Testy integracyjne

**Lokalizacja:** `src/lib/services/__tests__/auth.service.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../auth.service';
import type { RegisterUserCommand } from '@/lib/types';

// Test z wykorzystaniem testowej bazy Supabase
describe('AuthService.registerUser', () => {
  let authService: AuthService;
  const testFireDeptId = '550e8400-e29b-41d4-a716-446655440000'; // Use seeded test data
  
  beforeAll(() => {
    authService = new AuthService();
  });
  
  it('should successfully register a new user', async () => {
    const command: RegisterUserCommand = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      profile: {
        fire_department_id: testFireDeptId,
        first_name: 'Jan',
        last_name: 'Testowy',
        role: 'member'
      }
    };
    
    const { data, error } = await authService.registerUser(command);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.user.email).toBe(command.email);
    expect(data?.profile.fire_department_id).toBe(testFireDeptId);
    expect(data?.session.access_token).toBeDefined();
  });
  
  it('should reject registration with non-existent fire department', async () => {
    const command: RegisterUserCommand = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      profile: {
        fire_department_id: '00000000-0000-0000-0000-000000000000',
        role: 'member'
      }
    };
    
    const { data, error } = await authService.registerUser(command);
    
    expect(data).toBeNull();
    expect(error?.message).toBe('FIRE_DEPARTMENT_NOT_FOUND');
  });
  
  it('should reject duplicate email registration', async () => {
    const email = `duplicate-${Date.now()}@example.com`;
    
    const command: RegisterUserCommand = {
      email,
      password: 'TestPassword123!',
      profile: {
        fire_department_id: testFireDeptId,
        role: 'member'
      }
    };
    
    // First registration
    await authService.registerUser(command);
    
    // Second registration with same email
    const { data, error } = await authService.registerUser(command);
    
    expect(data).toBeNull();
    expect(error?.message).toBe('EMAIL_ALREADY_EXISTS');
  });
});
```

**Czas:** ~1 godzina  
**Wymagania:** Testowa baza Supabase z seed data

---

### Krok 8: Testy E2E

**Lokalizacja:** `tests/e2e/auth-register.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:4321';

describe('POST /api/auth/register E2E', () => {
  it('should successfully register a new user', async () => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'StrongPass123!',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: 'Jan',
        last_name: 'Kowalski',
        role: 'member'
      })
    });
    
    expect(response.status).toBe(201);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user).toBeDefined();
    expect(body.data.profile).toBeDefined();
    expect(body.data.session).toBeDefined();
  });
  
  it('should return 400 for invalid email', async () => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'StrongPass123!',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    });
    
    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 404 for non-existent fire department', async () => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'StrongPass123!',
        fire_department_id: '00000000-0000-0000-0000-000000000000'
      })
    });
    
    expect(response.status).toBe(404);
    
    const body = await response.json();
    expect(body.error.code).toBe('FIRE_DEPARTMENT_NOT_FOUND');
  });
  
  it('should return 429 after exceeding rate limit', async () => {
    const email = `ratelimit-${Date.now()}@example.com`;
    
    // Make 3 requests (rate limit)
    for (let i = 0; i < 3; i++) {
      await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${i}-${email}`,
          password: 'StrongPass123!',
          fire_department_id: '550e8400-e29b-41d4-a716-446655440000'
        })
      });
    }
    
    // 4th request should be rate limited
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `4-${email}`,
        password: 'StrongPass123!',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    });
    
    expect(response.status).toBe(429);
    
    const body = await response.json();
    expect(body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(body.error.details.retry_after).toBeDefined();
  });
});
```

**Czas:** ~1 godzina  
**Wymagania:** Lokalny serwer dev (`npm run dev`)

---

### Krok 9: Dokumentacja i finalizacja

**Zadania:**

1. **Aktualizacja README.md projektu**
   - Dodanie sekcji o endpoincie `/api/auth/register`
   - Przykłady użycia (curl, fetch)
   
2. **Dodanie komentarzy JSDoc** (jeśli nie ma)
   - W funkcjach walidacji
   - W AuthService
   - W API route
   
3. **Sprawdzenie TypeScript errors**
   ```bash
   npm run build
   ```
   
4. **Uruchomienie wszystkich testów**
   ```bash
   npm run test
   ```
   
5. **Code review checklist:**
   - [ ] Wszystkie typy TypeScript poprawne
   - [ ] Brak hardcoded secrets
   - [ ] Environment variables poprawnie używane
   - [ ] Error handling comprehensive
   - [ ] Validation rules zgodne ze specyfikacją
   - [ ] Tests coverage > 80%
   - [ ] Performance < 1s response time
   - [ ] Security best practices zastosowane

**Czas:** ~1 godzina

---

### Krok 10: Deployment i monitoring

**Zadania:**

1. **Konfiguracja environment variables w produkcji:**
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ALLOWED_ORIGINS=https://firelog.app
   NODE_ENV=production
   ```

2. **Deployment do platformy hostingowej** (np. Vercel, Netlify)

3. **Konfiguracja monitoringu:**
   - Error tracking (np. Sentry)
   - Performance monitoring (np. New Relic)
   - Uptime monitoring (np. UptimeRobot)

4. **Testowanie w środowisku produkcyjnym:**
   - Smoke tests
   - Load tests
   - Security scan

**Czas:** ~2 godziny

---

## Podsumowanie kroków

| Krok | Zadanie | Szacowany czas | Priorytet |
|------|---------|----------------|-----------|
| 1 | Utworzenie typów i interfejsów | 15 min | Wysoki |
| 2 | Funkcje walidacji | 45 min | Wysoki |
| 3 | AuthService | 1h | Wysoki |
| 4 | Utility functions | 30 min | Średni |
| 5 | API route | 1h | Wysoki |
| 6 | Testy jednostkowe | 1h | Wysoki |
| 7 | Testy integracyjne | 1h | Średni |
| 8 | Testy E2E | 1h | Średni |
| 9 | Dokumentacja | 1h | Średni |
| 10 | Deployment i monitoring | 2h | Niski (MVP) |
| **RAZEM** | | **~10 godzin** | |

---

## Checklist implementacji

### Pre-implementation
- [ ] Przeczytać cały plan implementacji
- [ ] Zrozumieć flow danych
- [ ] Sprawdzić czy wszystkie typy są zdefiniowane w `src/lib/types.ts`
- [ ] Sprawdzić czy trigger `handle_new_user()` działa w Supabase

### Implementation
- [ ] Krok 1: Typy i interfejsy
- [ ] Krok 2: Funkcje walidacji + testy
- [ ] Krok 3: AuthService + testy
- [ ] Krok 4: Utility functions + testy
- [ ] Krok 5: API route
- [ ] Krok 6-8: Wszystkie testy przechodzą
- [ ] Krok 9: Dokumentacja

### Post-implementation
- [ ] Code review przeprowadzony
- [ ] Security review przeprowadzony
- [ ] Performance testing zakończone
- [ ] Deployment na staging
- [ ] QA testing na staging
- [ ] Deployment na production
- [ ] Monitoring skonfigurowany

---

## Dodatkowe uwagi

### Security Best Practices
1. **Nigdy nie loguj haseł** - nawet w errorach
2. **Sanityzuj wszystkie string inputs** - zapobieganie XSS
3. **Wykorzystuj prepared statements** - Supabase SDK robi to automatycznie
4. **Rate limiting** - implementuj od początku
5. **HTTPS only** - wymuszaj w produkcji

### Performance Tips
1. **Cache reference data** - fire_departments, provinces, counties
2. **Monitor response times** - alert jeśli > 2s
3. **Database indexes** - sprawdź czy są odpowiednie
4. **Connection pooling** - Supabase robi to automatycznie

### Testing Strategy
1. **Unit tests** - każda funkcja walidacji, każda metoda service
2. **Integration tests** - AuthService z testową bazą
3. **E2E tests** - pełny flow przez HTTP
4. **Manual testing** - przetestuj w UI przed release

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Author:** AI Architecture Team  
**Status:** Ready for Implementation

