import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db/database.types';

/**
 * API endpoint do pobierania profilu użytkownika
 * 
 * Zwraca dane użytkownika i jego profil na podstawie tokenu autoryzacji
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
    
    // 4. Pobierz profil użytkownika
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
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
    
    // 5. Pobierz dane jednostki OSP
    const { data: fireDepartment, error: deptError } = await supabase
      .from('fire_departments')
      .select('name, city')
      .eq('id', profile.fire_department_id)
      .single();
    
    // 6. Formatuj odpowiedź
    const userData = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };
    
    const profileData = {
      id: profile.id,
      fire_department_id: profile.fire_department_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      fire_department: fireDepartment || null
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userData,
          profile: profileData
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Unexpected profile error:', error);
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

/**
 * API endpoint do aktualizacji profilu użytkownika
 * PATCH /api/auth/profile
 */
export const PATCH: APIRoute = async ({ request }) => {
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
    const { first_name, last_name } = body;
    
    // 5. Aktualizuj profil użytkownika
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: first_name || null,
        last_name: last_name || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('*')
      .single();
    
    if (updateError || !updatedProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Nie udało się zaktualizować profilu'
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
    
    // 6. Pobierz dane jednostki OSP
    const { data: fireDepartment, error: deptError } = await supabase
      .from('fire_departments')
      .select('name, city')
      .eq('id', updatedProfile.fire_department_id)
      .single();
    
    // 7. Formatuj odpowiedź
    const userData = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };
    
    const profileData = {
      id: updatedProfile.id,
      fire_department_id: updatedProfile.fire_department_id,
      first_name: updatedProfile.first_name,
      last_name: updatedProfile.last_name,
      role: updatedProfile.role,
      created_at: updatedProfile.created_at,
      updated_at: updatedProfile.updated_at,
      fire_department: fireDepartment || null
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userData,
          profile: profileData
        },
        message: 'Profil został zaktualizowany pomyślnie'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Unexpected profile update error:', error);
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
