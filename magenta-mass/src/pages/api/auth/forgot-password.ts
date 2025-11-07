import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';
import { validateEmail } from '@/lib/validation/auth.validation';

/**
 * POST /api/auth/forgot-password
 * Wysyła email z linkiem do resetowania hasła
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Rate limit: max 5 requests per hour per IP
    const rateLimit = rateLimiter.check(
      `forgot-password:${clientIp}`,
      5, // max 5 requests
      3600000 // per hour
    );

    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Zbyt wiele prób resetowania hasła. Spróbuj ponownie za godzinę.',
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
        'Nieprawidłowy format JSON'
      );
    }

    // 3. Validate request data
    const { email } = body as { email?: string };

    if (!email || typeof email !== 'string') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Adres email jest wymagany'
      );
    }

    // 4. Sanitize and validate email format
    const sanitizedEmail = email.trim().toLowerCase();

    if (!validateEmail(sanitizedEmail)) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Nieprawidłowy format adresu email'
      );
    }

    // 5. Send password reset email
    const authService = new AuthService();
    const { error } = await authService.resetPasswordForEmail(sanitizedEmail);

    // 6. Always return success message (security: don't reveal if email exists)
    // Even if there's an error, we don't want to tell the user if the email exists
    // This prevents email enumeration attacks
    return successResponse(
      {
        message: 'Jeśli podany adres email istnieje w systemie, otrzymasz wiadomość z instrukcjami resetowania hasła.'
      },
      'Jeśli podany adres email istnieje w systemie, otrzymasz wiadomość z instrukcjami resetowania hasła.'
    );

  } catch (error) {
    console.error('Forgot password endpoint error:', error);
    // Still return success for security reasons
    return successResponse(
      {
        message: 'Jeśli podany adres email istnieje w systemie, otrzymasz wiadomość z instrukcjami resetowania hasła.'
      },
      'Jeśli podany adres email istnieje w systemie, otrzymasz wiadomość z instrukcjami resetowania hasła.'
    );
  }
};

