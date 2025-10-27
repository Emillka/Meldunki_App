import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db/database.types';

/**
 * POST /api/meldunki-simple
 * 
 * Uproszczony endpoint do tworzenia meldunków
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Sprawdź autentykację
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // 2. Utwórz klienta Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // 3. Sprawdź token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parsuj dane
    const body = await request.json();
    const { title, description, location, incident_type, severity, incident_date } = body;

    // 5. Walidacja podstawowa
    if (!title || !description || !location || !incident_type || !severity || !incident_date) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Wstaw do bazy
    const { data: incident, error: insertError } = await supabase
      .from('incidents')
      .insert({
        user_id: user.id,
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000', // Test fire department
        incident_name: title,
        description: description,
        location_address: location,
        incident_date: incident_date,
        start_time: new Date().toISOString(),
        category: incident_type
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create incident' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Sukces
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          meldunek: {
            id: incident.id,
            title: incident.incident_name,
            description: incident.description,
            location: incident.location_address,
            incident_type: incident.category,
            incident_date: incident.incident_date,
            created_at: incident.created_at
          }
        },
        message: 'Meldunek utworzony pomyślnie'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/meldunki-simple
 * 
 * Uproszczony endpoint do pobierania meldunków
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Sprawdź autentykację
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // 2. Utwórz klienta Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // 3. Sprawdź token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Pobierz meldunki
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch incidents' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Formatuj odpowiedź
    const meldunki = incidents.map(incident => ({
      id: incident.id,
      title: incident.incident_name,
      description: incident.description,
      location: incident.location_address,
      incident_type: incident.category,
      incident_date: incident.incident_date,
      created_at: incident.created_at,
      severity: 'medium', // Default
      status: 'submitted'
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { meldunki },
        message: 'Meldunki pobrane pomyślnie'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
