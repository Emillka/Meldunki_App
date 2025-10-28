import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../meldunki';
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
          order: vi.fn(() => ({
            limit: vi.fn()
          })),
          single: vi.fn()
        })),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

const mockSupabase = vi.mocked(supabase) as any;

describe('GET /api/meldunki', () => {
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (headers: Record<string, string> = {}) => {
    return new Request('http://localhost/api/meldunki', {
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
  });

  describe('Profile Validation', () => {
    it('should return error when user profile not found', async () => {
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

  describe('Meldunki Retrieval', () => {
    it('should return meldunki for user fire department', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      const mockIncidents = [
        {
          id: 'incident-1',
          user_id: 'user-123',
          fire_department_id: 'fd-123',
          incident_name: 'Fire at Building A',
          description: 'Small fire in kitchen',
          location_address: '123 Main St',
          category: 'fire',
          incident_date: '2023-01-01',
          start_time: '2023-01-01T10:00:00Z',
          end_time: '2023-01-01T11:00:00Z',
          forces_and_resources: 'Engine 1, Ladder 1',
          summary: 'Fire extinguished successfully',
          commander: 'John Doe',
          driver: 'Jane Smith',
          created_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-01T11:00:00Z'
        }
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock profile query
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      // Mock incidents query
      const mockIncidentsLimit = vi.fn().mockResolvedValue({
        data: mockIncidents,
        error: null
      });
      const mockIncidentsOrder = vi.fn().mockReturnValue({ limit: mockIncidentsLimit });
      const mockIncidentsEq = vi.fn().mockReturnValue({ order: mockIncidentsOrder });
      const mockIncidentsSelect = vi.fn().mockReturnValue({ eq: mockIncidentsEq });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockProfileSelect }) // First call for profile
        .mockReturnValueOnce({ select: mockIncidentsSelect }); // Second call for incidents

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toHaveProperty('id', 'incident-1');
      expect(data.data[0]).toHaveProperty('title', 'Fire at Building A');
      expect(data.data[0]).toHaveProperty('incident_type', 'fire');
      expect(data.data[0]).toHaveProperty('duration_minutes', 60);
    });

    it('should handle empty meldunki list', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock profile query
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      // Mock empty incidents query
      const mockIncidentsLimit = vi.fn().mockResolvedValue({
        data: [],
        error: null
      });
      const mockIncidentsOrder = vi.fn().mockReturnValue({ limit: mockIncidentsLimit });
      const mockIncidentsEq = vi.fn().mockReturnValue({ order: mockIncidentsOrder });
      const mockIncidentsSelect = vi.fn().mockReturnValue({ eq: mockIncidentsEq });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockProfileSelect })
        .mockReturnValueOnce({ select: mockIncidentsSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  });

  describe('Database Query Structure', () => {
    it('should query incidents with correct structure and limits', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      const mockIncidentsLimit = vi.fn().mockResolvedValue({
        data: [],
        error: null
      });
      const mockIncidentsOrder = vi.fn().mockReturnValue({ limit: mockIncidentsLimit });
      const mockIncidentsEq = vi.fn().mockReturnValue({ order: mockIncidentsOrder });
      const mockIncidentsSelect = vi.fn().mockReturnValue({ eq: mockIncidentsEq });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockProfileSelect })
        .mockReturnValueOnce({ select: mockIncidentsSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      await GET({ request: mockRequest } as any);

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockFrom).toHaveBeenCalledWith('incidents');
      expect(mockIncidentsSelect).toHaveBeenCalledWith(expect.stringContaining('id,'));
      expect(mockIncidentsSelect).toHaveBeenCalledWith(expect.stringContaining('incident_name,'));
      expect(mockIncidentsSelect).toHaveBeenCalledWith(expect.stringContaining('description,'));
      expect(mockIncidentsEq).toHaveBeenCalledWith('fire_department_id', 'fd-123');
      expect(mockIncidentsOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockIncidentsLimit).toHaveBeenCalledWith(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      const mockIncidentsLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      const mockIncidentsOrder = vi.fn().mockReturnValue({ limit: mockIncidentsLimit });
      const mockIncidentsEq = vi.fn().mockReturnValue({ order: mockIncidentsOrder });
      const mockIncidentsSelect = vi.fn().mockReturnValue({ eq: mockIncidentsEq });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockProfileSelect })
        .mockReturnValueOnce({ select: mockIncidentsSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('Failed to fetch meldunki');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      mockRequest = createMockRequest({
        'Authorization': 'Bearer valid-token'
      });

      const response = await GET({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred while fetching meldunki');
    });
  });
});

describe('POST /api/meldunki', () => {
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return new Request('http://localhost/api/meldunki', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });
  };

  describe('Authorization Header Validation', () => {
    it('should reject request without Authorization header', async () => {
      mockRequest = createMockRequest({});

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing or invalid authorization header');
    });
  });

  describe('Request Validation', () => {
    it('should reject request without required fields', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockProfileSelect });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        incident_name: 'Test Incident'
        // Missing description and incident_date
      }, {
        'Authorization': 'Bearer valid-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Missing required fields: incident_name, description, incident_date');
    });

    it('should accept request with all required fields', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      const mockIncident = {
        id: 'incident-1',
        user_id: 'user-123',
        fire_department_id: 'fd-123',
        incident_name: 'Test Incident',
        description: 'Test description',
        incident_date: '2023-01-01',
        location_address: '123 Main St',
        forces_and_resources: 'Engine 1',
        commander: 'John Doe',
        driver: 'Jane Smith',
        start_time: '2023-01-01T10:00:00Z',
        end_time: null,
        category: 'other',
        summary: null,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:00:00Z'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      const mockIncidentSingle = vi.fn().mockResolvedValue({
        data: mockIncident,
        error: null
      });
      const mockIncidentSelect = vi.fn().mockReturnValue({ single: mockIncidentSingle });
      const mockIncidentInsert = vi.fn().mockReturnValue({ select: mockIncidentSelect });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockProfileSelect })
        .mockReturnValueOnce({ insert: mockIncidentInsert });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        incident_name: 'Test Incident',
        description: 'Test description',
        incident_date: '2023-01-01',
        location_address: '123 Main St',
        forces_and_resources: 'Engine 1',
        commander: 'John Doe',
        driver: 'Jane Smith'
      }, {
        'Authorization': 'Bearer valid-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id', 'incident-1');
      expect(data.data).toHaveProperty('title', 'Test Incident');
      expect(data.data).toHaveProperty('description', 'Test description');
    });
  });

  describe('Data Sanitization', () => {
    it('should trim whitespace from string fields', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      const mockIncident = {
        id: 'incident-1',
        user_id: 'user-123',
        fire_department_id: 'fd-123',
        incident_name: 'Test Incident',
        description: 'Test description',
        incident_date: '2023-01-01',
        location_address: '123 Main St',
        forces_and_resources: 'Engine 1',
        commander: 'John Doe',
        driver: 'Jane Smith',
        start_time: '2023-01-01T10:00:00Z',
        end_time: null,
        category: 'other',
        summary: null,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:00:00Z'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      const mockIncidentSingle = vi.fn().mockResolvedValue({
        data: mockIncident,
        error: null
      });
      const mockIncidentSelect = vi.fn().mockReturnValue({ single: mockIncidentSingle });
      const mockIncidentInsert = vi.fn().mockReturnValue({ select: mockIncidentSelect });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockProfileSelect })
        .mockReturnValueOnce({ insert: mockIncidentInsert });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        incident_name: '  Test Incident  ',
        description: '  Test description  ',
        incident_date: '2023-01-01',
        location_address: '  123 Main St  ',
        forces_and_resources: '  Engine 1  ',
        commander: '  John Doe  ',
        driver: '  Jane Smith  '
      }, {
        'Authorization': 'Bearer valid-token'
      });

      await POST({ request: mockRequest } as any);

      expect(mockIncidentInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        fire_department_id: 'fd-123',
        incident_name: 'Test Incident',
        description: 'Test description',
        incident_date: '2023-01-01',
        location_address: '123 Main St',
        forces_and_resources: 'Engine 1',
        commander: 'John Doe',
        driver: 'Jane Smith',
        start_time: expect.any(String),
        end_time: null,
        category: 'other',
        summary: null
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database insertion errors', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockProfile = {
        fire_department_id: 'fd-123'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      const mockIncidentSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database insertion failed' }
      });
      const mockIncidentSelect = vi.fn().mockReturnValue({ single: mockIncidentSingle });
      const mockIncidentInsert = vi.fn().mockReturnValue({ select: mockIncidentSelect });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({ select: mockProfileSelect })
        .mockReturnValueOnce({ insert: mockIncidentInsert });

      mockSupabase.from.mockImplementation(mockFrom);

      mockRequest = createMockRequest({
        incident_name: 'Test Incident',
        description: 'Test description',
        incident_date: '2023-01-01'
      }, {
        'Authorization': 'Bearer valid-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toContain('Failed to create meldunek');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      mockRequest = createMockRequest({
        incident_name: 'Test Incident',
        description: 'Test description',
        incident_date: '2023-01-01'
      }, {
        'Authorization': 'Bearer valid-token'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred while creating meldunek');
    });
  });
});
