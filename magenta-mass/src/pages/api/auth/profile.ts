import type { APIRoute } from 'astro';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse } from '@/lib/utils/response';

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
    
    if (authError || !user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        'Invalid or expired token'
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabase
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

    if (profileError || !profile) {
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
