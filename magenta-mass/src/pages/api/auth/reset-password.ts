import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { validatePasswordStrength } from '@/lib/validation/auth.validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';
import type { Database } from '@/lib/db/database.types';

/**
 * POST /api/auth/reset-password
 * Ustawia nowe hasło użytkownika używając tokenu z resetu hasła
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Rate limit: max 10 requests per hour per IP
    const rateLimit = rateLimiter.check(
      `reset-password:${clientIp}`,
      10, // max 10 requests
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
    const { password, password_confirm, access_token, refresh_token } = body as {
      password?: string;
      password_confirm?: string;
      access_token?: string;
      refresh_token?: string;
    };

    if (!password || typeof password !== 'string') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Nowe hasło jest wymagane'
      );
    }

    if (!password_confirm || typeof password_confirm !== 'string') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Potwierdzenie hasła jest wymagane'
      );
    }

    if (password !== password_confirm) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Hasła nie są zgodne'
      );
    }

    // 4. Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        `Hasło nie spełnia wymagań: ${passwordCheck.errors.join(', ')}`
      );
    }

    // 5. Get tokens from body or URL
    // Supabase sends tokens in the redirect URL hash, but we can also accept them in body
    if (!access_token || !refresh_token) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Brak tokenu resetowania hasła. Użyj linku z emaila.'
      );
    }

    // 6. Create Supabase client
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Błąd konfiguracji serwera'
      );
    }

    // 7. Create client with the session tokens
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Set the session using the tokens from the reset link
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (sessionError || !sessionData.session) {
      console.error('Session error:', sessionError);
      return errorResponse(
        400,
        'INVALID_TOKEN',
        'Token resetowania hasła jest nieprawidłowy lub wygasł. Poproś o nowy link resetowania hasła.'
      );
    }

    // 8. Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        updateError.message || 'Nie udało się ustawić nowego hasła. Spróbuj ponownie.'
      );
    }

    // 9. Success response
    return successResponse(
      {
        message: 'Hasło zostało pomyślnie zmienione.'
      },
      'Hasło zostało pomyślnie zmienione.'
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

