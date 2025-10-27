import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db/database.types';

/**
 * API endpoint do wylogowania użytkownika
 * 
 * Usuwa sesję użytkownika z Supabase i zwraca potwierdzenie
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Pobierz token z nagłówka Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Brak tokenu autoryzacji'
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
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // 2. Utwórz klienta Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Błąd konfiguracji serwera'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // 3. Wyloguj użytkownika
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: 'Błąd podczas wylogowania'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 4. Zwróć sukces
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Wylogowanie udane'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Unexpected logout error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Nieoczekiwany błąd serwera'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
