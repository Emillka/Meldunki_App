/**
 * Entry w rate limiter zawierający licznik i czas resetu
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * RateLimiter - Prosty in-memory rate limiter
 * 
 * Wykorzystuje Map do śledzenia liczby żądań per klucz (np. IP address)
 * w określonym oknie czasowym.
 * 
 * ⚠️ UWAGA: To jest prosta implementacja in-memory.
 * W produkcji z wieloma instancjami serwera, użyj Redis lub innego
 * distributed cache.
 * 
 * @example
 * ```typescript
 * const limiter = new RateLimiter();
 * const result = limiter.check('192.168.1.1', 5, 60000); // 5 req per minute
 * 
 * if (!result.allowed) {
 *   return errorResponse(429, 'TOO_MANY_REQUESTS', 'Rate limit exceeded', {
 *     retry_after: result.retryAfter
 *   });
 * }
 * ```
 */
class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  /**
   * Sprawdza czy request może być przetworzony zgodnie z limitem
   * 
   * @param key - Unikalny identyfikator klienta (np. IP address, user ID)
   * @param maxRequests - Maksymalna liczba żądań w oknie czasowym
   * @param windowMs - Długość okna czasowego w milisekundach
   * @returns Obiekt z informacją czy request jest dozwolony i czasem retry
   * 
   * @example
   * ```typescript
   * // 3 requests per hour
   * const result = limiter.check('user-ip', 3, 3600000);
   * console.log(result.allowed); // true/false
   * console.log(result.retryAfter); // sekundy do kolejnej próby (jeśli !allowed)
   * ```
   */
  check(key: string, maxRequests: number, windowMs: number): {
    allowed: boolean;
    retryAfter?: number;
  } {
    const now = Date.now();
    const limit = this.limits.get(key);
    
    // Brak poprzednich żądań lub okno czasowe wygasło
    if (!limit || now > limit.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return { allowed: true };
    }
    
    // Przekroczono limit
    if (limit.count >= maxRequests) {
      const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    // Zwiększ licznik i pozwól na request
    limit.count++;
    return { allowed: true };
  }
  
  /**
   * Czyści wygasłe wpisy z pamięci (garbage collection)
   * 
   * Powinno być wywoływane okresowo aby zwolnić pamięć.
   * 
   * @example
   * ```typescript
   * // Cleanup co 5 minut
   * setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
   * ```
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetAt) {
        this.limits.delete(key);
      }
    }
  }
  
  /**
   * Resetuje limit dla określonego klucza
   * Przydatne w testach lub w sytuacjach gdy trzeba wyczyścić limit manualnie
   * 
   * @param key - Klucz do zresetowania
   */
  reset(key: string): void {
    this.limits.delete(key);
  }
  
  /**
   * Czyści wszystkie limity
   * Przydatne w testach
   */
  resetAll(): void {
    this.limits.clear();
  }
}

/**
 * Singleton instance rate limitera
 * Używaj tego w całej aplikacji
 */
export const rateLimiter = new RateLimiter();

/**
 * Automatyczne czyszczenie wygasłych wpisów co 5 minut
 * Tylko jeśli setInterval jest dostępny (środowisko runtime)
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

