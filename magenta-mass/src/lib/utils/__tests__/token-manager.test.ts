import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager } from '@/lib/utils/token-manager';

// Mock fetch
global.fetch = vi.fn();

describe('TokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Session Management', () => {
    it('should save session data correctly', () => {
      const session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
        expires_in: 3600
      };

      TokenManager.saveSession(session);

      expect(localStorage.getItem('access_token')).toBe('test-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('test-refresh-token');
      expect(localStorage.getItem('expires_at')).toBe(session.expires_at.toString());
    });

    it('should retrieve access token', () => {
      localStorage.setItem('access_token', 'test-token');
      expect(TokenManager.getAccessToken()).toBe('test-token');
    });

    it('should retrieve refresh token', () => {
      localStorage.setItem('refresh_token', 'test-refresh-token');
      expect(TokenManager.getRefreshToken()).toBe('test-refresh-token');
    });

    it('should retrieve expires at time', () => {
      const expiresAt = Date.now() + 3600000;
      localStorage.setItem('expires_at', expiresAt.toString());
      expect(TokenManager.getExpiresAt()).toBe(expiresAt);
    });

    it('should clear session data', () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem('expires_at', '123456');

      TokenManager.clearSession();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('expires_at')).toBeNull();
    });
  });

  describe('Token Validation', () => {
    it('should return true for valid token', () => {
      const expiresAt = Date.now() + 600000; // 10 minutes from now
      localStorage.setItem('expires_at', expiresAt.toString());
      
      expect(TokenManager.isTokenValid()).toBe(true);
    });

    it('should return false for expired token', () => {
      const expiresAt = Date.now() - 600000; // 10 minutes ago
      localStorage.setItem('expires_at', expiresAt.toString());
      
      expect(TokenManager.isTokenValid()).toBe(false);
    });

    it('should return false when no expires_at', () => {
      expect(TokenManager.isTokenValid()).toBe(false);
    });

    it('should detect when token needs refresh', () => {
      const expiresAt = Date.now() + 200000; // 3.3 minutes from now (less than 5 min buffer)
      localStorage.setItem('expires_at', expiresAt.toString());
      
      expect(TokenManager.needsRefresh()).toBe(true);
    });

    it('should not need refresh for fresh token', () => {
      const expiresAt = Date.now() + 600000; // 10 minutes from now
      localStorage.setItem('expires_at', expiresAt.toString());
      
      expect(TokenManager.needsRefresh()).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should successfully refresh token', async () => {
      localStorage.setItem('refresh_token', 'test-refresh-token');
      
      const mockResponse = {
        success: true,
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_at: Date.now() + 3600000,
          expires_in: 3600
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await TokenManager.refreshToken();

      expect(result).not.toBeNull();
      expect(result?.access_token).toBe('new-access-token');
      expect(localStorage.getItem('access_token')).toBe('new-access-token');
    });

    it('should handle refresh failure', async () => {
      localStorage.setItem('refresh_token', 'invalid-refresh-token');
      
      const mockResponse = {
        success: false,
        error: { message: 'Invalid refresh token' }
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await TokenManager.refreshToken();

      expect(result).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('should handle network error during refresh', async () => {
      localStorage.setItem('refresh_token', 'test-refresh-token');
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await TokenManager.refreshToken();

      expect(result).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('Authentication Check', () => {
    it('should return authenticated user with valid token', async () => {
      const expiresAt = Date.now() + 600000;
      localStorage.setItem('access_token', 'valid-token');
      localStorage.setItem('expires_at', expiresAt.toString());

      const mockUserData = {
        user: { id: '1', email: 'test@example.com' },
        profile: { first_name: 'Test', last_name: 'User' }
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockUserData
        })
      });

      const result = await TokenManager.checkAuth();

      expect(result.isAuthenticated).toBe(true);
      expect(result.user).toEqual(mockUserData);
    });

    it('should return not authenticated for invalid token', async () => {
      const expiresAt = Date.now() + 600000;
      localStorage.setItem('access_token', 'invalid-token');
      localStorage.setItem('expires_at', expiresAt.toString());

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { message: 'Invalid token' }
        })
      });

      const result = await TokenManager.checkAuth();

      expect(result.isAuthenticated).toBe(false);
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('should return not authenticated when no token', async () => {
      const result = await TokenManager.checkAuth();

      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      localStorage.setItem('access_token', 'test-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true })
      });

      await TokenManager.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should clear session even if logout API fails', async () => {
      localStorage.setItem('access_token', 'test-token');
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await TokenManager.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});
