import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { POST as LoginPOST } from '../../../pages/api/auth/login';
import { GET as MeldunkiGET, POST as MeldunkiPOST } from '../../../pages/api/meldunki';
import { GET as ProfileGET } from '../../../pages/api/auth/profile';
import { supabase } from '@/lib/db/supabase';

// Mock Supabase for performance tests
vi.mock('@/lib/db/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn()
          })),
          single: vi.fn()
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

// Mock AuthService
vi.mock('@/lib/services/auth.service', () => ({
  AuthService: class MockAuthService {
    async loginUser() {
      return {
        data: { user: { id: '1', email: 'test@example.com' }, session: { access_token: 'token123' } },
        error: null
      };
    }
  }
}));

// Mock rate limiter
vi.mock('@/lib/utils/rate-limiter', () => ({
  rateLimiter: {
    check: vi.fn().mockReturnValue({ allowed: true, retryAfter: 0 })
  }
}));

const mockSupabase = vi.mocked(supabase) as any;

describe('Performance Tests', () => {
  let mockUser: any;
  let mockProfile: any;
  let mockFireDepartment: any;

  beforeAll(() => {
    // Setup mock data
    mockUser = {
      id: 'perf-test-user',
      email: 'perf@test.com',
      created_at: '2023-01-01T00:00:00Z'
    };

    mockProfile = {
      id: 'perf-test-user',
      fire_department_id: 'perf-test-fd',
      first_name: 'Performance',
      last_name: 'Test',
      role: 'firefighter',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      fire_departments: {
        name: 'OSP Performance Test',
        counties: {
          name: 'Test County',
          provinces: {
            name: 'Test Province'
          }
        }
      }
    };

    mockFireDepartment = {
      id: 'perf-test-fd',
      name: 'OSP Performance Test'
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Endpoint Performance', () => {
    it('should handle login requests within acceptable time', async () => {
      const mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'perf@test.com',
          password: 'password123'
        })
      });

      const startTime = performance.now();
      const response = await LoginPOST({ request: mockRequest } as any);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent login requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => {
        const mockRequest = new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `perf${i}@test.com`,
            password: 'password123'
          })
        });
        return LoginPOST({ request: mockRequest } as any);
      });

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle rate limiting efficiently', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => {
        const mockRequest = new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-forwarded-for': `192.168.1.${i % 10}`
          },
          body: JSON.stringify({
            email: `perf${i}@test.com`,
            password: 'password123'
          })
        });
        return LoginPOST({ request: mockRequest } as any);
      });

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(responses).toHaveLength(100);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Meldunki Endpoint Performance', () => {
    beforeEach(() => {
      // Mock successful authentication
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
        data: [],
        error: null
      });
      const mockIncidentsOrder = vi.fn().mockReturnValue({ limit: mockIncidentsLimit });
      const mockIncidentsEq = vi.fn().mockReturnValue({ order: mockIncidentsOrder });
      const mockIncidentsSelect = vi.fn().mockReturnValue({ eq: mockIncidentsEq });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return { select: mockProfileSelect };
        } else if (table === 'incidents') {
          return { select: mockIncidentsSelect };
        }
        return { select: vi.fn() };
      });
    });

    it('should handle GET meldunki requests efficiently', async () => {
      const mockRequest = new Request('http://localhost/api/meldunki', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123'
        }
      });

      const startTime = performance.now();
      const response = await MeldunkiGET({ request: mockRequest } as any);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle POST meldunki requests efficiently', async () => {
      // Mock incident creation
      const mockIncident = {
        id: 'perf-test-incident',
        user_id: mockUser.id,
        fire_department_id: mockProfile.fire_department_id,
        incident_name: 'Performance Test Incident',
        description: 'Test description',
        incident_date: '2023-01-01',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockIncidentSingle = vi.fn().mockResolvedValue({
        data: mockIncident,
        error: null
      });
      const mockIncidentSelect = vi.fn().mockReturnValue({ single: mockIncidentSingle });
      const mockIncidentInsert = vi.fn().mockReturnValue({ select: mockIncidentSelect });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }) }) }) };
        } else if (table === 'incidents') {
          return { insert: mockIncidentInsert };
        }
        return { select: vi.fn() };
      });

      const mockRequest = new Request('http://localhost/api/meldunki', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer token123',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          incident_name: 'Performance Test Incident',
          description: 'Test description',
          incident_date: '2023-01-01'
        })
      });

      const startTime = performance.now();
      const response = await MeldunkiPOST({ request: mockRequest } as any);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large meldunki datasets efficiently', async () => {
      // Mock large dataset
      const largeIncidents = Array.from({ length: 1000 }, (_, i) => ({
        id: `incident-${i}`,
        user_id: mockUser.id,
        fire_department_id: mockProfile.fire_department_id,
        incident_name: `Large Dataset Incident ${i}`,
        description: `Description for incident ${i}`,
        location_address: `Location ${i}`,
        category: 'fire',
        incident_date: '2023-01-01',
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T12:00:00Z',
        forces_and_resources: 'Engine 1',
        summary: 'Test summary',
        commander: 'Test Commander',
        driver: 'Test Driver',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }));

      const mockIncidentsLimit = vi.fn().mockResolvedValue({
        data: largeIncidents,
        error: null
      });
      const mockIncidentsOrder = vi.fn().mockReturnValue({ limit: mockIncidentsLimit });
      const mockIncidentsEq = vi.fn().mockReturnValue({ order: mockIncidentsOrder });
      const mockIncidentsSelect = vi.fn().mockReturnValue({ eq: mockIncidentsEq });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }) }) }) };
        } else if (table === 'incidents') {
          return { select: mockIncidentsSelect };
        }
        return { select: vi.fn() };
      });

      const mockRequest = new Request('http://localhost/api/meldunki', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123'
        }
      });

      const startTime = performance.now();
      const response = await MeldunkiGET({ request: mockRequest } as any);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds even with large dataset
    });
  });

  describe('Profile Endpoint Performance', () => {
    beforeEach(() => {
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
    });

    it('should handle profile requests efficiently', async () => {
      const mockRequest = new Request('http://localhost/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123'
        }
      });

      const startTime = performance.now();
      const response = await ProfileGET({ request: mockRequest } as any);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle concurrent profile requests', async () => {
      const requests = Array.from({ length: 20 }, () => {
        const mockRequest = new Request('http://localhost/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token123'
          }
        });
        return ProfileGET({ request: mockRequest } as any);
      });

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(responses).toHaveLength(20);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory with repeated requests', async () => {
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

      const initialMemory = process.memoryUsage().heapUsed;

      // Make many requests
      for (let i = 0; i < 100; i++) {
        const mockRequest = new Request('http://localhost/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token123'
          }
        });
        await ProfileGET({ request: mockRequest } as any);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Response Time Consistency', () => {
    it('should maintain consistent response times', async () => {
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

      const responseTimes: number[] = [];

      // Make multiple requests and measure response times
      for (let i = 0; i < 10; i++) {
        const mockRequest = new Request('http://localhost/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token123'
          }
        });

        const startTime = performance.now();
        await ProfileGET({ request: mockRequest } as any);
        const endTime = performance.now();

        responseTimes.push(endTime - startTime);
      }

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      // Response times should be consistent
      expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
      expect(maxResponseTime).toBeLessThan(1000); // Max under 1 second
      expect(maxResponseTime - minResponseTime).toBeLessThan(500); // Variation under 500ms
    });
  });
});
