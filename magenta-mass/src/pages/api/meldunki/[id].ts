import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/database.types';
import { successResponse, errorResponse } from '@/lib/utils/response';

export const prerender = false;

function categorizeIncident(description: string): 'fire' | 'rescue' | 'medical' | 'other' {
  const text = description.toLowerCase();
  if (/(pożar|pozar|pali|dym)/.test(text)) return 'fire';
  if (/(wypadek|kolizja|zderzenie|ratownic|uwolnieni|drzewo|zalani|podtopieni)/.test(text)) return 'rescue';
  if (/(medycz|reanimac|RKO|utrata przytomno|zasłabni)/.test(text)) return 'medical';
  return 'other';
}

function generateSummary(name: string, description: string, location?: string | null): string {
  const base = `${name}. ${location ? `${location}. ` : ''}${description}`.trim();
  return base.length > 200 ? base.slice(0, 197) + '…' : base;
}

async function getSupabase() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  return createClient<Database>(supabaseUrl, serviceRoleKey || anonKey);
}

async function getAuthUser(supabase: ReturnType<typeof createClient<Database>>, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return { user, error };
}

async function canMutateIncident(supabase: ReturnType<typeof createClient<Database>>, currentUserId: string, incidentId: string) {
  // Load incident
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('id, user_id, fire_department_id')
    .eq('id', incidentId)
    .single();

  if (incidentError || !incident) {
    return { allowed: false, status: 404 as const, message: 'Incident not found' };
  }

  if (incident.user_id === currentUserId) {
    return { allowed: true, incident };
  }

  // Check if current user is admin in same department
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, fire_department_id')
    .eq('id', currentUserId)
    .single();

  if (profileError || !profile) {
    return { allowed: false, status: 403 as const, message: 'Forbidden' };
  }

  const isAdmin = profile.role === 'admin' || profile.role === 'commander';
  if (isAdmin && profile.fire_department_id === incident.fire_department_id) {
    return { allowed: true, incident };
  }

  return { allowed: false, status: 403 as const, message: 'Forbidden' };
}

export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Missing incident id');
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }
    const token = authHeader.substring(7);

    const supabase = await getSupabase();
    const { user, error: authError } = await getAuthUser(supabase, token);
    if (authError || !user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    const permission = await canMutateIncident(supabase, user.id, id);
    if (!permission.allowed) {
      return errorResponse(permission.status ?? 403, permission.status === 404 ? 'INCIDENT_NOT_FOUND' : 'FORBIDDEN', permission.message);
    }

    const updates = await request.json();

    // Optional rule-based business logic
    if (typeof updates.description === 'string' || typeof updates.incident_name === 'string') {
      const name = typeof updates.incident_name === 'string' ? updates.incident_name : '';
      const desc = typeof updates.description === 'string' ? updates.description : '';
      if (desc || name) {
        updates.category = categorizeIncident(`${name} ${desc}`);
        updates.summary = generateSummary(name || 'Zdarzenie', desc || '', updates.location_address);
      }
    }

    // Perform update
    const { data: updated, error: updateError } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return errorResponse(500, 'SERVER_ERROR', 'Failed to update incident', { details: updateError.message });
    }

    return successResponse(updated, 'Incident updated successfully');
  } catch (error) {
    return errorResponse(500, 'SERVER_ERROR', 'Unexpected error while updating incident');
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    if (!id) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Missing incident id');
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }
    const token = authHeader.substring(7);

    const supabase = await getSupabase();
    const { user, error: authError } = await getAuthUser(supabase, token);
    if (authError || !user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    const permission = await canMutateIncident(supabase, user.id, id);
    if (!permission.allowed) {
      return errorResponse(permission.status ?? 403, permission.status === 404 ? 'INCIDENT_NOT_FOUND' : 'FORBIDDEN', permission.message);
    }

    const { error: delError } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id);

    if (delError) {
      return errorResponse(500, 'SERVER_ERROR', 'Failed to delete incident', { details: delError.message });
    }

    return successResponse(null, 'Incident deleted successfully');
  } catch (error) {
    return errorResponse(500, 'SERVER_ERROR', 'Unexpected error while deleting incident');
  }
};


