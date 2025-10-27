/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 * 
 * This file contains all type definitions for API requests and responses,
 * derived from the database models defined in database.types.ts
 * 
 * @see src/lib/db/database.types.ts for base database types
 */

import type { Database } from './db/database.types';

// ============================================================================
// BASE DATABASE ENTITY TYPES
// ============================================================================

// Extract base entity types from database schema
type DbProvince = Database['public']['Tables']['provinces']['Row'];
type DbProvinceInsert = Database['public']['Tables']['provinces']['Insert'];
type DbProvinceUpdate = Database['public']['Tables']['provinces']['Update'];

type DbCounty = Database['public']['Tables']['counties']['Row'];
type DbCountyInsert = Database['public']['Tables']['counties']['Insert'];
type DbCountyUpdate = Database['public']['Tables']['counties']['Update'];

type DbFireDepartment = Database['public']['Tables']['fire_departments']['Row'];
type DbFireDepartmentInsert = Database['public']['Tables']['fire_departments']['Insert'];
type DbFireDepartmentUpdate = Database['public']['Tables']['fire_departments']['Update'];

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type DbProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type DbIncident = Database['public']['Tables']['incidents']['Row'];
type DbIncidentInsert = Database['public']['Tables']['incidents']['Insert'];
type DbIncidentUpdate = Database['public']['Tables']['incidents']['Update'];

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================

/**
 * Generic API success response wrapper
 * Used for all successful API responses
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API error response structure
 * Used for all error responses with consistent error format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Standard error codes used across the API
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EMAIL_ALREADY_EXISTS'
  | 'FIRE_DEPARTMENT_NOT_FOUND'
  | 'PROVINCE_NOT_FOUND'
  | 'COUNTY_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'INCIDENT_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'TOO_MANY_REQUESTS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'SERVICE_UNAVAILABLE';

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Session information containing JWT tokens
 * Based on Supabase Auth session structure
 */
export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

/**
 * Basic user information
 * Represents the auth.users table data exposed to clients
 */
export interface UserDTO {
  id: string;
  email: string;
  created_at?: string;
}

// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Request body for user registration
 * POST /api/auth/register
 */
export interface RegisterRequestDTO {
  email: string;
  password: string;
  fire_department_name: string;
  first_name?: string;
  last_name?: string;
  role?: 'member' | 'admin';
}

/**
 * Response data for successful registration
 * POST /api/auth/register
 */
export interface RegisterResponseDTO {
  user: UserDTO;
  profile: ProfileDTO;
  session: SessionDTO;
}

/**
 * Request body for user login
 * POST /api/auth/login
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Response data for successful login
 * POST /api/auth/login
 */
export interface LoginResponseDTO {
  user: UserDTO;
  session: SessionDTO;
  profile: ProfileDTO;
}

/**
 * Request body for token refresh
 * POST /api/auth/refresh
 */
export interface RefreshTokenRequestDTO {
  refresh_token: string;
}

/**
 * Response data for successful token refresh
 * POST /api/auth/refresh
 */
export interface RefreshTokenResponseDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

/**
 * Response data for GET /api/auth/me
 * Contains complete user context with nested relationships
 */
export interface AuthMeResponseDTO {
  user: UserDTO;
  profile: ProfileDTO;
  fire_department: FireDepartmentDetailDTO;
}

// ============================================================================
// PROVINCE DTOs (Reference Data)
// ============================================================================

/**
 * Province DTO - represents a Polish province (województwo)
 * Directly maps to provinces table Row type
 */
export type ProvinceDTO = DbProvince;

/**
 * Response for GET /api/provinces
 */
export interface ProvincesListResponseDTO {
  data: ProvinceDTO[];
  count: number;
}

// ============================================================================
// COUNTY DTOs (Reference Data)
// ============================================================================

/**
 * County DTO - represents a county (powiat)
 * Directly maps to counties table Row type
 */
export type CountyDTO = DbCounty;

