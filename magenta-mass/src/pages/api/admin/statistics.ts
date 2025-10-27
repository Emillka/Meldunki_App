import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db/database.types';

/**
 * API endpoint do pobierania statystyk jednostki OSP
 * GET /api/admin/statistics
 * Dostępny tylko dla administratorów
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Pobierz token z nagłówka Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Brak tokenu autoryzacji'
          }
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // 2. Utwórz klienta Supabase
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Błąd konfiguracji serwera'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // 3. Sprawdź token i pobierz użytkownika
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Nieprawidłowy lub wygasły token'
          }
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 4. Sprawdź czy użytkownik jest administratorem
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, fire_department_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil użytkownika nie został znaleziony'
          }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Brak uprawnień administratora'
          }
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 5. Pobierz statystyki użytkowników
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, role, created_at')
      .eq('fire_department_id', profile.fire_department_id);
    
    if (usersError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Błąd podczas pobierania statystyk użytkowników'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // 6. Pobierz statystyki meldunków (jeśli tabela incidents istnieje)
    let totalIncidents = 0;
    let incidentsThisMonth = 0;
    let mostActiveUser = null;
    
    try {
      const { data: incidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('user_id, created_at')
        .eq('fire_department_id', profile.fire_department_id);
      
      if (!incidentsError && incidents) {
        totalIncidents = incidents.length;
        
        // Oblicz meldunki w tym miesiącu
        const now = new Date();
        const thisMonth = incidents.filter(incident => {
          const date = new Date(incident.created_at);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        incidentsThisMonth = thisMonth.length;
        
        // Znajdź najaktywniejszego użytkownika
        const userIncidentCounts = incidents.reduce((acc, incident) => {
          acc[incident.user_id] = (acc[incident.user_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostActiveUserId = Object.keys(userIncidentCounts).reduce((a, b) => 
          userIncidentCounts[a] > userIncidentCounts[b] ? a : b
        );
        
        if (mostActiveUserId) {
          const { data: mostActiveUserData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', mostActiveUserId)
            .single();
          
          if (mostActiveUserData) {
            mostActiveUser = `${mostActiveUserData.first_name || ''} ${mostActiveUserData.last_name || ''}`.trim();
          }
        }
      }
    } catch (error) {
      console.log('Incidents table not available, using mock data');
    }
    
    // 7. Oblicz statystyki
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      // Użytkownik aktywny jeśli został utworzony w ciągu ostatnich 30 dni
      const createdDate = new Date(user.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length;
    
    // 8. Formatuj odpowiedź
    const statistics = {
      total_users: totalUsers,
      total_incidents: totalIncidents,
      active_users: activeUsers,
      incidents_this_month: incidentsThisMonth,
      most_active_user: mostActiveUser,
      department_id: profile.fire_department_id
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: statistics
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Unexpected statistics error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Nieoczekiwany błąd serwera'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
