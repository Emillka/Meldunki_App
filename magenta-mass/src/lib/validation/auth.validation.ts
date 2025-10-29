import type { RegisterRequestDTO, UpdateProfileRequestDTO } from '../types';

/**
 * Wynik walidacji z listą błędów
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Waliduje dane wejściowe dla rejestracji użytkownika
 * 
 * @param data - Dane do walidacji (unknown type dla bezpieczeństwa)
 * @returns Obiekt z informacją czy dane są poprawne i listą błędów
 * 
 * @example
 * ```typescript
 * const validation = validateRegisterRequest(requestBody);
 * if (!validation.valid) {
 *   return errorResponse(400, 'VALIDATION_ERROR', 'Invalid input', validation.errors);
 * }
 * ```
 */
export function validateRegisterRequest(
  data: unknown
): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Type guard - sprawdzenie czy data jest obiektem
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _general: 'Invalid request body' } };
  }
  
  const dto = data as Partial<RegisterRequestDTO>;
  
  // Email validation
  if (!dto.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(dto.email)) {
    errors.email = 'Invalid email format';
  }
  
  // Password validation
  if (!dto.password) {
    errors.password = 'Password is required';
  } else {
    const passwordCheck = validatePasswordStrength(dto.password);
    if (!passwordCheck.valid) {
      errors.password = passwordCheck.errors.join('; ');
    }
  }
  
  // Fire department name validation
  if (!dto.fire_department_name) {
    errors.fire_department_name = 'Fire department name is required';
  } else if (dto.fire_department_name.trim().length < 3) {
    errors.fire_department_name = 'Fire department name must be at least 3 characters';
  } else if (dto.fire_department_name.length > 255) {
    errors.fire_department_name = 'Fire department name must not exceed 255 characters';
  }
  
  // First name validation (optional)
  if (dto.first_name && dto.first_name.length > 100) {
    errors.first_name = 'First name must not exceed 100 characters';
  }
  
  // Last name validation (optional)
  if (dto.last_name && dto.last_name.length > 100) {
    errors.last_name = 'Last name must not exceed 100 characters';
  }
  
  // Role validation (optional)
  if (dto.role && !['member', 'admin'].includes(dto.role)) {
    errors.role = 'Role must be either "member" or "admin"';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Waliduje format email zgodnie z RFC 5322 (simplified)
 * 
 * @param email - Adres email do walidacji
 * @returns true jeśli email jest poprawny
 * 
 * @example
 * ```typescript
 * validateEmail('test@example.com') // true
 * validateEmail('invalid') // false
 * ```
 */
export function validateEmail(email: string): boolean {
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Waliduje siłę hasła zgodnie z wymaganiami bezpieczeństwa
 * 
 * Wymagania:
 * - Min. 8 znaków
 * - Zawiera wielką literę
 * - Zawiera małą literę
 * - Zawiera cyfrę
 * - Zawiera znak specjalny
 * 
 * @param password - Hasło do walidacji
 * @returns Obiekt z informacją czy hasło jest silne i listą błędów
 * 
 * @example
 * ```typescript
 * const result = validatePasswordStrength('StrongPass123!');
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Must contain number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Must contain special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Waliduje format UUID (any version)
 * 
 * @param uuid - String UUID do walidacji
 * @returns true jeśli UUID jest poprawny
 * 
 * @example
 * ```typescript
 * validateUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * validateUUID('invalid-uuid') // false
 * ```
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Waliduje dane wejściowe dla aktualizacji profilu
 * 
 * @param data - Dane do walidacji (unknown type dla bezpieczeństwa)
 * @returns Obiekt z informacją czy dane są poprawne i listą błędów
 * 
 * @example
 * ```typescript
 * const validation = validateUpdateProfileRequest(requestBody);
 * if (!validation.valid) {
 *   return errorResponse(400, 'VALIDATION_ERROR', 'Invalid input', validation.errors);
 * }
 * ```
 */
export function validateUpdateProfileRequest(
  data: unknown
): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Type guard - sprawdzenie czy data jest obiektem
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _general: 'Invalid request body' } };
  }
  
  const dto = data as Partial<UpdateProfileRequestDTO>;
  
  // First name validation (optional, can be empty string)
  if (dto.first_name !== undefined) {
    if (dto.first_name !== null && typeof dto.first_name !== 'string') {
      errors.first_name = 'First name must be a string';
    } else if (typeof dto.first_name === 'string' && dto.first_name.length > 100) {
      errors.first_name = 'First name must not exceed 100 characters';
    }
  }
  
  // Last name validation (optional, can be empty string)
  if (dto.last_name !== undefined) {
    if (dto.last_name !== null && typeof dto.last_name !== 'string') {
      errors.last_name = 'Last name must be a string';
    } else if (typeof dto.last_name === 'string' && dto.last_name.length > 100) {
      errors.last_name = 'Last name must not exceed 100 characters';
    }
  }
  
  // At least one field must be provided
  if (dto.first_name === undefined && dto.last_name === undefined) {
    errors._general = 'At least one field (first_name or last_name) must be provided';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanityzuje string usuwając potencjalnie niebezpieczne znaki (XSS prevention)
 * 
 * @param input - String do sanityzacji (może być null/undefined)
 * @returns Oczyszczony string lub null
 * 
 * @example
 * ```typescript
 * sanitizeString('  John<script>alert(1)</script>  ') // 'Johnscriptalert(1)/script'
 * sanitizeString(null) // null
 * ```
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  if (trimmed === '') return '';
  return trimmed
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 255); // Limit length
}

