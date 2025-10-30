import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse } from '@/lib/utils/response';
import type { MeldunekDTO } from '@/lib/types';
import type { Database } from '@/lib/db/database.types';

/**
 * GET /api/meldunki
 * Pobiera meldunki dla zalogowanego użytkownika
 * Query params:
 *   - department: if true, returns all meldunki from user's fire department (default: false - only user's meldunki)
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Parse query parameters
    const url = new URL(request.url);
    const includeDepartment = url.searchParams.get('department') === 'true';

    // 3. Create Supabase client with service role key if available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient<Database>(
      supabaseUrl,
      serviceRoleKey || supabaseAnonKey
    );

    // 4. Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or expired token'
      );
    }

    // 5. Get user's fire department ID
    console.log('Meldunki GET endpoint - looking for profile for user:', user.id);
    console.log('Meldunki GET endpoint - service role key available:', !!serviceRoleKey);
    console.log('Meldunki GET endpoint - includeDepartment:', includeDepartment);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fire_department_id')
      .eq('id', user.id)
      .single();

    console.log('Meldunki GET endpoint - profile query result:', { 
      profile: profile?.fire_department_id, 
      error: profileError?.message 
    });

    if (profileError || !profile) {
      console.error('Profile not found for user:', user.id, 'Error:', profileError);
      return errorResponse(
        404,
        'PROFILE_NOT_FOUND',
        'User profile not found'
      );
    }

    // 6. Build query - by default show only user's meldunki, unless department=true
    let query = supabase
      .from('incidents')
      .select(`
        id,
        user_id,
        fire_department_id,
        incident_name,
        description,
        location_address,
        category,
        incident_date,
        start_time,
        end_time,
        forces_and_resources,
        summary,
        commander,
        driver,
        created_at,
        updated_at
      `);

    if (includeDepartment && profile.fire_department_id) {
      // Show all meldunki from user's fire department
      query = query.eq('fire_department_id', profile.fire_department_id);
    } else {
      // Show only user's own meldunki (default behavior)
      query = query.eq('user_id', user.id);
    }

    const { data: incidents, error: incidentsError } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (incidentsError) {
      console.error('Failed to fetch incidents:', incidentsError);
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Failed to fetch meldunki'
      );
    }

    // 5. Transform incidents to MeldunekDTO format
    const meldunkiDTO = incidents.map(incident => ({
      id: incident.id,
      user_id: incident.user_id,
      fire_department_id: incident.fire_department_id,
      title: incident.incident_name,
      description: incident.description,
      location: incident.location_address || '',
      incident_type: incident.category as 'fire' | 'rescue' | 'medical' | 'other',
      severity: 'medium' as const, // Default since incidents table doesn't have severity
      status: 'submitted' as const,
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      incident_date: incident.incident_date,
      duration_minutes: incident.end_time && incident.start_time ? 
        Math.round((new Date(incident.end_time).getTime() - new Date(incident.start_time).getTime()) / 60000) : 
        undefined,
      participants_count: undefined, // Not available in incidents table
      equipment_used: incident.forces_and_resources ? incident.forces_and_resources.split(', ') : undefined,
      weather_conditions: undefined, // Not available in incidents table
      additional_notes: incident.summary || undefined,
      commander: incident.commander || undefined,
      driver: incident.driver || undefined
    }));

    return successResponse(
      meldunkiDTO,
      'Meldunki fetched successfully'
    );

  } catch (error) {
    console.error('Meldunki endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred while fetching meldunki'
    );
  }
};

/**
 * POST /api/meldunki
 * Tworzy nowy meldunek dla zalogowanego użytkownika
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Create Supabase client with service role key if available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient<Database>(
      supabaseUrl,
      serviceRoleKey || supabaseAnonKey
    );

    // 3. Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or expired token'
      );
    }

    // 3. Get user's fire department ID
    console.log('Meldunki POST endpoint - looking for profile for user:', user.id);
    console.log('Meldunki POST endpoint - service role key available:', !!serviceRoleKey);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fire_department_id')
      .eq('id', user.id)
      .single();

    console.log('Meldunki POST endpoint - profile query result:', { 
      profile: profile?.fire_department_id, 
      error: profileError?.message 
    });

    if (profileError || !profile) {
      console.error('Profile not found for user:', user.id, 'Error:', profileError);
      return errorResponse(
        404,
        'PROFILE_NOT_FOUND',
        'User profile not found'
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const {
      incident_name,
      description,
      incident_date,
      location_address,
      forces_and_resources,
      commander,
      driver
    } = body;

    // 5. Validate required fields
    if (!incident_name || !description || !incident_date) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Missing required fields: incident_name, description, incident_date'
      );
    }

    // 6. Create incident in database
    const { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert({
        user_id: user.id,
        fire_department_id: profile.fire_department_id!,
        incident_name: incident_name.trim(),
        description: description.trim(),
        incident_date: incident_date,
        location_address: location_address?.trim() || null,
        forces_and_resources: forces_and_resources?.trim() || null,
        commander: commander?.trim() || null,
        driver: driver?.trim() || null,
        start_time: new Date().toISOString(),
        end_time: null,
        category: 'other', // Default category
        summary: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create incident:', insertError);
      console.error('User ID:', user.id);
      console.error('Fire Department ID:', profile.fire_department_id);
      console.error('Data being inserted:', {
        user_id: user.id,
        fire_department_id: profile.fire_department_id!,
        incident_name: incident_name.trim(),
        description: description.trim(),
        incident_date: incident_date,
        location_address: location_address?.trim() || null,
        forces_and_resources: forces_and_resources?.trim() || null,
        commander: commander?.trim() || null,
        driver: driver?.trim() || null,
        start_time: new Date().toISOString(),
        end_time: null,
        category: 'other',
        summary: null
      });
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Failed to create meldunek: ' + insertError.message
      );
    }

    // 7. Transform to MeldunekDTO format
    const meldunekDTO: MeldunekDTO = {
      id: incident.id,
      user_id: incident.user_id,
      fire_department_id: incident.fire_department_id,
      title: incident.incident_name,
      description: incident.description,
      location: incident.location_address || '',
      incident_type: incident.category as 'fire' | 'rescue' | 'medical' | 'other',
      severity: 'medium',
      status: 'submitted',
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      incident_date: incident.incident_date,
      duration_minutes: undefined,
      participants_count: undefined,
      equipment_used: incident.forces_and_resources ? incident.forces_and_resources.split(', ') : undefined,
      weather_conditions: undefined,
      additional_notes: incident.summary || undefined
    };

    return successResponse(
      meldunekDTO,
      'Meldunek został pomyślnie utworzony'
    );

  } catch (error) {
    console.error('Create meldunek endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred while creating meldunek'
    );
  }
};

/**
 * PUT /api/meldunki?id={id}
 * Aktualizuje istniejący meldunek należący do zalogowanego użytkownika
 */
