import { describe, it, expect } from 'vitest';
import {
  validateRegisterRequest,
  validateEmail,
  validatePasswordStrength,
  validateUUID,
  sanitizeString
} from '../auth.validation';
import type { RegisterRequestDTO } from '../../types';

describe('auth.validation', () => {
  describe('validateRegisterRequest', () => {
    it('should validate valid registration data', () => {
      // Arrange
      const validData: RegisterRequestDTO = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_name: 'OSP Test Warszawa',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member'
      };

      // Act
      const result = validateRegisterRequest(validData);

      // Assert
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject invalid request body', () => {
      // Arrange
      const invalidData = null;

      // Act
      const result = validateRegisterRequest(invalidData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors._general).toBe('Invalid request body');
    });

    it('should reject non-object data', () => {
      // Arrange
      const invalidData = 'not an object';

      // Act
      const result = validateRegisterRequest(invalidData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors._general).toBe('Invalid request body');
    });

    it('should validate email field', () => {
      // Test missing email
      const dataWithoutEmail = {
        password: 'StrongPass123!',
        fire_department_name: 'OSP Test Warszawa',
      };
      const result1 = validateRegisterRequest(dataWithoutEmail);
      expect(result1.valid).toBe(false);
      expect(result1.errors.email).toBe('Email is required');

      // Test invalid email format
      const dataWithInvalidEmail = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        fire_department_name: 'OSP Test Warszawa',
      };
      const result2 = validateRegisterRequest(dataWithInvalidEmail);
      expect(result2.valid).toBe(false);
      expect(result2.errors.email).toBe('Invalid email format');
    });

    it('should validate password field', () => {
      // Test missing password
      const dataWithoutPassword = {
        email: 'test@example.com',
        fire_department_name: 'OSP Test Warszawa',
      };
      const result1 = validateRegisterRequest(dataWithoutPassword);
      expect(result1.valid).toBe(false);
      expect(result1.errors.password).toBe('Password is required');

      // Test weak password
      const dataWithWeakPassword = {
        email: 'test@example.com',
        password: 'weak',
        fire_department_name: 'OSP Test Warszawa',
      };
      const result2 = validateRegisterRequest(dataWithWeakPassword);
      expect(result2.valid).toBe(false);
      expect(result2.errors.password).toContain('Must be at least 8 characters');
    });

    it('should validate fire_department_name field', () => {
      // Test missing fire_department_name
      const dataWithoutFireDept = {
        email: 'test@example.com',
        password: 'StrongPass123!'
      };
      const result1 = validateRegisterRequest(dataWithoutFireDept);
      expect(result1.valid).toBe(false);
      expect(result1.errors.fire_department_name).toBe('Fire department name is required');

      // Test too short name
      const dataWithShortName = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_name: 'AB'
      };
      const result2 = validateRegisterRequest(dataWithShortName);
      expect(result2.valid).toBe(false);
      expect(result2.errors.fire_department_name).toBe('Fire department name must be at least 3 characters');

      // Test too long name
      const dataWithLongName = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_name: 'A'.repeat(256)
      };
      const result3 = validateRegisterRequest(dataWithLongName);
      expect(result3.valid).toBe(false);
      expect(result3.errors.fire_department_name).toBe('Fire department name must not exceed 255 characters');
    });

    it('should validate optional fields', () => {
      // Test first_name too long
      const dataWithLongFirstName = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_name: 'OSP Test Warszawa',
        first_name: 'a'.repeat(101)
      };
      const result1 = validateRegisterRequest(dataWithLongFirstName);
      expect(result1.valid).toBe(false);
      expect(result1.errors.first_name).toBe('First name must not exceed 100 characters');

      // Test last_name too long
      const dataWithLongLastName = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_name: 'OSP Test Warszawa',
        last_name: 'a'.repeat(101)
      };
      const result2 = validateRegisterRequest(dataWithLongLastName);
      expect(result2.valid).toBe(false);
      expect(result2.errors.last_name).toBe('Last name must not exceed 100 characters');

      // Test invalid role
      const dataWithInvalidRole = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_name: 'OSP Test Warszawa',
        role: 'invalid-role'
      };
      const result3 = validateRegisterRequest(dataWithInvalidRole);
      expect(result3.valid).toBe(false);
      expect(result3.errors.role).toBe('Role must be either "member" or "admin"');
    });

    it('should accept valid optional fields', () => {
      // Test valid optional fields
      const dataWithValidOptionals = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        fire_department_name: 'OSP Test Warszawa',
        first_name: 'John',
        last_name: 'Doe',
        role: 'admin'
      };
      const result = validateRegisterRequest(dataWithValidOptionals);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        '123@test.com',
        'a@b.c'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        '',
        'test@.com',
        'test@example.',
        'test space@example.com',
        'a'.repeat(250) + '@example.com' // Too long
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should reject emails longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure1@',
        'ComplexP@ssw0rd',
        'Test123#',
        'Password1$'
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      // Test too short
      const result1 = validatePasswordStrength('Short1!');
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('Must be at least 8 characters');

      // Test no uppercase
      const result2 = validatePasswordStrength('lowercase123!');
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('Must contain uppercase letter');

      // Test no lowercase
      const result3 = validatePasswordStrength('UPPERCASE123!');
      expect(result3.valid).toBe(false);
      expect(result3.errors).toContain('Must contain lowercase letter');

      // Test no number
      const result4 = validatePasswordStrength('NoNumbers!');
      expect(result4.valid).toBe(false);
      expect(result4.errors).toContain('Must contain number');

      // Test no special character
      const result5 = validatePasswordStrength('NoSpecial123');
      expect(result5.valid).toBe(false);
      expect(result5.errors).toContain('Must contain special character');
    });

    it('should return multiple errors for passwords failing multiple criteria', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Must be at least 8 characters');
      expect(result.errors).toContain('Must contain uppercase letter');
      expect(result.errors).toContain('Must contain number');
      expect(result.errors).toContain('Must contain special character');
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUID v4 formats', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
      ];

      validUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'invalid-uuid',
        '550e8400-e29b-41d4-a716-44665544000', // Too short
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
        '550e8400-e29b-41d4-a716-44665544000g', // Invalid character
        '550e8400-e29b-41d4-a716', // Missing parts
        '550e8400-e29b-41d4-a716-446655440000-extra', // Extra parts
        '',
        'not-a-uuid-at-all'
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      const upperCaseUUID = '550E8400-E29B-41D4-A716-446655440000';
      const lowerCaseUUID = '550e8400-e29b-41d4-a716-446655440000';
      
      expect(validateUUID(upperCaseUUID)).toBe(true);
      expect(validateUUID(lowerCaseUUID)).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings with HTML tags', () => {
      const input = '  John<script>alert(1)</script>  ';
      const result = sanitizeString(input);
      expect(result).toBe('Johnscriptalert(1)/script');
    });

    it('should trim whitespace', () => {
      const input = '  Test String  ';
      const result = sanitizeString(input);
      expect(result).toBe('Test String');
    });

    it('should limit string length to 255 characters', () => {
      const longInput = 'a'.repeat(300);
      const result = sanitizeString(longInput);
      expect(result).toHaveLength(255);
      expect(result).toBe('a'.repeat(255));
    });

    it('should handle null input', () => {
      const result = sanitizeString(null);
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = sanitizeString(undefined);
      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });

    it('should remove angle brackets', () => {
      const input = 'Test <tag> content';
      const result = sanitizeString(input);
      expect(result).toBe('Test tag content');
    });

    it('should preserve valid content', () => {
      const input = 'Valid content with numbers 123 and symbols !@#';
      const result = sanitizeString(input);
      expect(result).toBe('Valid content with numbers 123 and symbols !@#');
    });
  });
});