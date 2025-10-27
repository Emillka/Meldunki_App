import type { APIRoute } from 'astro';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse } from '@/lib/utils/response';
import type { MeldunekDTO } from '@/lib/types';

/**
 * GET /api/meldunki
 * Pobiera meldunki dla jednostki OSP zalogowanego użytkownika
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

    // 2. Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or expired token'
      );
    }

    // 3. Get user's fire department ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fire_department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return errorResponse(
        404,
        'PROFILE_NOT_FOUND',
        'User profile not found'
      );
    }

    // 4. Get incidents for the user's fire department only
    const { data: incidents, error: incidentsError } = await supabase
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
      `)
      .eq('fire_department_id', profile.fire_department_id!)
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

    // 2. Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or expired token'
      );
    }

    // 3. Get user's fire department ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fire_department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
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
