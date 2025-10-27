import type { APIRoute } from 'astro';
import { supabase } from '@/lib/db/supabase';

/**
 * GET /api/fire-departments
 * Returns a list of available fire departments
 */
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('fire_departments')
      .select(`
        id,
        name,
        counties!inner(
          name,
          provinces!inner(name)
        )
      `)
      .limit(10);

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: { message: 'Failed to fetch fire departments' }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: data || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: { message: 'Internal server error' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
