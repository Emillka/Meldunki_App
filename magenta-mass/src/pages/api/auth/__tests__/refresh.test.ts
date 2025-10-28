import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../refresh';

// Mock Supabase
const mockSupabase = {
  auth: {
    refreshSession: vi.fn()
  }
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Mock environment variables
vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return {
      text: () => Promise.resolve(JSON.stringify(body))
    } as Request;
  };

  describe('Request Validation', () => {
    it('should reject request with invalid JSON', async () => {
      const mockRequest = {
        text: () => Promise.resolve('invalid json')
      } as Request;

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should reject request without refresh token', async () => {
      const mockRequest = createMockRequest({});

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Refresh token is required');
    });
  });

  describe('Token Refresh', () => {
    it('should successfully refresh valid token', async () => {
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600000,
        expires_in: 3600
      };

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const mockRequest = createMockRequest({
        refresh_token: 'valid-refresh-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.access_token).toBe('new-access-token');
      expect(data.data.refresh_token).toBe('new-refresh-token');
    });

    it('should reject invalid refresh token', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token' }
      });

      const mockRequest = createMockRequest({
        refresh_token: 'invalid-refresh-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('INVALID_REFRESH_TOKEN');
      expect(data.error.message).toBe('Invalid or expired refresh token');
    });

    it('should handle Supabase configuration errors', async () => {
      vi.stubEnv('PUBLIC_SUPABASE_URL', '');
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

      const mockRequest = createMockRequest({
        refresh_token: 'valid-refresh-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('Supabase configuration missing');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors', async () => {
      mockSupabase.auth.refreshSession.mockRejectedValue(new Error('Unexpected error'));

      const mockRequest = createMockRequest({
        refresh_token: 'valid-refresh-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred during token refresh');
    });
  });
});