/**
 * County with nested province information
 * Used in fire department details responses
 */
export interface CountyWithProvinceDTO extends Omit<DbCounty, 'province_id'> {
  province: Pick<ProvinceDTO, 'id' | 'name'>;
}

/**
 * Response for GET /api/provinces/{province_id}/counties
 */
export interface CountiesListResponseDTO {
  data: CountyDTO[];
  count: number;
}

// ============================================================================
// FIRE DEPARTMENT DTOs (Reference Data)
// ============================================================================

/**
 * Basic fire department DTO
 * Directly maps to fire_departments table Row type
 */
export type FireDepartmentDTO = DbFireDepartment;

/**
 * Fire department with complete nested location hierarchy
 * Used in detailed views showing province > county > fire department
 */
export interface FireDepartmentDetailDTO extends Omit<DbFireDepartment, 'county_id'> {
  county: {
    id: string;
    name: string;
    province: {
      id: string;
      name: string;
    };
  };
}

/**
 * Simplified fire department reference
 * Used when fire department is included as a related entity
 */
export interface FireDepartmentRefDTO {
  id: string;
  name: string;
}

/**
 * Response for GET /api/counties/{county_id}/fire-departments
 */
export interface FireDepartmentsListResponseDTO {
  data: FireDepartmentDTO[];
  count: number;
}

/**
 * Response for GET /api/fire-departments/{id}
 */
export interface FireDepartmentDetailResponseDTO {
  data: FireDepartmentDetailDTO;
}

// ============================================================================
// PROFILE DTOs
// ============================================================================

/**
 * Basic profile DTO
 * Based on profiles table Row type with selected fields
 */
export type ProfileDTO = Pick<
  DbProfile,
  'id' | 'fire_department_id' | 'first_name' | 'last_name' | 'role' | 'created_at' | 'updated_at'
>;

/**
 * Profile with fire department reference
 * Used in profile list and detail views
 */
export interface ProfileWithFireDepartmentDTO extends ProfileDTO {
  fire_department: FireDepartmentRefDTO;
}

/**
 * Request body for updating user profile
 * PATCH /api/profiles/me
 * Only allows updating first_name and last_name
 */
export type UpdateProfileRequestDTO = Pick<DbProfileUpdate, 'first_name' | 'last_name'>;

/**
 * Response for GET /api/profiles/me
 */
export interface ProfileDetailResponseDTO {
  data: ProfileWithFireDepartmentDTO;
}

/**
 * Response for GET /api/profiles
 * Lists all profiles from the same fire department
 */
export interface ProfilesListResponseDTO {
  data: ProfileDTO[];
  count: number;
}

/**
 * User reference in incident responses
 * Minimal user info for incident creator
 */
