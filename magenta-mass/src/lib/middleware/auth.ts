// import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';

/**
 * Middleware do sprawdzania autentykacji użytkownika
 * 
 * @param request - Request object z Astro
 * @returns Obiekt z danymi użytkownika lub błędem
 */
export async function authenticateUser(request: Request): Promise<{
  user: { id: string; email: string } | null;
  error: string | null;
}> {
  try {
    // 1. Pobierz token z nagłówka Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        error: 'Missing or invalid authorization header'
      };
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // 2. Utwórz klienta Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        user: null,
        error: 'Supabase configuration missing'
      };
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // 3. Sprawdź token przez Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        user: null,
        error: 'Invalid or expired token'
      };
    }
    
    return {
      user: {
        id: user.id,
        email: user.email!
      },
      error: null
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: 'Authentication failed'
    };
  }
}

/**
 * Helper do tworzenia odpowiedzi błędu autentykacji
 */
export function authErrorResponse(message: string = 'Authentication required'): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message
      }
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Helper do sprawdzania autentykacji w API routes
 * 
 * @param request - Request object
 * @returns Promise z danymi użytkownika lub Response z błędem
 */
export async function requireAuth(request: Request): Promise<{
  user: { id: string; email: string };
  response?: never;
} | {
  user?: never;
  response: Response;
}> {
  const { user, error } = await authenticateUser(request);
  
  if (error || !user) {
    return {
      response: authErrorResponse(error || 'Authentication required')
    };
  }
  
  return { user };
}
