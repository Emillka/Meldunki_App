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

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, fire_department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Brak uprawnień administratora' } }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const deptId = profile.fire_department_id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('fire_department_id', deptId);

    // total incidents
    const { count: totalIncidents } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('fire_department_id', deptId);

    // active users (users with incidents in last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: activeUserRows } = await supabase
      .from('incidents')
      .select('user_id')
      .eq('fire_department_id', deptId)
      .gte('created_at', since.toISOString());
    const activeUsers = new Set((activeUserRows || []).map(r => r.user_id)).size;

    // incidents this month
    const { count: incidentsThisMonth } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('fire_department_id', deptId)
      .gte('created_at', startOfMonth.toISOString());

    // most active user (by incidents count)
    const { data: counts } = await supabase
      .from('incidents')
      .select('user_id')
      .eq('fire_department_id', deptId);
    let mostActiveUser: string | null = null;
    if (counts && counts.length > 0) {
      const byUser = new Map<string, number>();
      for (const row of counts) byUser.set(row.user_id, (byUser.get(row.user_id) || 0) + 1);
      const top = [...byUser.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const { data: topProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', top[0])
          .single();
        if (topProfile) mostActiveUser = `${topProfile.first_name || ''} ${topProfile.last_name || ''}`.trim() || null;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        total_users: totalUsers || 0,
        total_incidents: totalIncidents || 0,
        active_users: activeUsers || 0,
        incidents_this_month: incidentsThisMonth || 0,
        most_active_user: mostActiveUser
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'Unexpected server error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};


