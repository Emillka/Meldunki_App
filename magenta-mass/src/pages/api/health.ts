import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Podstawowe sprawdzenie zdrowia aplikacji
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown', // Można dodać sprawdzenie połączenia z bazą
        redis: 'unknown',   // Można dodać sprawdzenie Redis
      }
    };

    // Sprawdzenie połączenia z Supabase (opcjonalne)
    if (process.env.PUBLIC_SUPABASE_URL) {
      try {
        const response = await fetch(`${process.env.PUBLIC_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.PUBLIC_SUPABASE_ANON_KEY || ''}`
          }
        });
        
        healthCheck.services.database = response.ok ? 'healthy' : 'unhealthy';
      } catch (error) {
        healthCheck.services.database = 'unhealthy';
      }
    }

    // Sprawdzenie Redis (jeśli dostępne)
    // Można dodać sprawdzenie połączenia z Redis

    const isHealthy = healthCheck.services.database !== 'unhealthy';

    return new Response(JSON.stringify(healthCheck), {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
};
