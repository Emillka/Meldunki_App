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

    // Log admin's fire_department_id for debugging
    console.log('Admin fire_department_id:', adminProfile.fire_department_id);

    // Check if admin has a fire_department_id assigned
    if (!adminProfile.fire_department_id) {
      console.warn('Admin does not have fire_department_id assigned');
      return new Response(JSON.stringify({ 
        success: false, 
        error: { 
          code: 'NO_DEPARTMENT', 
          message: 'Administrator nie ma przypisanej jednostki OSP. Skontaktuj się z administratorem systemu.' 
        } 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // fetch department users from profiles with fire department info
    // First get users from admin's department (critical - must succeed)
    const { data: deptProfiles, error: deptProfilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, created_at, fire_department_id, fire_departments (name)')
      .eq('fire_department_id', adminProfile.fire_department_id)
      .order('created_at', { ascending: false });

    if (deptProfilesError) {
      console.error('Error fetching department users:', deptProfilesError);
      return new Response(JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch department users', details: deptProfilesError.message } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Get other users (non-critical - can fail gracefully)
    // Use separate queries for null and not equal cases for better compatibility
    let otherProfiles: any[] = [];
    try {
      // Get users without department
      const { data: nullUsers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, created_at, fire_department_id, fire_departments (name)')
        .is('fire_department_id', null)
        .order('created_at', { ascending: false })
        .limit(25);
      
      // Get users from other departments
      const { data: otherDeptUsers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, created_at, fire_department_id, fire_departments (name)')
        .neq('fire_department_id', adminProfile.fire_department_id)
        .order('created_at', { ascending: false })
        .limit(25);
      
      otherProfiles = [...(nullUsers || []), ...(otherDeptUsers || [])];
    } catch (otherError) {
      console.warn('Error fetching other users (non-critical):', otherError);
      // Continue without other users - not critical
    }

    // Combine profiles
    const profiles = [...(deptProfiles || []), ...otherProfiles];

    console.log(`Found ${deptProfiles?.length || 0} users in admin's department, ${otherProfiles?.length || 0} users from other departments or without department`);

    const ids = new Set((profiles || []).map(p => p.id));
    const adminDeptIds = new Set((deptProfiles || []).map(p => p.id));
    const result = (profiles || []).map(p => ({ 
      id: p.id, 
      first_name: p.first_name, 
      last_name: p.last_name, 
      role: p.role, 
      created_at: p.created_at, 
      fire_department_name: (p.fire_departments as any)?.name || null,
      fire_department_id: p.fire_department_id,
      is_in_admin_department: adminDeptIds.has(p.id),
      email: null as string | null 
    }));

    // enrich with email via admin API if possible
    // Fetch emails for all users (not just department users)
    // Use timeout to prevent hanging requests
    if (serviceRoleKey && profiles && profiles.length > 0 && profiles.length < 200) {
      try {
        const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey);
        const allUserIds = new Set((profiles || []).map(p => p.id));
        
        // Fetch all users in batches to get all emails
        // Start with a reasonable page size
        const perPage = 50;
        let allUsers: any[] = [];
        let page = 1;
        let hasMore = true;
        
        // Fetch users with timeout protection
        const fetchEmails = async () => {
          while (hasMore && page <= 10) { // Limit to 10 pages max (500 users) to prevent infinite loops
            const emailFetchPromise = adminClient.auth.admin.listUsers({
              page: page,
              perPage: perPage
            });
            
            // Add timeout wrapper for each page
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Email fetch timeout')), 8000) // 8 second timeout per page
            );
            
            const { data: usersPage, error } = await Promise.race([emailFetchPromise, timeoutPromise]) as any;
            
            if (error || !usersPage) {
              console.warn('Error fetching user emails page', page, error);
              break;
            }
            
            if (usersPage.users && usersPage.users.length > 0) {
              allUsers = [...allUsers, ...usersPage.users];
              // Check if there are more pages
              hasMore = usersPage.users.length === perPage;
              page++;
            } else {
              hasMore = false;
            }
            
            // If we found all our users, we can stop early
            const foundAll = [...allUserIds].every(id => allUsers.some(u => u.id === id));
            if (foundAll) {
              hasMore = false;
            }
          }
        };
        
        await fetchEmails();
        
        const emailById = new Map<string, string>();
        for (const au of allUsers) {
          if (allUserIds.has(au.id) && au.email) {
            emailById.set(au.id, au.email);
          }
        }
        
        // Set emails for all users in result
        for (const row of result) {
          row.email = emailById.get(row.id) || null;
        }
      } catch (e) {
        console.warn('Could not fetch emails (non-critical, will skip):', e instanceof Error ? e.message : e);
        // ignore, emails will be null - this is not critical for functionality
      }
    }

    return new Response(JSON.stringify({ success: true, data: result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'Unexpected server error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};


