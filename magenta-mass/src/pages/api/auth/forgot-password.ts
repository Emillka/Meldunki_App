import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';

/**
 * POST /api/auth/forgot-password
 * Wysyła link resetowania hasła na podany email
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const rateLimit = rateLimiter.check(
      `forgot-password:${clientIp}`,
      3, // max 3 requests
      3600000 // per hour
    );
    
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many password reset requests. Please try again later.',
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
    
    // 3. Validate email
    const { email } = body as { email?: string };
    
    if (!email || typeof email !== 'string') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Email jest wymagany'
      );
    }
    
    const sanitizedEmail = email.trim().toLowerCase();
    
    if (!sanitizedEmail.includes('@') || sanitizedEmail.length < 5) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Nieprawidłowy format emaila'
      );
    }
    
    // 4. Request password reset
    console.log('=== Forgot Password API Call ===');
    console.log('Email:', sanitizedEmail);
    console.log('Client IP:', clientIp);
    
    const authService = new AuthService();
    const { data, error } = await authService.requestPasswordReset(sanitizedEmail);
    
    if (error) {
      // Log szczegółowy błąd dla debugowania
      console.error('❌ Password reset error in API endpoint:', {
        message: error.message,
        email: sanitizedEmail,
        error: error,
        errorName: error.name,
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // Sprawdź czy to błąd konfiguracji SMTP
      if (error.message?.includes('email') || error.message?.includes('SMTP') || error.message?.includes('mail')) {
        console.error('⚠️ SMTP configuration issue detected. Check Supabase email settings.');
      }
      
      // Sprawdź czy to problem z rate limiting
      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        console.error('⚠️ Rate limit issue - user may have requested too many resets');
      }
      
      // Dla bezpieczeństwa zawsze zwracamy sukces (nie informujemy czy email istnieje)
      // Ale logujemy błąd dla debugowania
      console.log('⚠️ Returning success message despite error (security best practice)');
      return successResponse(
        {
          message: 'Jeśli konto z tym adresem email istnieje, link resetowania hasła został wysłany.'
        },
        'Jeśli konto z tym adresem email istnieje, link resetowania hasła został wysłany.'
      );
    }
    
    // 5. Success response
    console.log('✅ Password reset email sent successfully for:', sanitizedEmail);
    console.log('=== End Forgot Password API Call ===');
    return successResponse(
      data,
      'Link resetowania hasła został wysłany na podany adres email.'
    );
    
  } catch (error) {
    console.error('Forgot password endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'Wystąpił błąd podczas przetwarzania żądania resetowania hasła'
    );
  }
};
