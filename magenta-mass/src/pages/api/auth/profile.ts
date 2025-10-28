import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse } from '@/lib/utils/response';
import type { Database } from '@/lib/db/database.types';

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
    
    // Try to get profile with service role key to bypass RLS
    const supabaseService = createClient<Database>(
      process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: profile, error: profileError } = await supabaseService
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
      console.error('Profile not found for user:', user.id, 'Error:', profileError);
      return errorResponse(
        404,
        'PROFILE_NOT_FOUND',
        'User profile not found'
      );
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
