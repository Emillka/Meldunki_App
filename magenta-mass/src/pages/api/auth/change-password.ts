import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { validatePasswordStrength } from '@/lib/validation/auth.validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';

/**
 * POST /api/auth/change-password
 * Zmienia hasło użytkownika (wymagane aktualne hasło)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const rateLimit = rateLimiter.check(
      `change-password:${clientIp}`,
      5, // max 5 requests
      3600000 // per hour
    );
    
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many password change attempts. Please try again later.',
        { retry_after: rateLimit.retryAfter }
      );
    }
    
    // 2. Get authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Brak tokena autoryzacji. Zaloguj się ponownie.'
      );
    }

    const accessToken = authHeader.substring(7);

    // 3. Parse request body
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
    
    // 4. Validate request data
    const { current_password, new_password } = body as { 
      current_password?: string; 
      new_password?: string;
    };
    
    if (!current_password || typeof current_password !== 'string') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Aktualne hasło jest wymagane'
      );
    }
    
    if (!new_password || typeof new_password !== 'string') {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Nowe hasło jest wymagane'
      );
    }
    
    // 5. Validate password strength
    const passwordCheck = validatePasswordStrength(new_password);
    if (!passwordCheck.valid) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        `Nowe hasło nie spełnia wymagań: ${passwordCheck.errors.join(', ')}`
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

    // 7. Get user from token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: getUserError } = await supabase.auth.getUser(accessToken);
    
    if (getUserError || !userData.user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Nieprawidłowy token. Zaloguj się ponownie.'
      );
    }

    // 8. Verify current password by attempting to sign in
    // Create a temporary client to verify password without affecting current session
    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: verifyData, error: verifyError } = await tempSupabase.auth.signInWithPassword({
      email: userData.user.email!,
      password: current_password
    });

    if (verifyError || !verifyData.session) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Aktualne hasło jest nieprawidłowe'
      );
    }

    // 9. Update password using the verified session
    // Use the session from signInWithPassword to update password
    const { data: updateData, error: updateError } = await tempSupabase.auth.updateUser({
      password: new_password
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        updateError.message || 'Nie udało się zmienić hasła. Spróbuj ponownie.'
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
    console.error('Change password endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'Wystąpił błąd podczas zmiany hasła'
    );
  }
};

