import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db/database.types';

/**
 * API endpoint do pobierania użytkowników jednostki OSP
 * GET /api/admin/users
 * Dostępny tylko dla administratorów
 */
export const GET: APIRoute = async ({ request }) => {
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
    
    // 4. Sprawdź czy użytkownik jest administratorem
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, fire_department_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
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
    
    if (profile.role !== 'admin') {
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
    
    // 5. Pobierz wszystkich użytkowników z tej samej jednostki OSP
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        user:auth.users!inner(
          id,
          email,
          created_at
        )
      `)
      .eq('fire_department_id', profile.fire_department_id)
      .order('created_at', { ascending: false });
    
    if (usersError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Błąd podczas pobierania użytkowników'
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
    
    // 6. Formatuj odpowiedź
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    
    return new Response(
      JSON.stringify({
        success: true,
        data: formattedUsers,
        count: formattedUsers.length
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Unexpected admin users error:', error);
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
