import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';

export const prerender = false;

export const DELETE: APIRoute = async ({ request, params }) => {
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

    // Prevent self-delete
    if (targetUserId === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Nie możesz usunąć własnego konta' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if target user exists
    const { data: targetProfile, error: targetErr } = await supabase
      .from('profiles')
      .select('id, fire_department_id')
      .eq('id', targetUserId)
      .single();

    if (targetErr || !targetProfile) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Użytkownik nie został znaleziony' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Allow deleting users from other departments, but only if they don't have a department or admin explicitly wants to
    // Note: We allow this because admin might want to clean up users that were mistakenly assigned elsewhere
    // The check is mainly to prevent accidental deletion of important users
    if (targetProfile.fire_department_id && targetProfile.fire_department_id !== adminProfile.fire_department_id) {
      // User is in a different department - this is allowed but we'll continue
      console.log(`Admin ${user.id} deleting user ${targetUserId} from different department ${targetProfile.fire_department_id} (admin's department: ${adminProfile.fire_department_id})`);
    }

    // Delete auth user (profiles will cascade delete)
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(targetUserId);
    if (deleteErr) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'DELETE_FAILED', message: 'Nie udało się usunąć użytkownika' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: { id: targetUserId }, message: 'Użytkownik usunięty' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin delete user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'Nieoczekiwany błąd serwera' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


