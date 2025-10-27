import type { APIRoute } from 'astro';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * POST /api/auth/logout
 * Wylogowuje użytkownika z systemu
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

    // 2. Sign out user from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      // Even if Supabase logout fails, we still return success
      // because the client will clear the token anyway
    }

    // 3. Success response
    return successResponse(
      null,
      'Logout successful'
    );

  } catch (error) {
    console.error('Logout endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred during logout'
    );
  }
};
