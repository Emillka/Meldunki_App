import type { APIRoute } from 'astro';
import { AuthService } from '../../../lib/services/auth.service';
import { 
  validateRegisterRequest, 
  sanitizeString 
} from '../../../lib/validation/auth.validation';
import { successResponse, errorResponse } from '../../../lib/utils/response';
import { rateLimiter } from '../../../lib/utils/rate-limiter';
import type { RegisterRequestDTO, RegisterUserCommand } from '../../../lib/types';

/**
 * POST /api/auth/register
 * 
 * Endpoint rejestracji nowego użytkownika w systemie FireLog
 * 
 * Funkcjonalności:
 * - Rate limiting (3 żądania/godzinę per IP)
 * - Walidacja danych wejściowych
 * - Sanityzacja stringów (XSS prevention)
 * - Utworzenie użytkownika przez Supabase Auth
 * - Automatyczne utworzenie profilu (trigger bazodanowy)
 * - Zwrócenie sesji JWT
 * 
 * @returns 201 Created - użytkownik utworzony
 * @returns 400 Bad Request - błąd walidacji
 * @returns 404 Not Found - jednostka OSP nie istnieje
 * @returns 409 Conflict - email już istnieje
 * @returns 429 Too Many Requests - przekroczony limit
 * @returns 500 Internal Server Error - błąd serwera
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // ============================================================================
    // 1. RATE LIMITING CHECK
    // ============================================================================
    const clientIp = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const rateLimit = rateLimiter.check(
      `register:${clientIp}`,
      3, // max 3 requests
      3600000 // per hour (1h = 3600000ms)
    );
    
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many registration attempts. Please try again later.',
        { retry_after: rateLimit.retryAfter }
      );
    }
    
    // ============================================================================
    // 2. PARSE REQUEST BODY
    // ============================================================================
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
    
    // ============================================================================
    // 3. VALIDATE REQUEST DATA
    // ============================================================================
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
    
    // ============================================================================
    // 4. SANITIZE STRING INPUTS
    // ============================================================================
    const sanitizedDto: RegisterRequestDTO = {
      email: dto.email.trim().toLowerCase(),
      password: dto.password, // NEVER log or modify password!
      fire_department_id: dto.fire_department_id,
      first_name: sanitizeString(dto.first_name) || undefined,
      last_name: sanitizeString(dto.last_name) || undefined,
      role: dto.role || 'member'
    };
    
    // ============================================================================
    // 5. CREATE COMMAND MODEL
    // ============================================================================
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
    
    // ============================================================================
    // 6. CALL AUTH SERVICE
    // ============================================================================
    const authService = new AuthService();
    const { data, error } = await authService.registerUser(command);
    
    // ============================================================================
    // 7. HANDLE SERVICE ERRORS
    // ============================================================================
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
    
    // ============================================================================
    // 8. SUCCESS RESPONSE
    // ============================================================================
    return successResponse(
      data!,
      'User registered successfully',
      201
    );
    
  } catch (error) {
    // ============================================================================
    // CATCH-ALL ERROR HANDLER
    // ============================================================================
    console.error('Unexpected error in /api/auth/register:', error);
    
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred'
    );
  }
};