export interface UserRefDTO {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

// ============================================================================
// INCIDENT DTOs
// ============================================================================

/**
 * Complete incident DTO with all fields
 * Directly maps to incidents table Row type
 */
export type IncidentDTO = DbIncident;

/**
 * Incident list item DTO
 * Used in paginated incident lists, includes creator information
 */
export interface IncidentListItemDTO extends DbIncident {
  user: UserRefDTO;
}

/**
 * Detailed incident DTO with all related entities
 * Used in GET /api/incidents/{id} response
 */
export interface IncidentDetailDTO extends DbIncident {
  user: UserRefDTO & { role: string };
  fire_department: FireDepartmentRefDTO;
}

/**
 * Request body for creating a new incident
 * POST /api/incidents
 * 
 * Based on Insert type, but excludes auto-generated fields:
 * - id (auto-generated UUID)
 * - created_at (auto-generated timestamp)
 * - updated_at (auto-generated timestamp)
 * - user_id (derived from authenticated user)
 * - fire_department_id (derived from user's profile)
 * - category (generated by AI)
 * - summary (generated by AI)
 */
export type CreateIncidentRequestDTO = Pick<
  DbIncidentInsert,
  | 'incident_date'
  | 'incident_name'
  | 'location_address'
  | 'location_latitude'
  | 'location_longitude'
  | 'description'
  | 'forces_and_resources'
  | 'commander'
  | 'driver'
  | 'start_time'
  | 'end_time'
>;

/**
 * Request body for updating an incident
 * PATCH /api/incidents/{id}
 * 
 * All fields are optional - only provided fields will be updated
 * Excludes system-managed fields (id, user_id, fire_department_id, created_at)
 */
export type UpdateIncidentRequestDTO = Partial<
  Pick<
    DbIncidentUpdate,
    | 'incident_date'
    | 'incident_name'
    | 'location_address'
    | 'location_latitude'
    | 'location_longitude'
    | 'description'
    | 'forces_and_resources'
    | 'commander'
    | 'driver'
    | 'start_time'
    | 'end_time'
  >
>;

/**
 * Response for GET /api/incidents (paginated list)
 */
export interface IncidentsListResponseDTO {
  data: IncidentListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * Response for GET /api/incidents/{id}
 */
export interface IncidentDetailResponseDTO {
  data: IncidentDetailDTO;
}

/**
 * Response for POST /api/incidents
 * Returns the created incident without populated AI fields
 */
export interface CreateIncidentResponseDTO {
  data: IncidentDTO;
  message: string;
}

/**
 * Response for PATCH /api/incidents/{id}
 */
export interface UpdateIncidentResponseDTO {
  data: IncidentDTO;
  message: string;
}

/**
 * Query parameters for GET /api/incidents
 */
export interface GetIncidentsQueryParams {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'incident_date' | 'incident_name' | 'updated_at';
  order?: 'asc' | 'desc';
  category?: string;
  date_from?: string; // ISO 8601 date string
  date_to?: string; // ISO 8601 date string
  search?: string;
  user_id?: string;
}

// ============================================================================
// AI ANALYSIS DTOs
// ============================================================================

/**
 * AI analysis result
 * Contains categorization and summary generated by AI
 */
export interface AIAnalysisResultDTO {
  category: string;
  summary: string;
}

/**
 * Response for POST /api/incidents/{id}/analyze
 */
export interface AnalyzeIncidentResponseDTO {
  data: {
    id: string;
    category: string;
    summary: string;
    analyzed_at: string;
  };
  message: string;
}

// ============================================================================
// COMMAND MODELS (Write Operations)
// ============================================================================

/**
 * Command model for user registration
 * Encapsulates all data needed to create a new user account
 */
export interface RegisterUserCommand {
  email: string;
  password: string;
  profile: {
    fire_department_id: string;
    first_name?: string;
    last_name?: string;
    role: 'member' | 'admin';
  };
}

/**
 * Command model for creating an incident
 * Includes user context needed for creation
 */
export interface CreateIncidentCommand extends CreateIncidentRequestDTO {
  user_id: string;
  fire_department_id: string;
}

/**
 * Command model for updating an incident
 * Includes authorization context
 */
export interface UpdateIncidentCommand extends UpdateIncidentRequestDTO {
  incident_id: string;
  user_id: string;
  user_role: string;
}

/**
 * Command model for deleting an incident
 * Includes authorization context
 */
export interface DeleteIncidentCommand {
  incident_id: string;
  user_id: string;
  user_role: string;
}

/**
 * Command model for updating user profile
 */
export interface UpdateProfileCommand extends UpdateProfileRequestDTO {
  user_id: string;
}

/**
 * Command model for triggering AI analysis
 */
export interface AnalyzeIncidentCommand {
  incident_id: string;
  user_id: string;
  incident_data: {
    incident_name: string;
    description: string;
    forces_and_resources?: string | null;
  };
}

// ============================================================================
// VALIDATION SCHEMAS (Type Guards)
// ============================================================================

/**
 * Type guard to check if a value is a valid user role
 */
export function isValidUserRole(role: unknown): role is 'member' | 'admin' {
  return role === 'member' || role === 'admin';
}

/**
 * Type guard to check if a value is a valid sort field for incidents
 */
export function isValidIncidentSortField(
  field: unknown
): field is 'created_at' | 'incident_date' | 'incident_name' | 'updated_at' {
  return (
    field === 'created_at' ||
    field === 'incident_date' ||
    field === 'incident_name' ||
    field === 'updated_at'
  );
}

/**
 * Type guard to check if a value is a valid sort order
 */
export function isValidSortOrder(order: unknown): order is 'asc' | 'desc' {
  return order === 'asc' || order === 'desc';
}

/**
 * Known incident categories (AI-generated)
 * These are the standard categories the AI should use
 */
export type IncidentCategory =
  | 'Pożar'
  | 'Miejscowe Zagrożenie'
  | 'Wypadek Drogowy'
  | 'Fałszywy Alarm'
  | 'Inne';

/**
 * Coordinates validation helper type
 */
export interface Coordinates {
  latitude: number; // -90 to 90
  longitude: number; // -180 to 180
}

// ============================================================================
// QUERY PARAMETERS TYPES
// ============================================================================

/**
 * Query parameters for filtering profiles
 * GET /api/profiles
 */
export interface GetProfilesQueryParams {
  role?: 'member' | 'admin';
  search?: string;
}

/**
 * Query parameters for filtering counties
 * GET /api/provinces/{province_id}/counties
 */
export interface GetCountiesQueryParams {
  search?: string;
}

/**
 * Query parameters for filtering fire departments
 * GET /api/counties/{county_id}/fire-departments
 */
export interface GetFireDepartmentsQueryParams {
  search?: string;
}

// ============================================================================
// STATISTICS DTOs (Future Enhancement - Post-MVP)
// ============================================================================

/**
 * Statistics response DTO
 * For GET /api/statistics/incidents (planned for post-MVP)
 */
export interface IncidentStatisticsDTO {
  total_incidents: number;
  date_range: {
    from: string;
    to: string;
  };
  by_category: Record<string, number>;
  by_month: Array<{
    month: string;
    count: number;
  }>;
}

// ============================================================================
// TYPE EXPORTS FOR CONVENIENT IMPORTS
// ============================================================================

// Re-export database types for convenience
export type {
  DbProvince,
  DbProvinceInsert,
  DbProvinceUpdate,
  DbCounty,
  DbCountyInsert,
  DbCountyUpdate,
  DbFireDepartment,
  DbFireDepartmentInsert,
  DbFireDepartmentUpdate,
  DbProfile,
  DbProfileInsert,
  DbProfileUpdate,
  DbIncident,
  DbIncidentInsert,
  DbIncidentUpdate,
};

// ============================================================================
// MELDUNKI TYPES
// ============================================================================

export interface MeldunekDTO {
  id: string;
  user_id: string;
  fire_department_id: string;
  title: string;
  description: string;
  location: string;
  incident_type: 'fire' | 'rescue' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  incident_date: string;
  duration_minutes?: number;
  participants_count?: number;
  equipment_used?: string[];
  weather_conditions?: string;
  additional_notes?: string;
}

export interface CreateMeldunekRequestDTO {
  title: string;
  description: string;
  location: string;
  incident_type: 'fire' | 'rescue' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  incident_date: string;
  duration_minutes?: number;
  participants_count?: number;
  equipment_used?: string[];
  weather_conditions?: string;
  additional_notes?: string;
}

export interface CreateMeldunekResponseDTO {
  meldunek: MeldunekDTO;
  message: string;
}

export interface CreateMeldunekCommand {
  user_id: string;
  fire_department_id: string;
  title: string;
  description: string;
  location: string;
  incident_type: 'fire' | 'rescue' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  incident_date: string;
  duration_minutes?: number;
  participants_count?: number;
  equipment_used?: string[];
  weather_conditions?: string;
  additional_notes?: string;
}


