import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse } from '@/lib/utils/response';
import type { Database } from '@/lib/db/database.types';
import type { RefreshTokenRequestDTO, RefreshTokenResponseDTO } from '@/lib/types';

/**
 * POST /api/auth/refresh
 * Odświeża token dostępu używając refresh token
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid JSON in request body'
      );
    }

    // 2. Validate request data
    const dto = body as RefreshTokenRequestDTO;
    
    if (!dto.refresh_token) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Refresh token is required'
      );
    }

    // 3. Create Supabase client
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse(
        500,
        'SERVER_ERROR',
        'Supabase configuration missing'
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // 4. Refresh the session
    const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: dto.refresh_token
    });

    if (refreshError || !sessionData.session) {
      return errorResponse(
        401,
        'INVALID_REFRESH_TOKEN',
        'Invalid or expired refresh token'
      );
    }

    // 5. Format response
    const responseData: RefreshTokenResponseDTO = {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: sessionData.session.expires_at!,
      expires_in: sessionData.session.expires_in!
    };

    return successResponse(
      responseData,
      'Token refreshed successfully'
    );

  } catch (error) {
    console.error('Refresh endpoint error:', error);
    return errorResponse(
      500,
      'SERVER_ERROR',
      'An unexpected error occurred during token refresh'
    );
  }
};