export const PUT: APIRoute = async ({ request, url }) => {
  try {
    // 1. Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.substring(7);

    // 2. Validate query param id
    const id = url.searchParams.get('id');
    if (!id) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Missing required query param: id');
    }

    // 3. Supabase client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey || supabaseAnonKey);

    // 4. Auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    // 5. Fetch incident and check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('incidents')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return errorResponse(404, 'NOT_FOUND', 'Meldunek not found');
    }

    if (existing.user_id !== user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You are not allowed to update this meldunek');
    }

    // 6. Parse body and build update payload (partial update)
    const body = await request.json().catch(() => ({}));
    const updatePayload: Record<string, unknown> = {};

    if (typeof body.incident_name === 'string') updatePayload.incident_name = body.incident_name.trim();
    if (typeof body.description === 'string') updatePayload.description = body.description.trim();
    if (typeof body.location_address === 'string') updatePayload.location_address = body.location_address.trim();
    if (typeof body.forces_and_resources === 'string') updatePayload.forces_and_resources = body.forces_and_resources.trim();
    if (typeof body.commander === 'string') updatePayload.commander = body.commander.trim();
    if (typeof body.driver === 'string') updatePayload.driver = body.driver.trim();
    if (typeof body.incident_date === 'string') updatePayload.incident_date = body.incident_date;
    if (typeof body.category === 'string') updatePayload.category = body.category;

    if (Object.keys(updatePayload).length === 0) {
      return errorResponse(400, 'VALIDATION_ERROR', 'No valid fields to update');
    }

    // 7. Perform update
    const { data: updated, error: updateError } = await supabase
      .from('incidents')
      .update({ ...updatePayload })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return errorResponse(500, 'SERVER_ERROR', 'Failed to update meldunek');
    }

    const meldunekDTO: MeldunekDTO = {
      id: updated.id,
      user_id: updated.user_id,
      fire_department_id: updated.fire_department_id,
      title: updated.incident_name,
      description: updated.description,
      location: updated.location_address || '',
      incident_type: updated.category as 'fire' | 'rescue' | 'medical' | 'other',
      severity: 'medium',
      status: 'submitted',
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      incident_date: updated.incident_date,
      duration_minutes: updated.end_time && updated.start_time ?
        Math.round((new Date(updated.end_time).getTime() - new Date(updated.start_time).getTime()) / 60000) :
        undefined,
      participants_count: undefined,
      equipment_used: updated.forces_and_resources ? updated.forces_and_resources.split(', ') : undefined,
      weather_conditions: undefined,
      additional_notes: updated.summary || undefined
    };

    return successResponse(meldunekDTO, 'Meldunek zaktualizowany');
  } catch (error) {
    console.error('Update meldunek endpoint error:', error);
    return errorResponse(500, 'SERVER_ERROR', 'An unexpected error occurred while updating meldunek');
  }
};

/**
 * DELETE /api/meldunki?id={id}
 * Usuwa meldunek należący do zalogowanego użytkownika
 */
export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    // 1. Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }
    const token = authHeader.substring(7);

    // 2. Validate id
    const id = url.searchParams.get('id');
    if (!id) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Missing required query param: id');
    }

    // 3. Supabase client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey || supabaseAnonKey);

    // 4. Auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    // 5. Fetch and check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('incidents')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return errorResponse(404, 'NOT_FOUND', 'Meldunek not found');
    }

    if (existing.user_id !== user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You are not allowed to delete this meldunek');
    }

    // 6. Delete
    const { error: deleteError } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return errorResponse(500, 'SERVER_ERROR', 'Failed to delete meldunek');
    }

    return successResponse({ id }, 'Meldunek usunięty');
  } catch (error) {
    console.error('Delete meldunek endpoint error:', error);
    return errorResponse(500, 'SERVER_ERROR', 'An unexpected error occurred while deleting meldunek');
  }
};
