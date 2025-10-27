import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse } from '../response';
import type { ErrorCode } from '../../types';

describe('response utilities', () => {
  describe('successResponse', () => {
    it('should create success response with data only', async () => {
      // Arrange
      const data = { id: 1, name: 'Test' };

      // Act
      const response = successResponse(data);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data
      });
    });

    it('should create success response with data and message', async () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      const message = 'Operation successful';

      // Act
      const response = successResponse(data, message);

      // Assert
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data,
        message
      });
    });

    it('should create success response with custom status', async () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      const message = 'Created successfully';
      const status = 201;

      // Act
      const response = successResponse(data, message, status);

      // Assert
      expect(response.status).toBe(201);
      
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data,
        message
      });
    });

    it('should handle null data', async () => {
      // Act
      const response = successResponse(null);

      // Assert
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: null
      });
    });

    it('should handle undefined data', async () => {
      // Act
      const response = successResponse(undefined);

      // Assert
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: undefined
      });
    });

    it('should handle complex data structures', async () => {
      // Arrange
      const data = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ],
        pagination: {
          page: 1,
          total: 2
        }
      };

      // Act
      const response = successResponse(data);

      // Assert
      const body = await response.json();
      expect(body.data).toEqual(data);
    });

    it('should handle empty string message', async () => {
      // Arrange
      const data = { id: 1 };
      const message = '';

      // Act
      const response = successResponse(data, message);

      // Assert
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data
      });
      expect(body.message).toBeUndefined();
    });
  });

  describe('errorResponse', () => {
    it('should create error response with required fields', async () => {
      // Arrange
      const status = 400;
      const code: ErrorCode = 'VALIDATION_ERROR';
      const message = 'Invalid input data';

      // Act
      const response = errorResponse(status, code, message);

      // Assert
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: {
          code,
          message
        }
      });
    });

    it('should create error response with details', async () => {
      // Arrange
      const status = 400;
      const code: ErrorCode = 'VALIDATION_ERROR';
      const message = 'Validation failed';
      const details = {
        email: 'Invalid email format',
        password: 'Password too weak'
      };

      // Act
      const response = errorResponse(status, code, message, details);

      // Assert
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: {
          code,
          message,
          details
        }
      });
    });

    it('should handle different error codes', async () => {
      // Test various error codes
      const errorCodes: ErrorCode[] = [
        'VALIDATION_ERROR',
        'AUTHENTICATION_ERROR',
        'AUTHORIZATION_ERROR',
        'NOT_FOUND',
        'CONFLICT',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR'
      ];

      for (const code of errorCodes) {
        // Act
        const response = errorResponse(400, code, 'Test error');

        // Assert
        expect(response.status).toBe(400);
        
        const body = await response.json();
        expect(body.error.code).toBe(code);
      }
    });

    it('should handle different status codes', async () => {
      // Test various status codes
      const statusCodes = [400, 401, 403, 404, 409, 429, 500];

      for (const status of statusCodes) {
        // Act
        const response = errorResponse(status, 'INTERNAL_SERVER_ERROR', 'Test error');

        // Assert
        expect(response.status).toBe(status);
      }
    });

    it('should handle complex details object', async () => {
      // Arrange
      const status = 400;
      const code: ErrorCode = 'VALIDATION_ERROR';
      const message = 'Multiple validation errors';
      const details = {
        user: {
          email: 'Invalid format',
          password: 'Too short'
        },
        profile: {
          firstName: 'Required field',
          lastName: 'Required field'
        },
        nested: {
          deep: {
            error: 'Deep validation error'
          }
        }
      };

      // Act
      const response = errorResponse(status, code, message, details);

      // Assert
      const body = await response.json();
      expect(body.error.details).toEqual(details);
    });

    it('should handle empty details', async () => {
      // Arrange
      const status = 500;
      const code: ErrorCode = 'INTERNAL_SERVER_ERROR';
      const message = 'Something went wrong';

      // Act
      const response = errorResponse(status, code, message, {});

      // Assert
      const body = await response.json();
      expect(body.error.details).toEqual({});
    });

    it('should handle null details', async () => {
      // Arrange
      const status = 500;
      const code: ErrorCode = 'INTERNAL_SERVER_ERROR';
      const message = 'Something went wrong';

      // Act
      const response = errorResponse(status, code, message, null as any);

      // Assert
      const body = await response.json();
      expect(body.error.details).toBeUndefined();
    });

    it('should handle undefined details', async () => {
      // Arrange
      const status = 500;
      const code: ErrorCode = 'INTERNAL_SERVER_ERROR';
      const message = 'Something went wrong';

      // Act
      const response = errorResponse(status, code, message, undefined as any);

      // Assert
      const body = await response.json();
      expect(body.error.details).toBeUndefined();
    });

    it('should handle special characters in message', async () => {
      // Arrange
      const status = 400;
      const code: ErrorCode = 'VALIDATION_ERROR';
      const message = 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      // Act
      const response = errorResponse(status, code, message);

      // Assert
      const body = await response.json();
      expect(body.error.message).toBe(message);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const status = 400;
      const code: ErrorCode = 'VALIDATION_ERROR';
      const message = 'Błąd z polskimi znakami: ąćęłńóśźż';

      // Act
      const response = errorResponse(status, code, message);

      // Assert
      const body = await response.json();
      expect(body.error.message).toBe(message);
    });
  });

  describe('response headers', () => {
    it('should set correct Content-Type header for success response', () => {
      // Act
      const response = successResponse({ test: 'data' });

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should set correct Content-Type header for error response', () => {
      // Act
      const response = errorResponse(400, 'VALIDATION_ERROR', 'Test error');

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should not set additional headers', () => {
      // Act
      const successResp = successResponse({ test: 'data' });
      const errorResp = errorResponse(400, 'VALIDATION_ERROR', 'Test error');

      // Assert
      expect(successResp.headers.get('Cache-Control')).toBeNull();
      expect(successResp.headers.get('Authorization')).toBeNull();
      expect(errorResp.headers.get('Cache-Control')).toBeNull();
      expect(errorResp.headers.get('Authorization')).toBeNull();
    });
  });

  describe('JSON serialization', () => {
    it('should properly serialize dates in success response', async () => {
      // Arrange
      const data = {
        id: 1,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T11:00:00Z')
      };

      // Act
      const response = successResponse(data);

      // Assert
      const body = await response.json();
      expect(body.data.createdAt).toBe('2024-01-15T10:00:00.000Z');
      expect(body.data.updatedAt).toBe('2024-01-15T11:00:00.000Z');
    });

    it('should properly serialize dates in error details', async () => {
      // Arrange
      const details = {
        timestamp: new Date('2024-01-15T10:00:00Z'),
        errors: ['Error 1', 'Error 2']
      };

      // Act
      const response = errorResponse(400, 'VALIDATION_ERROR', 'Test error', details);

      // Assert
      const body = await response.json();
      expect(body.error.details.timestamp).toBe('2024-01-15T10:00:00.000Z');
      expect(body.error.details.errors).toEqual(['Error 1', 'Error 2']);
    });
  });
});
