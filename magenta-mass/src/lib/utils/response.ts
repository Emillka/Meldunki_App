import type { ApiSuccessResponse, ApiErrorResponse, ErrorCode } from '../types';

/**
 * Tworzy standardową odpowiedź sukcesu dla API
 * 
 * @param data - Dane do zwrócenia w odpowiedzi
 * @param message - Opcjonalna wiadomość opisująca sukces
 * @param status - Kod statusu HTTP (domyślnie 200)
 * @returns Response object z JSON body
 * 
 * @example
 * ```typescript
 * return successResponse(
 *   { user: userData },
 *   'User created successfully',
 *   201
 * );
 * ```
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Tworzy standardową odpowiedź błędu dla API
 * 
 * @param status - Kod statusu HTTP (400, 404, 409, 429, 500, etc.)
 * @param code - Standardowy kod błędu z ErrorCode enum
 * @param message - Czytelna wiadomość błędu dla użytkownika
 * @param details - Opcjonalne szczegóły błędu (np. validation errors)
 * @returns Response object z JSON error body
 * 
 * @example
 * ```typescript
 * return errorResponse(
 *   400,
 *   'VALIDATION_ERROR',
 *   'Invalid input data',
 *   { email: 'Invalid email format' }
 * );
 * ```
 */
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

