import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/db/database.types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * API endpoint do zmiany roli użytkownika
 * PATCH /api/admin/users/{id}/role
 * Dostępny tylko dla administratorów
 */
export const PATCH: APIRoute = async ({ request, params }) => {
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
    const userId = params.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'Brak ID użytkownika'
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
    
    // 4. Sprawdź czy użytkownik jest administratorem
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role, fire_department_id')
      .eq('id', user.id)
      .single();
    
    if (adminProfileError || !adminProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil użytkownika nie został znaleziony'
          }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    if (adminProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Brak uprawnień administratora'
          }
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 5. Pobierz dane z request body
    const body = await request.json();
    const { role } = body;
    
    if (!role || !['member', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Nieprawidłowa rola. Dozwolone wartości: member, admin'
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
    
    // 6. Sprawdź czy użytkownik do zmiany należy do tej samej jednostki
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('fire_department_id, role')
      .eq('id', userId)
      .single();
    
    if (targetProfileError || !targetProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Użytkownik nie został znaleziony'
          }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    if (targetProfile.fire_department_id !== adminProfile.fire_department_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Nie możesz zmieniać ról użytkowników z innych jednostek'
          }
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 7. Sprawdź czy administrator nie próbuje zmienić własnej roli
    if (userId === user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Nie możesz zmienić własnej roli'
          }
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 8. Aktualizuj rolę użytkownika
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();
    
    if (updateError || !updatedProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Nie udało się zaktualizować roli użytkownika'
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
        data: {
          id: updatedProfile.id,
          role: updatedProfile.role,
          updated_at: updatedProfile.updated_at
        },
        message: `Rola użytkownika została zmieniona na ${role === 'admin' ? 'Administrator' : 'Strażak administrator'}`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Unexpected role change error:', error);
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
