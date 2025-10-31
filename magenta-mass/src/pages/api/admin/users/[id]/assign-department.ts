import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    const targetUserId = params.id;
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'MISSING_USER_ID', message: 'Brak ID użytkownika' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'CONFIGURATION_ERROR', message: 'Błąd konfiguracji serwera' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

    // Authenticate caller
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin and get department
    const { data: adminProfile, error: adminErr } = await supabase
      .from('profiles')
      .select('id, role, fire_department_id')
      .eq('id', user.id)
      .single();

    if (adminErr || !adminProfile || adminProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Brak uprawnień administratora' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!adminProfile.fire_department_id) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'NO_DEPARTMENT', message: 'Administrator nie ma przypisanej jednostki OSP' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-assignment
    if (targetUserId === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Nie możesz przypisać samego siebie' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if target user exists
    const { data: targetProfile, error: targetErr } = await supabase
      .from('profiles')
      .select('id, fire_department_id, first_name, last_name')
      .eq('id', targetUserId)
      .single();

    if (targetErr || !targetProfile) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Użytkownik nie został znaleziony' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if already assigned to this department
    if (targetProfile.fire_department_id === adminProfile.fire_department_id) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'ALREADY_ASSIGNED', message: 'Użytkownik już należy do tej jednostki OSP' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update fire_department_id
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        fire_department_id: adminProfile.fire_department_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select('*')
      .single();

    if (updateError || !updatedProfile) {
      console.error('Error updating fire_department_id:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UPDATE_FAILED', message: 'Nie udało się przypisać użytkownika do jednostki OSP' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          id: targetUserId,
          fire_department_id: updatedProfile.fire_department_id 
        }, 
        message: 'Użytkownik został przypisany do jednostki OSP' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin assign department error:', error);
    return new Response(
      JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'Nieoczekiwany błąd serwera' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

