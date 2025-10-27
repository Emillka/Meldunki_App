# Authentication API Endpoints

## Overview

This directory contains authentication-related API endpoints for the FireLog application.

---

## POST `/api/auth/register`

Registers a new user in the system.

### Request

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
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

**Required Fields:**
- `email` (string) - Valid email address (max 255 characters)
- `password` (string) - Must contain:
  - At least 8 characters
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character
- `fire_department_id` (UUID) - Valid UUID of existing fire department

**Optional Fields:**
- `first_name` (string) - Max 100 characters
- `last_name` (string) - Max 100 characters
- `role` (string) - Either "member" or "admin" (defaults to "member")

### Responses

#### Success (201 Created)

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

#### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Must be at least 8 characters; Must contain uppercase letter"
    }
  }
}
```

#### Fire Department Not Found (404 Not Found)

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

#### Email Already Exists (409 Conflict)

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

#### Rate Limit Exceeded (429 Too Many Requests)

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

#### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred during registration"
  }
}
```

---

## Usage Examples

### cURL

```bash
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jan.kowalski@osp.pl",
    "password": "SecurePassword123!",
    "fire_department_id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "role": "member"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'jan.kowalski@osp.pl',
    password: 'SecurePassword123!',
    fire_department_id: '550e8400-e29b-41d4-a716-446655440000',
    first_name: 'Jan',
    last_name: 'Kowalski',
    role: 'member'
  })
});

const data = await response.json();

if (data.success) {
  console.log('User registered:', data.data.user);
  console.log('Access token:', data.data.session.access_token);
} else {
  console.error('Registration failed:', data.error);
}
```

### TypeScript (with types)

```typescript
import type { 
  RegisterRequestDTO, 
  RegisterResponseDTO, 
  ApiSuccessResponse,
  ApiErrorResponse 
} from '@/lib/types';

async function registerUser(
  userData: RegisterRequestDTO
): Promise<RegisterResponseDTO> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });

  const result: ApiSuccessResponse<RegisterResponseDTO> | ApiErrorResponse = 
    await response.json();

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

// Usage
try {
  const data = await registerUser({
    email: 'jan.kowalski@osp.pl',
    password: 'SecurePassword123!',
    fire_department_id: '550e8400-e29b-41d4-a716-446655440000',
    first_name: 'Jan',
    last_name: 'Kowalski',
    role: 'member'
  });
  
  console.log('Registered successfully:', data.user);
  
  // Store access token
  localStorage.setItem('access_token', data.session.access_token);
  
} catch (error) {
  console.error('Registration failed:', error);
}
```

---

## Security Features

### Rate Limiting
- **Limit:** 3 requests per hour per IP address
- **Purpose:** Prevent automated registration attacks
- **Implementation:** In-memory rate limiter (for production, use Redis)

### Password Security
- Passwords are validated for strength before submission to Supabase
- Passwords are hashed using bcrypt (handled by Supabase Auth)
- Passwords are never logged or returned in responses

### Input Sanitization
- All string inputs are trimmed and sanitized
- HTML tags are removed to prevent XSS attacks
- String length is limited to prevent buffer overflow

### Email Validation
- RFC 5322 compliant email validation
- Maximum length: 255 characters
- Case-insensitive storage (normalized to lowercase)

### UUID Validation
- Only valid UUID v4 format accepted for `fire_department_id`
- Prevents SQL injection via malformed UUIDs

---

## Error Handling

All errors follow a consistent format:

```typescript
{
  success: false,
  error: {
    code: ErrorCode,        // Standard error code
    message: string,        // Human-readable message
    details?: object        // Optional additional details
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `FIRE_DEPARTMENT_NOT_FOUND` | 404 | Fire department ID does not exist |
| `EMAIL_ALREADY_EXISTS` | 409 | Email is already registered |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Suite Coverage

- ✅ Email validation (4 test cases)
- ✅ Password strength validation (7 test cases)
- ✅ UUID validation (4 test cases)
- ✅ String sanitization (6 test cases)
- ✅ Complete registration validation (17 test cases)

**Total:** 38 test cases with >90% coverage

---

## Environment Variables

Required environment variables for this endpoint:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: CORS Configuration
ALLOWED_ORIGINS=http://localhost:4321,https://firelog.app
```

---

## Implementation Details

### Architecture

```
Request → Rate Limiter → Validation → Sanitization → AuthService → Supabase Auth
                                                                          ↓
                                                                  Database Trigger
                                                                          ↓
                                                                  Profile Creation
                                                                          ↓
Response ← Format Response ← Fetch Profile ← ←  ←  ←  ←  ←  ←  ←  ←  ←  ←
```

### Database Trigger

Profile creation is handled by a database trigger (`handle_new_user()`):
- Triggered automatically when a new user is created in `auth.users`
- Creates corresponding record in `profiles` table
- Uses metadata from `auth.users.raw_user_meta_data`
- Ensures transactional consistency (rollback if profile creation fails)

### Session Management

- JWT tokens are valid for 7 days (604,800 seconds)
- Refresh tokens are provided for seamless re-authentication
- Tokens should be stored securely (httpOnly cookies recommended for production)

---

## Future Enhancements

Planned improvements for post-MVP:

- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] OAuth providers (Google, Facebook)
- [ ] Redis-based distributed rate limiting
- [ ] 2FA (Two-Factor Authentication)
- [ ] Account lockout after failed attempts

---

## Related Documentation

- [API Plan](../../../../.ai/api-plan.md) - Complete API specification
- [Database Schema](../../../../supabase/migrations/) - Database structure
- [Types](../../../lib/types.ts) - TypeScript type definitions
- [Validation](../../../lib/validation/auth.validation.ts) - Validation logic
- [AuthService](../../../lib/services/auth.service.ts) - Business logic

---

**Last Updated:** October 23, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready

