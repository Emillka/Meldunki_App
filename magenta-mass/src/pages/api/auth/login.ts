import type { APIRoute } from 'astro';
import { AuthService } from '../../../lib/services/auth.service';
import { validateEmail } from '../../../lib/validation/auth.validation';
import { successResponse, errorResponse } from '../../../lib/utils/response';
import { rateLimiter } from '../../../lib/utils/rate-limiter';

/**
 * POST /api/auth/login
 * 
 * Endpoint logowania użytkownika
 * 
 * @returns 200 OK - logowanie udane
 * @returns 400 Bad Request - błąd walidacji
 * @returns 401 Unauthorized - nieprawidłowe dane logowania
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
      `login:${clientIp}`,
      5, // max 5 requests
      900000 // per 15 minutes (15 * 60 * 1000)
    );
    
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many login attempts. Please try again later.',
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
    const errors: Record<string, string> = {};
    
    if (!body || typeof body !== 'object') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid request body'
      );
    }
    
    const { email, password } = body as { email?: unknown; password?: unknown };
    
    // Email validation
    if (!email || typeof email !== 'string') {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Invalid email format';
    }
    
    // Password validation
    if (!password || typeof password !== 'string') {
      errors.password = 'Password is required';
    }
    
    if (Object.keys(errors).length > 0) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid input data',
        errors
      );
    }
    
    // ============================================================================
    // 4. CALL AUTH SERVICE
    // ============================================================================
    const authService = new AuthService();
    const { data, error } = await authService.loginUser(
      (email as string).trim().toLowerCase(),
      password as string
    );
    
    // ============================================================================
    // 5. HANDLE SERVICE ERRORS
    // ============================================================================
    if (error) {
      // Invalid credentials
      if (error.message === 'INVALID_CREDENTIALS') {
        return errorResponse(
          401,
          'INVALID_CREDENTIALS',
          'Invalid email or password'
        );
      }
      
      // Generic server error
      console.error('Login error:', {
        error: error.message,
        email: (email as string).trim().toLowerCase(),
        timestamp: new Date().toISOString()
      });
      
      return errorResponse(
        500,
        'SERVER_ERROR',
        'An unexpected error occurred during login'
      );
    }
    
    // ============================================================================
    // 6. SUCCESS RESPONSE
    // ============================================================================
    return successResponse(
      data!,
      'Login successful',
      200
    );
    
  } catch (error) {
    // ============================================================================
    // CATCH-ALL ERROR HANDLER
    // ============================================================================
    console.error('Unexpected error in /api/auth/login:', error);
    
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred'
    );
  }
};

