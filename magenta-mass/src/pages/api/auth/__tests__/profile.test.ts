import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../profile';
import { supabase } from '@/lib/db/supabase';

// Mock Supabase
vi.mock('@/lib/db/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

const mockSupabase = vi.mocked(supabase) as any;

describe('GET /api/auth/profile', () => {
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (headers: Record<string, string> = {}) => {
    return new Request('http://localhost/api/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  };

  describe('Authorization Header Validation', () => {
    it('should reject request without Authorization header', async () => {
      mockRequest = createMockRequest();

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing or invalid authorization header');
    });

    it('should reject request with invalid Authorization header format', async () => {
      mockRequest = createMockRequest({
        'Authorization': 'InvalidFormat token123'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing or invalid authorization header');
    });
  });

  describe('Token Validation', () => {
    it('should reject request with invalid token', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      mockRequest = createMockRequest({
        'Authorization': 'Bearer invalid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Invalid or expired token');
    });

    it('should reject request with expired token', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' }
      });

      mockRequest = createMockRequest({
        'Authorization': 'Bearer expired-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Invalid or expired token');
    });
  });

  describe('Profile Retrieval', () => {
    it('should return user profile with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        id: 'user-123',
        fire_department_id: 'fd-123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'firefighter',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        fire_departments: {
          name: 'OSP Test',
          counties: {
            name: 'Test County',
            provinces: {
              name: 'Test Province'
            }
          }
        }
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock the chain of Supabase calls
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user).toEqual(mockUser);
      expect(data.data.profile).toEqual(mockProfile);
    });

    it('should return error when profile not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock profile not found
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('PROFILE_NOT_FOUND');
      expect(data.error.message).toBe('User profile not found');
    });
  });

  describe('Database Query Structure', () => {
    it('should query profiles table with correct structure', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      await GET({ request: mockRequest } as any);

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id,'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('fire_department_id,'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('first_name,'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('last_name,'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('role,'));
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred while fetching profile');
    });
  });

  describe('Response Format', () => {
    it('should format response correctly with nested data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        id: 'user-123',
        fire_department_id: 'fd-123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'firefighter',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        fire_departments: {
          name: 'OSP Test',
          counties: {
            name: 'Test County',
            provinces: {
              name: 'Test Province'
            }
          }
        }
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(data.data).toHaveProperty('user');
      expect(data.data).toHaveProperty('profile');
      expect(data.data.user).toHaveProperty('id');
      expect(data.data.user).toHaveProperty('email');
      expect(data.data.user).toHaveProperty('created_at');
      expect(data.data.profile).toHaveProperty('fire_department');
    });
  });
});
