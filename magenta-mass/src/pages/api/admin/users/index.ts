import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const token = authHeader.substring(7);

    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey || anonKey);

    // auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // require admin
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, fire_department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Brak uprawnień administratora' } }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // fetch department users from profiles
    const { data: profiles, error: deptProfilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, created_at')
      .eq('fire_department_id', adminProfile.fire_department_id)
      .order('created_at', { ascending: false });

    if (deptProfilesError) {
      return new Response(JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch department users' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const ids = new Set((profiles || []).map(p => p.id));
    const result = (profiles || []).map(p => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, role: p.role, created_at: p.created_at, email: null as string | null }));

    // enrich with email via admin API if possible
    if (serviceRoleKey) {
      try {
        const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey);
        const { data: usersPage } = await adminClient.auth.admin.listUsers();
        const emailById = new Map<string, string>();
        for (const au of usersPage.users || []) {
          if (ids.has(au.id) && au.email) emailById.set(au.id, au.email);
        }
        for (const row of result) {
          row.email = emailById.get(row.id) || null;
        }
      } catch (e) {
        // ignore, emails will be null
      }
    }

    return new Response(JSON.stringify({ success: true, data: result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'Unexpected server error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};


