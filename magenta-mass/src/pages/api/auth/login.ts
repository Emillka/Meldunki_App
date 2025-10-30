import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';
import type { LoginRequestDTO } from '@/lib/types';

/**
 * POST /api/auth/login
 * Loguje użytkownika do systemu
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // More permissive and precise rate limiting: key by IP + email (if available)
    // Allow env overrides: RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS
    let bodyForKey: any = undefined;
    try {
      bodyForKey = JSON.parse((await request.clone().text()) || '{}');
    } catch {}

    // Make generic limiter permissive by default
    const rlMax = Number(process.env.RATE_LIMIT_MAX ?? import.meta.env.RATE_LIMIT_MAX ?? 100); // default 100 req
    const rlWindow = Number(process.env.RATE_LIMIT_WINDOW_MS ?? import.meta.env.RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000); // default 10 min

    const rateLimit = rateLimiter.check(
      `login:${clientIp}:${(bodyForKey?.email || '').toString().toLowerCase()}`,
      rlMax,
      rlWindow
    );

    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many login attempts. Please try again later.',
        { retry_after: rateLimit.retryAfter }
      );
    }

    // 2. Parse request body
    let body: unknown;
    try {
      const text = await request.text();
      console.log('Raw login request body:', text); // Debugging line
      body = JSON.parse(text);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid JSON in request body'
      );
    }

    // 3. Validate request data
    const dto = body as LoginRequestDTO;
    
    if (!dto.email || !dto.password) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Email and password are required'
      );
    }

    // 4. Sanitize email
    const email = dto.email.trim().toLowerCase();
    
    if (!email.includes('@') || email.length < 5) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid email format'
      );
    }

    // 5. Execute login
    const authService = new AuthService();
    const { data, error } = await authService.loginUser(email, dto.password);

    if (error) {
      // Handle specific error types
      if (error.message === 'INVALID_CREDENTIALS') {
        // Stricter limiter only for failed attempts per IP+email
        const failMax = Number(process.env.FAIL_RATE_LIMIT_MAX ?? import.meta.env.FAIL_RATE_LIMIT_MAX ?? 10); // default 10 failed attempts
        const failWindow = Number(process.env.FAIL_RATE_LIMIT_WINDOW_MS ?? import.meta.env.FAIL_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000); // default 15 min
        const failedLimit = rateLimiter.check(
          `loginfail:${clientIp}:${email}`,
          failMax,
          failWindow
        );
        if (!failedLimit.allowed) {
          return errorResponse(
            429,
            'TOO_MANY_REQUESTS',
            'Too many failed login attempts. Please try again later.',
            { retry_after: failedLimit.retryAfter }
          );
        }
        return errorResponse(
          401,
          'INVALID_CREDENTIALS',
          'Invalid email or password'
        );
      }

      if (error.message === 'EMAIL_NOT_CONFIRMED') {
        return errorResponse(
          403,
          'EMAIL_NOT_CONFIRMED',
          'Musisz potwierdzić swój adres email przed zalogowaniem. Sprawdź swoją skrzynkę pocztową i kliknij link aktywacyjny.'
        );
      }

      // Generic error
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Login failed. Please try again.',
        { original_error: error.message }
      );
    }

    // 6. Success response
    return successResponse(
      data,
      'Login successful'
    );

  } catch (error) {
    console.error('Login endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred during login'
    );
  }
};
