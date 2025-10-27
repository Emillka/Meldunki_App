import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset all limits before each test
    rateLimiter.resetAll();
  });

  describe('check', () => {
    it('should allow first request', () => {
      // Act
      const result = rateLimiter.check('test-key', 5, 60000);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it('should allow requests within limit', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 3;
      const windowMs = 60000;

      // Act & Assert
      for (let i = 0; i < maxRequests; i++) {
        const result = rateLimiter.check(key, maxRequests, windowMs);
        expect(result.allowed).toBe(true);
        expect(result.retryAfter).toBeUndefined();
      }
    });

    it('should block requests when limit exceeded', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 2;
      const windowMs = 60000;

      // Act - Make requests up to limit
      for (let i = 0; i < maxRequests; i++) {
        const result = rateLimiter.check(key, maxRequests, windowMs);
        expect(result.allowed).toBe(true);
      }

      // Act - Try to exceed limit
      const result = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(typeof result.retryAfter).toBe('number');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset window after time expires', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 1;
      const windowMs = 100; // Very short window

      // Act - Make request
      const result1 = rateLimiter.check(key, maxRequests, windowMs);
      expect(result1.allowed).toBe(true);

      // Act - Try to exceed limit immediately
      const result2 = rateLimiter.check(key, maxRequests, windowMs);
      expect(result2.allowed).toBe(false);

      // Act - Wait for window to expire and try again
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result3 = rateLimiter.check(key, maxRequests, windowMs);
          expect(result3.allowed).toBe(true);
          resolve();
        }, windowMs + 10);
      });
    });

    it('should handle different keys independently', () => {
      // Arrange
      const key1 = 'key-1';
      const key2 = 'key-2';
      const maxRequests = 1;
      const windowMs = 60000;

      // Act - Use up limit for key1
      const result1 = rateLimiter.check(key1, maxRequests, windowMs);
      expect(result1.allowed).toBe(true);

      const result2 = rateLimiter.check(key1, maxRequests, windowMs);
      expect(result2.allowed).toBe(false);

      // Act - Use limit for key2 (should be independent)
      const result3 = rateLimiter.check(key2, maxRequests, windowMs);
      expect(result3.allowed).toBe(true);
    });

    it('should calculate correct retry after time', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 1;
      const windowMs = 5000; // 5 seconds

      // Act - Use up limit
      rateLimiter.check(key, maxRequests, windowMs);
      const result = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(5);
    });

    it('should handle zero maxRequests', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 0;
      const windowMs = 60000;

      // Act
      const result = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it('should handle negative maxRequests', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = -1;
      const windowMs = 60000;

      // Act
      const result = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 1;
      const windowMs = 100; // Very short window

      // Act - Create an entry
      rateLimiter.check(key, maxRequests, windowMs);

      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Act - Cleanup
          rateLimiter.cleanup();

          // Act - Try to use the key again (should be treated as new)
          const result = rateLimiter.check(key, maxRequests, windowMs);

          // Assert
          expect(result.allowed).toBe(true);
          resolve();
        }, windowMs + 10);
      });
    });

    it('should not remove non-expired entries', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 1;
      const windowMs = 60000; // Long window

      // Act - Create an entry
      rateLimiter.check(key, maxRequests, windowMs);

      // Act - Cleanup immediately
      rateLimiter.cleanup();

      // Act - Try to use the key again (should still be limited)
      const result = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result.allowed).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset specific key', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 1;
      const windowMs = 60000;

      // Act - Use up limit
      rateLimiter.check(key, maxRequests, windowMs);
      const result1 = rateLimiter.check(key, maxRequests, windowMs);
      expect(result1.allowed).toBe(false);

      // Act - Reset the key
      rateLimiter.reset(key);

      // Act - Try again
      const result2 = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result2.allowed).toBe(true);
    });

    it('should not affect other keys when resetting one', () => {
      // Arrange
      const key1 = 'key-1';
      const key2 = 'key-2';
      const maxRequests = 1;
      const windowMs = 60000;

      // Act - Use up limits for both keys
      rateLimiter.check(key1, maxRequests, windowMs);
      rateLimiter.check(key2, maxRequests, windowMs);

      const result1 = rateLimiter.check(key1, maxRequests, windowMs);
      const result2 = rateLimiter.check(key2, maxRequests, windowMs);
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(false);

      // Act - Reset only key1
      rateLimiter.reset(key1);

      // Act - Check both keys
      const result3 = rateLimiter.check(key1, maxRequests, windowMs);
      const result4 = rateLimiter.check(key2, maxRequests, windowMs);

      // Assert
      expect(result3.allowed).toBe(true); // Reset
      expect(result4.allowed).toBe(false); // Still limited
    });
  });

  describe('resetAll', () => {
    it('should reset all keys', () => {
      // Arrange
      const key1 = 'key-1';
      const key2 = 'key-2';
      const maxRequests = 1;
      const windowMs = 60000;

      // Act - Use up limits for both keys
      rateLimiter.check(key1, maxRequests, windowMs);
      rateLimiter.check(key2, maxRequests, windowMs);

      const result1 = rateLimiter.check(key1, maxRequests, windowMs);
      const result2 = rateLimiter.check(key2, maxRequests, windowMs);
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(false);

      // Act - Reset all
      rateLimiter.resetAll();

      // Act - Check both keys
      const result3 = rateLimiter.check(key1, maxRequests, windowMs);
      const result4 = rateLimiter.check(key2, maxRequests, windowMs);

      // Assert
      expect(result3.allowed).toBe(true);
      expect(result4.allowed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty key', () => {
      // Act
      const result = rateLimiter.check('', 5, 60000);

      // Assert
      expect(result.allowed).toBe(true);
    });

    it('should handle very large windowMs', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 1;
      const windowMs = Number.MAX_SAFE_INTEGER;

      // Act
      const result1 = rateLimiter.check(key, maxRequests, windowMs);
      const result2 = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);
    });

    it('should handle zero windowMs', () => {
      // Arrange
      const key = 'test-key';
      const maxRequests = 5;
      const windowMs = 0;

      // Act
      const result1 = rateLimiter.check(key, maxRequests, windowMs);
      const result2 = rateLimiter.check(key, maxRequests, windowMs);

      // Assert
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true); // Window expires immediately
    });
  });
});
