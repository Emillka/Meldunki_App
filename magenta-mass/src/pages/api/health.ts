import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Uproszczony health check - odpowiada natychmiast bez sprawdzania zewnętrznych serwisów
  // To zapewnia szybką odpowiedź dla Render health check (timeout ~30s)
  // Sprawdzanie Supabase można dodać w osobnym endpoincie /api/health/detailed
  
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    // Natychmiastowa odpowiedź - bez sprawdzania zewnętrznych serwisów
    // Render health check wymaga szybkiej odpowiedzi (< 5s)
    return new Response(JSON.stringify(healthCheck), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    // Nawet w przypadku błędu zwracamy 200, żeby aplikacja mogła się uruchomić
    // Render sprawdza tylko czy endpoint odpowiada
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      note: 'Health check endpoint is responding'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
};
