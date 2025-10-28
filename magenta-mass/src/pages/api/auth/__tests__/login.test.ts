import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../login';
import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/services/auth.service';
import { rateLimiter } from '@/lib/utils/rate-limiter';

// Mock dependencies
vi.mock('@/lib/services/auth.service');
vi.mock('@/lib/utils/rate-limiter');

const mockAuthService = vi.mocked(AuthService);
const mockRateLimiter = vi.mocked(rateLimiter);

describe('POST /api/auth/login', () => {
  let mockRequest: Request;
  let mockAuthServiceInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock AuthService instance
    mockAuthServiceInstance = {
      loginUser: vi.fn()
    };
    mockAuthService.mockImplementation(() => mockAuthServiceInstance);

    // Mock rate limiter
    mockRateLimiter.check.mockReturnValue({
      allowed: true,
      retryAfter: 0
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });
  };

  describe('Rate Limiting', () => {
    it('should reject request when rate limit exceeded', async () => {
      mockRateLimiter.check.mockReturnValue({
        allowed: false,
        retryAfter: 300
      });

      mockRequest = createMockRequest({
        email: 'test@example.com',
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe('TOO_MANY_REQUESTS');
      expect(data.error.message).toBe('Too many login attempts. Please try again later.');
      expect(data.error.details.retry_after).toBe(300);
    });

    it('should allow request when rate limit not exceeded', async () => {
      mockAuthServiceInstance.loginUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' }, token: 'token123' },
        error: null
      });

      mockRequest = createMockRequest({
        email: 'test@example.com',
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Request Validation', () => {
    it('should reject request with invalid JSON', async () => {
      mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should reject request without email', async () => {
      mockRequest = createMockRequest({
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Email and password are required');
    });

    it('should reject request without password', async () => {
      mockRequest = createMockRequest({
        email: 'test@example.com'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Email and password are required');
    });

    it('should reject request with invalid email format', async () => {
      mockRequest = createMockRequest({
        email: 'invalid-email',
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid email format');
    });

    it('should reject request with email too short', async () => {
      mockRequest = createMockRequest({
        email: 'a@b',
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid email format');
    });
  });

  describe('Authentication', () => {
    it('should return success with valid credentials', async () => {
      const mockUserData = {
        user: { id: '1', email: 'test@example.com' },
        token: 'token123'
      };

      mockAuthServiceInstance.loginUser.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      mockRequest = createMockRequest({
        email: 'test@example.com',
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockUserData);
      expect(data.message).toBe('Login successful');
    });

    it('should return error with invalid credentials', async () => {
      mockAuthServiceInstance.loginUser.mockResolvedValue({
        data: null,
        error: { message: 'INVALID_CREDENTIALS' }
      });

      mockRequest = createMockRequest({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
      expect(data.error.message).toBe('Invalid email or password');
    });

    it('should return generic error for other auth failures', async () => {
      mockAuthServiceInstance.loginUser.mockResolvedValue({
        data: null,
        error: { message: 'SOME_OTHER_ERROR' }
      });

      mockRequest = createMockRequest({
        email: 'test@example.com',
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('Login failed. Please try again.');
    });
  });

  describe('Email Sanitization', () => {
    it('should normalize email to lowercase and trim whitespace', async () => {
      mockAuthServiceInstance.loginUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' }, token: 'token123' },
        error: null
      });

      mockRequest = createMockRequest({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123'
      });

      await POST({ request: mockRequest } as any);

      expect(mockAuthServiceInstance.loginUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockAuthServiceInstance.loginUser.mockRejectedValue(new Error('Unexpected error'));

      mockRequest = createMockRequest({
        email: 'test@example.com',
        password: 'password123'
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred during login');
    });
  });

  describe('IP Address Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      mockRequest = createMockRequest(
        { email: 'test@example.com', password: 'password123' },
        { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      );

      await POST({ request: mockRequest } as any);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'login:192.168.1.1',
        5,
        900000
      );
    });

    it('should extract IP from x-real-ip header', async () => {
      mockRequest = createMockRequest(
        { email: 'test@example.com', password: 'password123' },
        { 'x-real-ip': '192.168.1.1' }
      );

      await POST({ request: mockRequest } as any);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'login:192.168.1.1',
        5,
        900000
      );
    });

    it('should use unknown when no IP headers present', async () => {
      mockRequest = createMockRequest(
        { email: 'test@example.com', password: 'password123' },
        {}
      );

      await POST({ request: mockRequest } as any);

      expect(mockRateLimiter.check).toHaveBeenCalledWith(
        'login:unknown',
        5,
        900000
      );
    });
  });
});
