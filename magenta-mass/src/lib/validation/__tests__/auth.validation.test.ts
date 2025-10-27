import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePasswordStrength,
  validateUUID,
  validateRegisterRequest,
  sanitizeString
} from '@/lib/validation/auth.validation';

describe('Auth Validation Functions', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should reject emails longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const result = validatePasswordStrength('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords without uppercase letter', () => {
      const result = validatePasswordStrength('weakpass123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain uppercase letter');
    });

    it('should reject passwords without lowercase letter', () => {
      const result = validatePasswordStrength('WEAKPASS123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain lowercase letter');
    });

    it('should reject passwords without number', () => {
      const result = validatePasswordStrength('WeakPass!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain number');
    });

    it('should reject passwords without special character', () => {
      const result = validatePasswordStrength('WeakPass123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain special character');
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('Weak1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must be at least 8 characters');
    });

    it('should collect multiple errors', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUID v4', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validateUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(validateUUID('invalid-uuid')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(validateUUID('')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings with HTML tags', () => {
      expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
      expect(sanitizeString('Hello<script>world</script>')).toBe('Helloscriptworld/script');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should limit string length to 255 characters', () => {
      const longString = 'a'.repeat(300);
      const result = sanitizeString(longString);
      expect(result).toHaveLength(255);
    });

    it('should handle null and undefined', () => {
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(null);
    });
  });

  describe('validateRegisterRequest', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member'
      };

      const result = validateRegisterRequest(validData);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject invalid request body', () => {
      const result = validateRegisterRequest(null);
      expect(result.valid).toBe(false);
      expect(result.errors._general).toBe('Invalid request body');
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: '',
        password: '',
        fire_department_id: ''
      };

      const result = validateRegisterRequest(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBe('Email is required');
      expect(result.errors.password).toBe('Password is required');
      expect(result.errors.fire_department_id).toBe('Fire department ID is required');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = validateRegisterRequest(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBe('Invalid email format');
    });

    it('should reject weak passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = validateRegisterRequest(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.password).toContain('Must be at least 8 characters');
    });

    it('should reject invalid fire department ID format', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_id: 'invalid-uuid'
      };

      const result = validateRegisterRequest(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.fire_department_id).toBe('Invalid fire department ID format');
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000',
        role: 'invalid-role'
      };

      const result = validateRegisterRequest(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.role).toBe('Role must be either "member" or "admin"');
    });

    it('should reject names longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: longName,
        last_name: longName
      };

      const result = validateRegisterRequest(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.first_name).toBe('First name must not exceed 100 characters');
      expect(result.errors.last_name).toBe('Last name must not exceed 100 characters');
    });
  });
});