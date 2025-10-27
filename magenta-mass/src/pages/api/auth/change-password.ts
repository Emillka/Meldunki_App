import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db/database.types';

/**
 * API endpoint do zmiany hasła użytkownika
 * POST /api/auth/change-password
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
    
    // 3. Sprawdź token i pobierz użytkownika
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Nieprawidłowy lub wygasły token'
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
    
    // 4. Pobierz dane z request body
    const body = await request.json();
    const { current_password, new_password } = body;
    
    // 5. Walidacja hasła
    if (!current_password || !new_password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Obecne hasło i nowe hasło są wymagane'
          }
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Nowe hasło musi mieć co najmniej 8 znaków'
          }
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 6. Sprawdź obecne hasło przez próbę logowania
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current_password
    });
    
    if (signInError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Obecne hasło jest nieprawidłowe'
          }
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 7. Zaktualizuj hasło
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password
    });
    
    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'PASSWORD_UPDATE_FAILED',
            message: 'Nie udało się zaktualizować hasła'
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
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hasło zostało zmienione pomyślnie'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Unexpected password change error:', error);
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
