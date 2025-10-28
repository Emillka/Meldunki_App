import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../logout';
import { supabase } from '@/lib/db/supabase';

// Mock Supabase
vi.mock('@/lib/db/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn()
    }
  }
}));

const mockSupabase = vi.mocked(supabase) as any;

describe('POST /api/auth/logout', () => {
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (headers: Record<string, string> = {}) => {
    return new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  };

  describe('Authorization Header Validation', () => {
    it('should reject request without Authorization header', async () => {
      mockRequest = createMockRequest();

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing or invalid authorization header');
    });

    it('should reject request with invalid Authorization header format', async () => {
      mockRequest = createMockRequest({
        'Authorization': 'InvalidFormat token123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing or invalid authorization header');
    });

    it('should accept request with valid Bearer token', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      mockRequest = createMockRequest({
        'Authorization': 'Bearer token123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logout successful');
    });
  });

  describe('Supabase Integration', () => {
    it('should call Supabase signOut with valid token', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      mockRequest = createMockRequest({
        'Authorization': 'Bearer token123'
      });

      await POST({ request: mockRequest } as any);

      expect(mockSupabase.auth.signOut).toHaveBeenCalledOnce();
    });

    it('should return success even if Supabase signOut fails', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ 
        error: { message: 'Supabase error' } 
      });

      mockRequest = createMockRequest({
        'Authorization': 'Bearer token123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logout successful');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.signOut.mockRejectedValue(new Error('Unexpected error'));

      mockRequest = createMockRequest({
        'Authorization': 'Bearer token123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred during logout');
    });
  });

  describe('Token Extraction', () => {
    it('should correctly extract token from Bearer header', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      mockRequest = createMockRequest({
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      });

      await POST({ request: mockRequest } as any);

      expect(mockSupabase.auth.signOut).toHaveBeenCalledOnce();
    });
  });
});
