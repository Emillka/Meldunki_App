import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { validatePasswordStrength } from '@/lib/validation/auth.validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';

/**
 * POST /api/auth/reset-password
 * Resetuje hasło użytkownika używając tokena z linku
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const rateLimit = rateLimiter.check(
      `reset-password:${clientIp}`,
      5, // max 5 requests
      3600000 // per hour
    );
    
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many password reset attempts. Please try again later.',
        { retry_after: rateLimit.retryAfter }
      );
    }
    
    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid JSON in request body'
      );
    }
    
    // 3. Validate password
    const { password } = body as { password?: string };
    
    if (!password || typeof password !== 'string') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Hasło jest wymagane'
      );
    }
    
    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        `Hasło nie spełnia wymagań: ${passwordCheck.errors.join(', ')}`
      );
    }
    
    // 4. Reset password
    const authService = new AuthService();
    const { data, error } = await authService.resetPassword(password);
    
    if (error) {
      return errorResponse(
        400,
        'PASSWORD_RESET_ERROR',
        'Nie udało się zresetować hasła. Link może być nieprawidłowy lub wygasły. Spróbuj ponownie.'
      );
    }
    
    // 5. Success response
    return successResponse(
      data,
      'Hasło zostało pomyślnie zresetowane.'
    );
    
  } catch (error) {
    console.error('Reset password endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'Wystąpił błąd podczas resetowania hasła'
    );
  }
};
