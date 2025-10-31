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
    
    // 4. Get access token and refresh token from request
    // For password reset, we need both tokens to create a session
    const authHeader = request.headers.get('Authorization');
    const refreshToken = request.headers.get('X-Refresh-Token');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Brak tokena autoryzacji. Link resetowania hasła może być nieprawidłowy.'
      );
    }

    const accessToken = authHeader.substring(7);

    // 5. Create Supabase client
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Błąd konfiguracji serwera'
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 6. Set session from tokens
    if (refreshToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) {
        return errorResponse(
          401,
          'UNAUTHORIZED',
          'Nie można ustawić sesji. Link resetowania hasła może być nieprawidłowy lub wygasły.'
        );
      }
    } else {
      // If no refresh token, verify the access token is valid
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      
      if (authError || !user) {
        return errorResponse(
          401,
          'UNAUTHORIZED',
          'Token resetowania hasła jest nieprawidłowy lub wygasł. Poproś o nowy link.'
        );
      }

      // Create a client with the access token in headers
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        },
        auth: {
          persistSession: false
        }
      });

      // Try to update password with token in headers
      const { data, error } = await tempSupabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password reset error:', error);
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          error.message || 'Nie udało się zresetować hasła. Link może być nieprawidłowy lub wygasły.'
        );
      }

      return successResponse(
        { message: 'Hasło zostało pomyślnie zresetowane.' },
        'Hasło zostało pomyślnie zresetowane.'
      );
    }

    // 7. Update password with valid session
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
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
