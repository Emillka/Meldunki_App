import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// Test utilities for common testing patterns

/**
 * Mock Supabase client for testing
 */
export const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};

/**
 * Test data factories
 */
export const testData = {
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
  },
  profile: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    fire_department_id: '550e8400-e29b-41d4-a716-446655440001',
    first_name: 'John',
    last_name: 'Doe',
    role: 'member',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  fireDepartment: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'OSP Test',
    city: 'Test City',
    created_at: '2024-01-01T00:00:00Z',
  },
  meldunek: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    date: '2024-01-01',
    shift: 'day',
    status: 'present',
    created_at: '2024-01-01T00:00:00Z',
  },
};

/**
 * Mock API responses
 */
export const mockApiResponses = {
  success: (data: any) => ({
    data,
    error: null,
  }),
  error: (message: string) => ({
    data: null,
    error: { message },
  }),
};

/**
 * Test environment setup
 */
export const setupTestEnvironment = () => {
  // Mock environment variables
  vi.stubEnv('PUBLIC_SUPABASE_URL', 'http://localhost:54321');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
  vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
};

/**
 * Cleanup after tests
 */
export const cleanupTestEnvironment = () => {
  cleanup();
  vi.unstubAllEnvs();
};

/**
 * Custom render function with providers
 */
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui);
};

/**
 * Wait for async operations
 */
export const waitForAsync = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock fetch for API testing
 */
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  });
};

/**
 * Test form data
 */
export const testFormData = {
  validRegister: {
    email: 'test@example.com',
    password: 'StrongPass123!',
    fire_department_id: '550e8400-e29b-41d4-a716-446655440001',
    first_name: 'John',
    last_name: 'Doe',
    role: 'member',
  },
  invalidRegister: {
    email: 'invalid-email',
    password: 'weak',
    fire_department_id: 'invalid-uuid',
  },
  validLogin: {
    email: 'test@example.com',
    password: 'StrongPass123!',
  },
  invalidLogin: {
    email: 'test@example.com',
    password: 'wrong-password',
  },
  validMeldunek: {
    date: '2024-01-01',
    shift: 'day',
    status: 'present',
  },
  invalidMeldunek: {
    date: '',
    shift: '',
    status: '',
  },
};
