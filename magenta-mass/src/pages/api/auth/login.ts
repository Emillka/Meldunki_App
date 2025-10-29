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

    const rateLimit = rateLimiter.check(
      `login:${clientIp}`,
      5, // max 5 requests
      900000 // per 15 minutes
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
