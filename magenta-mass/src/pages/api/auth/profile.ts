import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse } from '@/lib/utils/response';
import type { Database } from '@/lib/db/database.types';
import { validateUpdateProfileRequest, sanitizeString } from '@/lib/validation/auth.validation';

/**
 * GET /api/auth/profile
 * Pobiera profil zalogowanego użytkownika
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
    
    console.log('Profile endpoint - auth result:', { 
      user: user?.id, 
      error: authError?.message 
    });
    
    if (authError || !user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or expired token'
      );
    }

    // 3. Get user profile
    console.log('Profile endpoint - looking for profile for user:', user.id);
    
    // Use service role key if available, otherwise use anon key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Profile endpoint - service role key available:', !!serviceRoleKey);
    
    const supabaseForProfile = serviceRoleKey 
      ? createClient<Database>(
          process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
          serviceRoleKey
        )
      : supabase;
    
    const { data: profile, error: profileError } = await supabaseForProfile
      .from('profiles')
      .select(`
        id,
        fire_department_id,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        fire_departments (
          name,
          counties (
            name,
            provinces (
              name
            )
          )
        )
      `)
      .eq('id', user.id)
      .single();

    console.log('Profile endpoint - profile query result:', { 
      profile: profile?.id, 
      error: profileError?.message 
    });

    if (profileError || !profile) {
      console.warn('Profile not found or not accessible via RLS. Returning user-only payload. Error:', profileError?.message);
      // Fallback: return user data without profile to avoid login loops when RLS blocks profiles
      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: null
      });
    }

    // 4. Format response
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: {
        id: profile.id,
        fire_department_id: profile.fire_department_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        fire_department: profile.fire_departments
      }
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Profile endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred while fetching profile'
    );
  }
};

/**
 * PATCH /api/auth/profile
 * Aktualizuje profil zalogowanego użytkownika
 */
export const PATCH: APIRoute = async ({ request }) => {
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

    // 3. Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid JSON in request body'
      );
    }

    const validation = validateUpdateProfileRequest(requestBody);
    if (!validation.valid) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid input data',
        validation.errors
      );
    }

    // 4. Prepare update data (only include fields that are provided)
    const updateData: Record<string, string | null> = {};
    
    if (requestBody.first_name !== undefined) {
      updateData.first_name = sanitizeString(requestBody.first_name) || null;
    }
    
    if (requestBody.last_name !== undefined) {
      updateData.last_name = sanitizeString(requestBody.last_name) || null;
    }

    // 5. Use service role key for update (RLS might block updates)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseForUpdate = serviceRoleKey 
      ? createClient<Database>(
          process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
          serviceRoleKey
        )
      : supabase;

    // 6. Update profile
    const { data: updatedProfile, error: updateError } = await supabaseForUpdate
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select(`
        id,
        fire_department_id,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        fire_departments (
          name,
          counties (
            name,
            provinces (
              name
            )
          )
        )
      `)
      .single();

    if (updateError || !updatedProfile) {
      console.error('Profile update error:', updateError);
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Failed to update profile',
        { details: updateError?.message }
      );
    }

    // 7. Format response
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: {
        id: updatedProfile.id,
        fire_department_id: updatedProfile.fire_department_id,
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        role: updatedProfile.role,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
        fire_department: updatedProfile.fire_departments
      }
    };

    return successResponse(responseData);

  } catch (error) {
    console.error('Profile update endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred while updating profile'
    );
  }
};
