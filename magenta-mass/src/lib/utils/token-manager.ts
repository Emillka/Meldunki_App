/**
 * Authentication Token Manager
 * Zarządza tokenami JWT i automatycznym odświeżaniem
 */

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly EXPIRES_AT_KEY = 'expires_at';
  
  // Buffer time before expiration (5 minutes)
  private static readonly REFRESH_BUFFER_MS = 5 * 60 * 1000;

  /**
   * Zapisuje dane sesji w localStorage
   */
  static saveSession(session: TokenData): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, session.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, session.refresh_token);
    // Supabase zwraca expires_at w sekundach — normalizujemy do milisekund
    const normalizedExpiresAt = session.expires_at < 1e12
      ? session.expires_at * 1000
      : session.expires_at;
    localStorage.setItem(this.EXPIRES_AT_KEY, normalizedExpiresAt.toString());
  }

  /**
   * Pobiera aktualny access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Pobiera refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Pobiera czas wygaśnięcia tokenu
   */
  static getExpiresAt(): number | null {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }

  /**
   * Sprawdza czy token jest ważny (nie wygasł)
   */
  static isTokenValid(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return false;
    
    // Sprawdź czy token nie wygasł (z buforem)
    return Date.now() < (expiresAt - this.REFRESH_BUFFER_MS);
  }

  /**
   * Sprawdza czy token wymaga odświeżenia
   */
  static needsRefresh(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    
    // Odśwież jeśli token wygaśnie w ciągu 5 minut
    return Date.now() >= (expiresAt - this.REFRESH_BUFFER_MS);
  }

  /**
   * Odświeża token używając refresh token
   */
  static async refreshToken(): Promise<TokenData | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.warn('No refresh token available');
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        const newSession: TokenData = {
          access_token: result.data.access_token,
          refresh_token: result.data.refresh_token,
          expires_at: result.data.expires_at,
          expires_in: result.data.expires_in
        };
        
        this.saveSession(newSession);
        return newSession;
      } else {
        console.error('Token refresh failed:', result.error);
        this.clearSession();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Pobiera ważny access token (odświeża jeśli potrzeba)
   */
  static async getValidAccessToken(): Promise<string | null> {
    // Jeśli token jest ważny, zwróć go
    if (this.isTokenValid()) {
      return this.getAccessToken();
    }

    // Jeśli potrzebuje odświeżenia, spróbuj odświeżyć
    if (this.needsRefresh()) {
      const newSession = await this.refreshToken();
      if (newSession) {
        return newSession.access_token;
      }
    }

    // Jeśli nie można odświeżyć, zwróć null
    return null;
  }

  /**
   * Sprawdza autoryzację użytkownika
   */
  static async checkAuth(): Promise<{ isAuthenticated: boolean; user?: any }> {
    const token = await this.getValidAccessToken();
    
    if (!token) {
      return { isAuthenticated: false };
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        return { 
          isAuthenticated: true, 
          user: result.data 
        };
      } else {
        // Token jest nieprawidłowy, wyczyść sesję
        this.clearSession();
        return { isAuthenticated: false };
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.clearSession();
      return { isAuthenticated: false };
    }
  }

  /**
   * Czyści sesję użytkownika
   */
  static clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  /**
   * Wylogowuje użytkownika
   */
  static async logout(): Promise<void> {
    const token = this.getAccessToken();
    
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    
    this.clearSession();
  }
}
