import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse } from '@/lib/utils/response';
import type { MeldunekDTO } from '@/lib/types';
import type { Database } from '@/lib/db/database.types';

function categorizeIncident(description: string): 'fire' | 'rescue' | 'medical' | 'other' {
  const text = description.toLowerCase();
  if (/(pożar|pozar|pali|dym)/.test(text)) return 'fire';
  if (/(wypadek|kolizja|zderzenie|ratownic|uwolnieni|drzewo|zalani|podtopieni)/.test(text)) return 'rescue';
  if (/(medycz|reanimac|rko|utrata przytomno|zasłabni)/.test(text)) return 'medical';
  return 'other';
}

function generateSummary(name: string, description: string, location?: string | null): string {
  const base = `${name}. ${location ? `${location}. ` : ''}${description}`.trim();
  return base.length > 200 ? base.slice(0, 197) + '…' : base;
}

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

    // 5. Get user's fire department ID and verification status
    console.log('Meldunki GET endpoint - looking for profile for user:', user.id);
    console.log('Meldunki GET endpoint - service role key available:', !!serviceRoleKey);
    console.log('Meldunki GET endpoint - includeDepartment:', includeDepartment);
    
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fire_department_id, is_verified')
      .eq('id', user.id)
      .single();

    // Fallback: if production DB doesn't have is_verified column yet
    if (profileError && typeof profileError.message === 'string' && profileError.message.toLowerCase().includes('is_verified')) {
      const fallback = await supabase
        .from('profiles')
        .select('fire_department_id')
        .eq('id', user.id)
        .single();
      profile = fallback.data as any;
      profileError = fallback.error as any;
      if (profile && (profile as any).fire_department_id !== undefined) {
        (profile as any).is_verified = false;
      }
    }

    console.log('Meldunki GET endpoint - profile query result:', { 
      profile: profile?.fire_department_id, 
      is_verified: (profile as any)?.is_verified,
      error: profileError?.message 
    });

    // Prepare safe profile object for further logic
    const effectiveProfile: { fire_department_id: string | null; is_verified: boolean } =
      profile && !profileError
        ? (profile as { fire_department_id: string | null; is_verified: boolean })
        : { fire_department_id: null, is_verified: false };

    // 6. Build query - show department meldunki only if user is verified AND department=true
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

    // Only show department meldunki if user is verified AND explicitly requested
    if (includeDepartment && effectiveProfile.fire_department_id && effectiveProfile.is_verified) {
      // Show all meldunki from user's fire department (verified member)
      query = query.eq('fire_department_id', effectiveProfile.fire_department_id);
    } else {
      // Show only user's own meldunki (default behavior or unverified user)
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

    let fireDepartmentId: string | null = null;
    if (profileError || !profile) {
      console.warn('POST /api/meldunki: profile not found; proceeding with fire_department_id = null for user', user.id, 'Error:', profileError?.message);
    } else {
      fireDepartmentId = (profile as any).fire_department_id ?? null;
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

    // 6. Rule-based business logic: category + summary
    const computedCategory = categorizeIncident(`${incident_name} ${description}`);
    const computedSummary = generateSummary(incident_name, description, location_address);

    // 7. Create incident in database (omit fire_department_id if null to satisfy RLS)
    const insertData: any = {
      user_id: user.id,
      incident_name: incident_name.trim(),
      description: description.trim(),
      incident_date: incident_date,
      location_address: location_address?.trim() || null,
      forces_and_resources: forces_and_resources?.trim() || null,
      commander: commander?.trim() || null,
      driver: driver?.trim() || null,
      start_time: new Date().toISOString(),
      end_time: null,
      category: computedCategory,
      summary: computedSummary
    };
    if (fireDepartmentId) {
      insertData.fire_department_id = fireDepartmentId;
    }

    const { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create incident:', insertError);
      console.error('User ID:', user.id);
      console.error('Fire Department ID:', fireDepartmentId);
      console.error('Data being inserted:', insertData);
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
