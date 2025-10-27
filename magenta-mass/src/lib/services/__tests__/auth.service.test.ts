import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { mockSupabaseClient, testData, setupTestEnvironment, cleanupTestEnvironment } from '../../../test/utils';
import type { RegisterUserCommand } from '../../types';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    setupTestEnvironment();
    authService = new AuthService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('registerUser', () => {
    it('should successfully register a new user with valid data', async () => {
      // Arrange
      const command: RegisterUserCommand = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        profile: {
          fire_department_id: testData.fireDepartment.id,
          first_name: 'John',
          last_name: 'Doe',
          role: 'member'
        }
      };

      // Mock successful fire department validation
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: testData.fireDepartment.id },
          error: null
        })
      });

      // Mock successful auth signup
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: testData.user,
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_at: Date.now() + 3600,
            expires_in: 3600
          }
        },
        error: null
      });

      // Mock profile creation
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: testData.profile,
          error: null
        })
      });

      // Act
      const result = await authService.registerUser(command);

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.user).toEqual(testData.user);
      expect(result.data?.profile).toEqual(testData.profile);
      expect(result.data?.session).toBeDefined();
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: command.email,
        password: command.password,
        options: {
          data: {
            fire_department_id: command.profile.fire_department_id,
            first_name: command.profile.first_name,
            last_name: command.profile.last_name,
            role: command.profile.role
          }
        }
      });
    });

    it('should return error when fire department does not exist', async () => {
      // Arrange
      const command: RegisterUserCommand = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        profile: {
          fire_department_id: 'non-existent-id',
          first_name: 'John',
          last_name: 'Doe',
          role: 'member'
        }
      };

      // Mock fire department not found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      // Act
      const result = await authService.registerUser(command);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('FIRE_DEPARTMENT_NOT_FOUND');
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
    });

    it('should return error when email already exists', async () => {
      // Arrange
      const command: RegisterUserCommand = {
        email: 'existing@example.com',
        password: 'StrongPass123!',
        profile: {
          fire_department_id: testData.fireDepartment.id,
          first_name: 'John',
          last_name: 'Doe',
          role: 'member'
        }
      };

      // Mock successful fire department validation
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: testData.fireDepartment.id },
          error: null
        })
      });

      // Mock email already exists error
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      });

      // Act
      const result = await authService.registerUser(command);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const command: RegisterUserCommand = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        profile: {
          fire_department_id: testData.fireDepartment.id,
          first_name: 'John',
          last_name: 'Doe',
          role: 'member'
        }
      };

      // Mock unexpected error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act
      const result = await authService.registerUser(command);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database connection failed');
    });
  });

  describe('loginUser', () => {
    it('should successfully login user with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'StrongPass123!';

      // Mock successful auth login
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: testData.user,
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_at: Date.now() + 3600,
            expires_in: 3600
          }
        },
        error: null
      });

      // Mock profile fetch
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: testData.profile,
          error: null
        })
      });

      // Act
      const result = await authService.loginUser(email, password);

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.user).toEqual(testData.user);
      expect(result.data?.profile).toEqual(testData.profile);
      expect(result.data?.session).toBeDefined();
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password
      });
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong-password';

      // Mock invalid credentials error
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      // Act
      const result = await authService.loginUser(email, password);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('INVALID_CREDENTIALS');
    });

    it('should return error when profile is not found', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'StrongPass123!';

      // Mock successful auth login
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: testData.user,
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_at: Date.now() + 3600,
            expires_in: 3600
          }
        },
        error: null
      });

      // Mock profile not found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' }
        })
      });

      // Act
      const result = await authService.loginUser(email, password);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Profile not found');
    });

    it('should handle unexpected errors during login', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'StrongPass123!';

      // Mock unexpected error
      mockSupabaseClient.auth.signInWithPassword.mockImplementation(() => {
        throw new Error('Network error');
      });

      // Act
      const result = await authService.loginUser(email, password);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Network error');
    });
  });
});
