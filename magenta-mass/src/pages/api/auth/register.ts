import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { validateRegisterRequest, sanitizeString } from '@/lib/validation/auth.validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { rateLimiter } from '@/lib/utils/rate-limiter';
import { supabase } from '@/lib/db/supabase';
import { createClient } from '@supabase/supabase-js';
import type { RegisterRequestDTO, RegisterUserCommand } from '@/lib/types';

/**
 * POST /api/auth/register
 * Rejestruje nowego użytkownika w systemie
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Rate limiting check
    const clientIp = 
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    const rateLimit = rateLimiter.check(
      `register:${clientIp}`,
      3, // max 3 requests
      3600000 // per hour
    );
    
    if (!rateLimit.allowed) {
      return errorResponse(
        429,
        'TOO_MANY_REQUESTS',
        'Too many registration attempts. Please try again later.',
        { retry_after: rateLimit.retryAfter }
      );
    }
    
    // 2. Parse request body
    let body: unknown;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
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
    
    // 4. Sanitize string inputs
    const sanitizedDto: RegisterRequestDTO = {
      email: dto.email.trim().toLowerCase(),
      password: dto.password, // NEVER log or modify password
      fire_department_name: dto.fire_department_name.trim(),
      first_name: sanitizeString(dto.first_name) || undefined,
      last_name: sanitizeString(dto.last_name) || undefined,
      role: dto.role || 'member'
    };
    
    // 5. Check if email already exists using service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    
    if (serviceRoleKey && supabaseUrl) {
      try {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
        const { data: { users }, error: authCheckError } = await adminSupabase.auth.admin.listUsers();
        
        // Check if email exists in the list
        const emailExists = users?.some(user => user.email === sanitizedDto.email);
        
        if (emailExists && !authCheckError) {
          return errorResponse(
            409,
            'EMAIL_ALREADY_EXISTS',
            'Konto z tym adresem email już istnieje. Jeśli zapomniałeś hasła, użyj opcji resetowania hasła.'
          );
        }
      } catch (err) {
        // If admin API doesn't work, we'll rely on the signUp error handling
        console.log('Could not check email via admin API, will rely on signUp error handling:', err);
      }
    }
    
    // 6. Find fire department by name
    const { data: fireDept, error: fireDeptError } = await supabase
      .from('fire_departments')
      .select('id')
      .ilike('name', sanitizedDto.fire_department_name)
      .single();
    
    if (fireDeptError || !fireDept) {
      return errorResponse(
        400,
        'FIRE_DEPARTMENT_NOT_FOUND',
        `Jednostka OSP "${sanitizedDto.fire_department_name}" nie została znaleziona`
      );
    }
    
    // 7. Create command model
    const command: RegisterUserCommand = {
      email: sanitizedDto.email,
      password: sanitizedDto.password,
      profile: {
        fire_department_id: (fireDept as unknown as { id: string }).id,
        role: sanitizedDto.role || 'member',
        first_name: sanitizedDto.first_name,
        last_name: sanitizedDto.last_name,
        is_verified: false // User needs to be verified by admin after registration
      }
    };
    
    // 8. Execute registration
    const authService = new AuthService();
    const { data, error } = await authService.registerUser(command);
    
    if (error) {
      // Handle specific error types
      if (error.message === 'FIRE_DEPARTMENT_NOT_FOUND') {
        return errorResponse(
          400,
          'FIRE_DEPARTMENT_NOT_FOUND',
          'Podana jednostka OSP nie istnieje'
        );
      }
      
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return errorResponse(
          409,
          'EMAIL_ALREADY_EXISTS',
          'Konto z tym adresem email już istnieje. Jeśli zapomniałeś hasła, użyj opcji resetowania hasła.'
        );
      }
      
      // Generic error
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Registration failed. Please try again.',
        { original_error: error.message }
      );
    }
    
    // 9. Check if email confirmation is required
    if (data && !data.session) {
      return successResponse(
        {
          user: data.user,
          message: 'Rejestracja zakończona sukcesem! Sprawdź swoją skrzynkę pocztową i kliknij link aktywacyjny, aby potwierdzić konto. Po potwierdzeniu będziesz mógł się zalogować.'
        },
        'Rejestracja zakończona sukcesem! Sprawdź swoją skrzynkę pocztową i kliknij link aktywacyjny, aby potwierdzić konto.'
      );
    }
    
    // 10. Success response with session
    return successResponse(
      data,
      'User registered successfully and verified as fire department member'
    );
    
  } catch (error) {
    console.error('Registration endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred during registration'
    );
  }
};
