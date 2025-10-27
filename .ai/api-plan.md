# REST API Plan for FireLog

## Overview

This document outlines the REST API design for **FireLog**, a fire department incident reporting application. The API is designed to work with Supabase as the backend infrastructure, leveraging Supabase Auth for authentication and PostgreSQL with Row Level Security (RLS) for data access control.

### Architecture Approach

Given the tech stack (Astro 5, React 19, Supabase), this API plan follows two primary patterns:

1. **Direct Supabase Client Access** - For standard CRUD operations that can leverage Supabase's built-in RLS policies
2. **Custom API Endpoints** - For complex business logic, AI integration, and operations requiring server-side processing

---

## 1. Resources

The API exposes the following main resources:

| Resource | Database Table | Type | Description |
|----------|---------------|------|-------------|
| **provinces** | `provinces` | Reference Data | Polish provinces (województwa) |
| **counties** | `counties` | Reference Data | Counties within provinces (powiaty) |
| **fire-departments** | `fire_departments` | Reference Data | Volunteer fire department units (OSP) |
| **profiles** | `profiles` | User Data | Extended user profile information |
| **incidents** | `incidents` | Transactional Data | Fire incident reports (meldunki) |
| **auth** | `auth.users` | System | Authentication and session management |

---

## 2. API Endpoints

### 2.1. Authentication Endpoints

These endpoints handle user registration, login, logout, and session management using Supabase Auth.

#### POST `/api/auth/register`

Register a new user account.

**Description:** Creates a new user with email/password and automatically creates a profile with fire department association.

**Request Body:**
```json
{
  "email": "jan.kowalski@osp.pl",
  "password": "SecurePassword123!",
  "fire_department_id": "uuid-of-fire-department",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "role": "member"
}
```

**Validation Rules:**
- `email`: valid email format, unique
- `password`: minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `fire_department_id`: must be valid UUID of existing fire department
- `first_name`: optional, max 100 characters
- `last_name`: optional, max 100 characters
- `role`: must be either "member" or "admin", defaults to "member"

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "jan.kowalski@osp.pl",
      "created_at": "2025-10-23T12:00:00Z"
    },
    "profile": {
      "id": "uuid",
      "fire_department_id": "uuid-of-fire-department",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "role": "member"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1729857600,
      "expires_in": 604800
    }
  },
  "message": "User registered successfully"
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data (weak password, invalid email, etc.) |
| 409 | `EMAIL_ALREADY_EXISTS` | Email is already registered |
| 404 | `FIRE_DEPARTMENT_NOT_FOUND` | Invalid fire_department_id |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### POST `/api/auth/login`

Authenticate an existing user.

**Description:** Validates credentials and returns JWT session token valid for 7 days.

**Request Body:**
```json
{
  "email": "jan.kowalski@osp.pl",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "jan.kowalski@osp.pl"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": 1729857600,
      "expires_in": 604800
    },
    "profile": {
      "id": "uuid",
      "fire_department_id": "uuid",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "role": "member"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Missing email or password |
| 401 | `INVALID_CREDENTIALS` | Incorrect email or password |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### POST `/api/auth/logout`

Terminate user session.

**Description:** Invalidates current JWT token and clears session.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `UNAUTHORIZED` | Invalid or expired token |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### POST `/api/auth/refresh`

Refresh an expired access token.

**Description:** Generates new access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh-token-here"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "new-jwt-token",
    "refresh_token": "new-refresh-token",
    "expires_at": 1729857600,
    "expires_in": 604800
  }
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token is invalid or expired |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### GET `/api/auth/me`

Get current user information.

**Description:** Returns authenticated user's profile and fire department information.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "jan.kowalski@osp.pl",
      "created_at": "2025-10-23T12:00:00Z"
    },
    "profile": {
      "id": "uuid",
      "fire_department_id": "uuid",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "role": "member",
      "created_at": "2025-10-23T12:00:00Z",
      "updated_at": "2025-10-23T12:00:00Z"
    },
    "fire_department": {
      "id": "uuid",
      "name": "OSP Warszawa",
      "county": {
        "id": "uuid",
        "name": "warszawski",
        "province": {
          "id": "uuid",
          "name": "mazowieckie"
        }
      }
    }
  }
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 500 | `SERVER_ERROR` | Internal server error |

---

### 2.2. Reference Data Endpoints

These endpoints provide access to reference data (provinces, counties, fire departments) needed for registration and filtering.

#### GET `/api/provinces`

Retrieve list of all Polish provinces.

**Description:** Returns all 16 provinces. No authentication required.

**Query Parameters:** None

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "mazowieckie",
      "created_at": "2025-10-23T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "małopolskie",
      "created_at": "2025-10-23T12:00:00Z"
    }
    // ... 14 more provinces
  ],
  "count": 16
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 500 | `SERVER_ERROR` | Internal server error |

---

#### GET `/api/provinces/{province_id}/counties`

Retrieve counties for a specific province.

**Description:** Returns all counties within a province. No authentication required.

**Path Parameters:**
- `province_id` (UUID): ID of the province

**Query Parameters:**
- `search` (string, optional): Filter counties by name (case-insensitive)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "province_id": "uuid",
      "name": "warszawski",
      "created_at": "2025-10-23T12:00:00Z"
    },
    {
      "id": "uuid",
      "province_id": "uuid",
      "name": "radomski",
      "created_at": "2025-10-23T12:00:00Z"
    }
  ],
  "count": 42
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 404 | `PROVINCE_NOT_FOUND` | Province ID does not exist |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### GET `/api/counties/{county_id}/fire-departments`

Retrieve fire departments for a specific county.

**Description:** Returns all fire departments within a county. No authentication required.

**Path Parameters:**
- `county_id` (UUID): ID of the county

**Query Parameters:**
- `search` (string, optional): Filter fire departments by name (case-insensitive)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "county_id": "uuid",
      "name": "OSP Warszawa Mokotów",
      "created_at": "2025-10-23T12:00:00Z"
    },
    {
      "id": "uuid",
      "county_id": "uuid",
      "name": "OSP Warszawa Śródmieście",
      "created_at": "2025-10-23T12:00:00Z"
    }
  ],
  "count": 15
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 404 | `COUNTY_NOT_FOUND` | County ID does not exist |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### GET `/api/fire-departments/{id}`

Retrieve details of a specific fire department.

**Description:** Returns fire department with nested county and province information.

**Path Parameters:**
- `id` (UUID): ID of the fire department

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "OSP Warszawa Mokotów",
    "created_at": "2025-10-23T12:00:00Z",
    "county": {
      "id": "uuid",
      "name": "warszawski",
      "province": {
        "id": "uuid",
        "name": "mazowieckie"
      }
    }
  }
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 404 | `FIRE_DEPARTMENT_NOT_FOUND` | Fire department ID does not exist |
| 500 | `SERVER_ERROR` | Internal server error |

---

### 2.3. Profile Endpoints

#### GET `/api/profiles/me`

Get current user's profile.

**Description:** Returns authenticated user's complete profile information.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fire_department_id": "uuid",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "role": "member",
    "created_at": "2025-10-23T12:00:00Z",
    "updated_at": "2025-10-23T12:00:00Z",
    "fire_department": {
      "id": "uuid",
      "name": "OSP Warszawa Mokotów"
    }
  }
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 404 | `PROFILE_NOT_FOUND` | Profile does not exist |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### PATCH `/api/profiles/me`

Update current user's profile.

**Description:** Allows user to update their first name and last name. Role cannot be changed via this endpoint.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "first_name": "Jan",
  "last_name": "Nowak"
}
```

**Validation Rules:**
- `first_name`: optional, max 100 characters
- `last_name`: optional, max 100 characters
- Cannot modify: `id`, `fire_department_id`, `role`, `created_at`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fire_department_id": "uuid",
    "first_name": "Jan",
    "last_name": "Nowak",
    "role": "member",
    "created_at": "2025-10-23T12:00:00Z",
    "updated_at": "2025-10-23T14:30:00Z"
  },
  "message": "Profile updated successfully"
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Attempting to modify restricted fields |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### GET `/api/profiles`

Get all profiles from current user's fire department.

**Description:** Returns list of all users (profiles) in the same fire department as the authenticated user.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `role` (string, optional): Filter by role ("member" or "admin")
- `search` (string, optional): Search by first name or last name

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fire_department_id": "uuid",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "role": "member",
      "created_at": "2025-10-23T12:00:00Z"
    },
    {
      "id": "uuid",
      "fire_department_id": "uuid",
      "first_name": "Anna",
      "last_name": "Nowak",
      "role": "admin",
      "created_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 15
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 500 | `SERVER_ERROR` | Internal server error |

---

### 2.4. Incident Endpoints

#### GET `/api/incidents`

Retrieve list of incidents from user's fire department.

**Description:** Returns paginated list of all incidents from the authenticated user's fire department, with filtering and sorting options.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `sort_by` (string, optional): Field to sort by (default: "created_at")
  - Options: "created_at", "incident_date", "incident_name", "updated_at"
- `order` (string, optional): Sort order (default: "desc")
  - Options: "asc", "desc"
- `category` (string, optional): Filter by AI-generated category
- `date_from` (date, optional): Filter incidents from this date (ISO 8601 format)
- `date_to` (date, optional): Filter incidents up to this date (ISO 8601 format)
- `search` (string, optional): Full-text search in incident_name and description
- `user_id` (UUID, optional): Filter by creator (must be from same department)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "fire_department_id": "uuid",
      "incident_date": "2025-10-23",
      "incident_name": "Pożar budynku mieszkalnego",
      "location_address": "ul. Marszałkowska 1, Warszawa",
      "location_latitude": 52.2297,
      "location_longitude": 21.0122,
      "description": "Pożar w piwnicy budynku...",
      "forces_and_resources": "2 wozy strażackie, 8 strażaków",
      "commander": "Jan Kowalski",
      "driver": "Adam Nowak",
      "start_time": "2025-10-23T14:30:00Z",
      "end_time": "2025-10-23T16:45:00Z",
      "category": "Pożar",
      "summary": "Pożar w piwnicy budynku mieszkalnego ugaszony.",
      "created_at": "2025-10-23T17:00:00Z",
      "updated_at": "2025-10-23T17:00:00Z",
      "user": {
        "id": "uuid",
        "first_name": "Jan",
        "last_name": "Kowalski"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "total_count": 87,
    "has_next": true,
    "has_prev": false
  }
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid query parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### GET `/api/incidents/{id}`

Retrieve details of a specific incident.

**Description:** Returns complete information about a single incident. User must be from the same fire department.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id` (UUID): ID of the incident

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "fire_department_id": "uuid",
    "incident_date": "2025-10-23",
    "incident_name": "Pożar budynku mieszkalnego",
    "location_address": "ul. Marszałkowska 1, Warszawa",
    "location_latitude": 52.2297,
    "location_longitude": 21.0122,
    "description": "Pożar w piwnicy budynku mieszkalnego. Zadysponowano 2 zastępy....",
    "forces_and_resources": "2 wozy strażackie GBA 2,5/16, 8 strażaków",
    "commander": "Jan Kowalski",
    "driver": "Adam Nowak",
    "start_time": "2025-10-23T14:30:00Z",
    "end_time": "2025-10-23T16:45:00Z",
    "category": "Pożar",
    "summary": "Pożar w piwnicy budynku mieszkalnego przy ul. Marszałkowskiej 1. Ugaszono przy użyciu 2 wozów strażackich.",
    "created_at": "2025-10-23T17:00:00Z",
    "updated_at": "2025-10-23T17:00:00Z",
    "user": {
      "id": "uuid",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "role": "member"
    },
    "fire_department": {
      "id": "uuid",
      "name": "OSP Warszawa Mokotów"
    }
  }
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | User not authorized to view this incident |
| 404 | `INCIDENT_NOT_FOUND` | Incident does not exist |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### POST `/api/incidents`

Create a new incident report.

**Description:** Creates new incident and triggers AI analysis for categorization and summary generation.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "incident_date": "2025-10-23",
  "incident_name": "Pożar budynku mieszkalnego",
  "location_address": "ul. Marszałkowska 1, Warszawa",
  "location_latitude": 52.2297,
  "location_longitude": 21.0122,
  "description": "Pożar w piwnicy budynku mieszkalnego. Zadysponowano 2 zastępy....",
  "forces_and_resources": "2 wozy strażackie GBA 2,5/16, 8 strażaków",
  "commander": "Jan Kowalski",
  "driver": "Adam Nowak",
  "start_time": "2025-10-23T14:30:00Z",
  "end_time": "2025-10-23T16:45:00Z"
}
```

**Validation Rules:**
- `incident_date` (required): Valid date, not in future
- `incident_name` (required): Max 255 characters, not empty
- `location_address` (optional): Text field
- `location_latitude` (optional): Decimal between -90 and 90
- `location_longitude` (optional): Decimal between -180 and 180
- `description` (required): Not empty, minimum 10 characters
- `forces_and_resources` (optional): Text field
- `commander` (optional): Max 255 characters
- `driver` (optional): Max 255 characters
- `start_time` (required): Valid timestamp
- `end_time` (optional): Must be >= start_time if provided

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "fire_department_id": "uuid",
    "incident_date": "2025-10-23",
    "incident_name": "Pożar budynku mieszkalnego",
    "location_address": "ul. Marszałkowska 1, Warszawa",
    "location_latitude": 52.2297,
    "location_longitude": 21.0122,
    "description": "Pożar w piwnicy budynku...",
    "forces_and_resources": "2 wozy strażackie GBA 2,5/16, 8 strażaków",
    "commander": "Jan Kowalski",
    "driver": "Adam Nowak",
    "start_time": "2025-10-23T14:30:00Z",
    "end_time": "2025-10-23T16:45:00Z",
    "category": null,
    "summary": null,
    "created_at": "2025-10-23T17:00:00Z",
    "updated_at": "2025-10-23T17:00:00Z"
  },
  "message": "Incident created successfully. AI analysis in progress."
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### PATCH `/api/incidents/{id}`

Update an existing incident report.

**Description:** Updates incident information. Regular users can only edit their own incidents. Admins can edit all incidents in their department. After update, AI analysis is re-triggered.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters:**
- `id` (UUID): ID of the incident

**Request Body:** (All fields optional, only provided fields will be updated)
```json
{
  "incident_date": "2025-10-23",
  "incident_name": "Pożar budynku mieszkalnego - aktualizacja",
  "location_address": "ul. Marszałkowska 1/3, Warszawa",
  "description": "Zaktualizowany opis zdarzenia...",
  "end_time": "2025-10-23T17:00:00Z"
}
```

**Validation Rules:** Same as POST `/api/incidents` for provided fields

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "fire_department_id": "uuid",
    "incident_date": "2025-10-23",
    "incident_name": "Pożar budynku mieszkalnego - aktualizacja",
    "location_address": "ul. Marszałkowska 1/3, Warszawa",
    "location_latitude": 52.2297,
    "location_longitude": 21.0122,
    "description": "Zaktualizowany opis zdarzenia...",
    "forces_and_resources": "2 wozy strażackie GBA 2,5/16, 8 strażaków",
    "commander": "Jan Kowalski",
    "driver": "Adam Nowak",
    "start_time": "2025-10-23T14:30:00Z",
    "end_time": "2025-10-23T17:00:00Z",
    "category": null,
    "summary": null,
    "created_at": "2025-10-23T17:00:00Z",
    "updated_at": "2025-10-23T18:30:00Z"
  },
  "message": "Incident updated successfully. AI analysis in progress."
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | User not authorized to edit this incident |
| 404 | `INCIDENT_NOT_FOUND` | Incident does not exist |
| 500 | `SERVER_ERROR` | Internal server error |

---

#### DELETE `/api/incidents/{id}`

Delete an incident report.

**Description:** Permanently deletes an incident. Regular users can only delete their own incidents. Admins can delete all incidents in their department.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id` (UUID): ID of the incident

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | User not authorized to delete this incident |
| 404 | `INCIDENT_NOT_FOUND` | Incident does not exist |
| 500 | `SERVER_ERROR` | Internal server error |

---

### 2.5. AI Analysis Endpoints

#### POST `/api/incidents/{id}/analyze`

Trigger AI analysis for an incident.

**Description:** Manually triggers AI analysis to generate or regenerate category and summary for an incident. Normally triggered automatically on create/update.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id` (UUID): ID of the incident

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "category": "Pożar",
    "summary": "Pożar w piwnicy budynku mieszkalnego przy ul. Marszałkowskiej 1. Ugaszono przy użyciu 2 wozów strażackich.",
    "analyzed_at": "2025-10-23T18:45:00Z"
  },
  "message": "AI analysis completed successfully"
}
```

**Error Responses:**

| Code | Error Type | Description |
|------|------------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | User not authorized to analyze this incident |
| 404 | `INCIDENT_NOT_FOUND` | Incident does not exist |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many AI analysis requests |
| 500 | `SERVER_ERROR` | Internal server error |
| 503 | `AI_SERVICE_UNAVAILABLE` | AI service temporarily unavailable |

---

### 2.6. Statistics & Analytics Endpoints (Future Enhancement)

#### GET `/api/statistics/incidents`

Get incident statistics for user's fire department.

**Description:** Returns aggregated statistics about incidents. This endpoint is planned for post-MVP implementation.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `date_from` (date, optional): Start date for statistics
- `date_to` (date, optional): End date for statistics
- `group_by` (string, optional): Grouping level ("day", "week", "month", "year")

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_incidents": 87,
    "date_range": {
      "from": "2025-01-01",
      "to": "2025-10-23"
    },
    "by_category": {
      "Pożar": 45,
      "Miejscowe Zagrożenie": 32,
      "Fałszywy Alarm": 5,
      "Wypadek Drogowy": 3,
      "Inne": 2
    },
    "by_month": [
      {
        "month": "2025-10",
        "count": 12
      },
      {
        "month": "2025-09",
        "count": 8
      }
    ]
  }
}
```

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

**Supabase Auth** is used as the primary authentication provider with the following configuration:

#### Token Management
- **Access Token Type:** JWT (JSON Web Token)
- **Token Validity:** 7 days (604,800 seconds)
- **Refresh Token:** Provided for seamless token renewal
- **Storage:** Client-side storage (httpOnly cookies recommended for production)

#### Password Security
- **Hashing Algorithm:** bcrypt (handled by Supabase)
- **Minimum Requirements:**
  - At least 8 characters
  - Must contain uppercase letter
  - Must contain lowercase letter
  - Must contain number
  - Must contain special character

#### Session Persistence
- JWT tokens stored client-side
- Automatic token refresh before expiration
- Session invalidation on logout
- Concurrent session support

### 3.2. Authorization Strategy

Authorization is implemented through **Row Level Security (RLS)** policies in PostgreSQL and validated in API endpoints.

#### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **member** | Standard fire department member | - Create own incidents<br>- Read incidents from own department<br>- Update own incidents<br>- Delete own incidents<br>- View department profiles |
| **admin** | Fire department administrator | - All member permissions<br>- Update any incident in department<br>- Delete any incident in department<br>- Manage user profiles (future) |

#### Resource Access Control

**Incidents:**
- Users can only view incidents from their fire department
- Users can only create incidents for their fire department
- Regular users can edit/delete only their own incidents
- Admin users can edit/delete all incidents in their department

**Profiles:**
- Users can view their own profile
- Users can view profiles from their fire department
- Users can update only their own profile
- Users cannot change their own role

**Reference Data:**
- Provinces, counties, and fire departments are publicly readable
- Only system administrators can modify reference data (via database)

### 3.3. Request Authentication

All protected endpoints require authentication via Bearer token:

```
Authorization: Bearer {access_token}
```

**Middleware Flow:**
1. Extract token from Authorization header
2. Validate token signature and expiration
3. Extract user ID from token payload
4. Verify user exists and is active
5. Attach user context to request
6. Execute RLS policies for data access

### 3.4. Rate Limiting

To prevent abuse, the following rate limits are implemented:

| Endpoint Pattern | Rate Limit | Window |
|-----------------|------------|--------|
| `/api/auth/login` | 5 requests | per 15 minutes |
| `/api/auth/register` | 3 requests | per hour |
| `/api/incidents` (POST) | 30 requests | per hour |
| `/api/incidents/{id}/analyze` | 10 requests | per hour |
| All other endpoints | 100 requests | per minute |

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 900
  }
}
```

---

## 4. Validation and Business Logic

### 4.1. Input Validation

All API endpoints implement strict input validation based on database constraints:

#### Common Validation Rules

**UUID Fields:**
- Must be valid UUID v4 format
- Must reference existing records for foreign keys

**String Fields:**
- Maximum length enforced (as per database schema)
- Trimmed of leading/trailing whitespace
- XSS sanitization applied

**Timestamp Fields:**
- Must be valid ISO 8601 format
- Timezone-aware (UTC preferred)
- Business logic validation (e.g., end_time >= start_time)

**Coordinate Fields:**
- `latitude`: -90 to 90 (decimal degrees)
- `longitude`: -180 to 180 (decimal degrees)
- Both or neither must be provided

### 4.2. Incident Validation

Specific validation rules for incident creation and updates:

```typescript
interface IncidentValidation {
  incident_date: {
    required: true;
    type: 'date';
    maxDate: 'today'; // Cannot be in future
  };
  
  incident_name: {
    required: true;
    type: 'string';
    minLength: 1;
    maxLength: 255;
  };
  
  description: {
    required: true;
    type: 'string';
    minLength: 10;
    maxLength: 10000;
  };
  
  start_time: {
    required: true;
    type: 'timestamp';
  };
  
  end_time: {
    required: false;
    type: 'timestamp';
    validate: (value, record) => {
      return value >= record.start_time;
    };
  };
  
  location_latitude: {
    required: false;
    type: 'decimal';
    min: -90;
    max: 90;
    precision: 10;
    scale: 8;
  };
  
  location_longitude: {
    required: false;
    type: 'decimal';
    min: -180;
    max: 180;
    precision: 11;
    scale: 8;
  };
}
```

### 4.3. AI Analysis Business Logic

The AI analysis feature implements the following business logic:

#### Analysis Trigger Points
1. **Automatic Triggers:**
   - When new incident is created (POST `/api/incidents`)
   - When incident description is updated (PATCH `/api/incidents/{id}`)

2. **Manual Trigger:**
   - Explicit request to analyze (POST `/api/incidents/{id}/analyze`)

#### Analysis Process

```typescript
async function analyzeIncident(incident: Incident): Promise<AnalysisResult> {
  // 1. Extract relevant text for analysis
  const textToAnalyze = `
    Nazwa zdarzenia: ${incident.incident_name}
    Opis: ${incident.description}
    Siły i środki: ${incident.forces_and_resources || 'Brak danych'}
  `;
  
  // 2. Call OpenRouter AI API with structured prompt
  const analysis = await openRouterClient.analyze({
    model: 'openai/gpt-4-turbo',
    prompt: generateAnalysisPrompt(textToAnalyze),
    temperature: 0.3, // Low temperature for consistent categorization
  });
  
  // 3. Parse AI response
  const category = extractCategory(analysis);
  const summary = extractSummary(analysis);
  
  // 4. Update incident record
  await updateIncident(incident.id, {
    category,
    summary,
  });
  
  return { category, summary };
}
```

#### AI Categorization

Categories are determined by AI based on incident description:

**Standard Categories:**
- **Pożar** - Fire incidents
- **Miejscowe Zagrożenie** - Local hazards (floods, chemical spills, etc.)
- **Wypadek Drogowy** - Traffic accidents
- **Fałszywy Alarm** - False alarms
- **Inne** - Other incidents

#### AI Summary Generation

Summary is automatically generated with the following characteristics:
- Maximum 200 characters
- Polish language
- Focuses on key facts: what, where, outcome
- Professional tone

### 4.4. Error Handling

All API endpoints follow consistent error handling:

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context or validation errors"
    }
  }
}
```

**Standard Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable |

### 4.5. Data Integrity

Business logic ensures data integrity through:

1. **Transactional Operations:**
   - User registration creates both auth.users and profiles entries atomically
   - Incident creation with AI analysis uses async processing (analysis failures don't block creation)

2. **Cascading Deletes:**
   - Deleting a province cascades to counties and fire departments
   - Deleting a user cascades to their incidents
   - Fire departments cannot be deleted if they have profiles (RESTRICT)

3. **Unique Constraints:**
   - Email addresses must be unique
   - County names must be unique within province
   - Fire department names must be unique within county

4. **Referential Integrity:**
   - All foreign keys validated before insert/update
   - Orphaned records prevented by database constraints

---

## 5. Implementation Notes

### 5.1. Supabase Integration

The API leverages Supabase features:

**Database Access:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// RLS policies automatically enforced
const { data, error } = await supabase
  .from('incidents')
  .select('*')
  .eq('fire_department_id', userDepartmentId);
```

**Authentication:**
```typescript
// Register user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  options: {
    data: {
      fire_department_id: 'uuid',
      role: 'member',
    },
  },
});

// Login user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'SecurePassword123!',
});
```

### 5.2. AI Integration Pattern

```typescript
import { OpenRouterClient } from '@openrouter/sdk';

const openRouter = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function generateIncidentAnalysis(description: string) {
  const response = await openRouter.chat.completions.create({
    model: 'openai/gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant analyzing fire department incident reports in Polish. 
                  Categorize incidents and provide brief summaries.
                  
                  Categories: Pożar, Miejscowe Zagrożenie, Wypadek Drogowy, Fałszywy Alarm, Inne
                  
                  Return JSON format:
                  {
                    "category": "category_name",
                    "summary": "brief summary (max 200 chars)"
                  }`,
      },
      {
        role: 'user',
        content: description,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### 5.3. Astro API Routes

API endpoints are implemented as Astro API routes:

```typescript
// src/pages/api/incidents/index.ts
import type { APIRoute } from 'astro';
import { getIncidents } from '@/lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Authentication check
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }),
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Fetch data (RLS automatically enforced by Supabase)
    const { data, error, count } = await getIncidents({
      userId: user.id,
      page,
      limit,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total_count: count,
          total_pages: Math.ceil(count / limit),
          has_next: page * limit < count,
          has_prev: page > 1,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching incidents:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch incidents',
        },
      }),
      { status: 500 }
    );
  }
};
```

### 5.4. Middleware for Authentication

```typescript
// src/middleware/index.ts
import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';

export const onRequest = defineMiddleware(async ({ request, locals, cookies }, next) => {
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY
  );

  // Get session from cookie or header
  const accessToken = cookies.get('sb-access-token')?.value ||
                     request.headers.get('Authorization')?.replace('Bearer ', '');

  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!error && user) {
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, fire_department:fire_departments(*)')
        .eq('id', user.id)
        .single();
      
      locals.user = user;
      locals.profile = profile;
    }
  }

  return next();
});
```

### 5.5. Testing Strategy

**Unit Tests:**
- AI analysis function validation
- Input validation logic
- Business rule enforcement

**Integration Tests:**
- API endpoint responses
- Authentication flows
- Database operations with RLS

**End-to-End Tests:**
- Complete user registration flow
- Incident creation and analysis
- Role-based access control

---

## 6. Security Considerations

### 6.1. SQL Injection Prevention
- Supabase client uses parameterized queries
- All user input sanitized
- RLS policies prevent unauthorized data access

### 6.2. XSS Prevention
- Input sanitization on all text fields
- Output encoding in API responses
- Content-Type headers properly set

### 6.3. CSRF Protection
- SameSite cookie attributes
- Token-based authentication (stateless)
- Origin validation for state-changing operations

### 6.4. Data Privacy
- Passwords hashed with bcrypt
- JWT tokens contain minimal user data
- RLS ensures data isolation between departments
- No sensitive data in logs

### 6.5. API Security Best Practices
- HTTPS enforced in production
- Rate limiting on all endpoints
- API key rotation for external services (OpenRouter)
- Regular security audits

---

## 7. Performance Optimization

### 7.1. Database Optimization
- Appropriate indexes on frequently queried columns
- Full-text search indexes for incident descriptions
- Pagination for list endpoints
- Connection pooling via Supabase

### 7.2. Caching Strategy
- Reference data (provinces, counties) cached client-side
- API responses cached where appropriate
- CDN caching for static assets

### 7.3. AI Analysis Optimization
- Asynchronous processing (non-blocking)
- Queue system for batch processing
- Retry logic for failed analyses
- Rate limiting to manage costs

---

## 8. API Versioning

### 8.1. Versioning Strategy
Initial MVP uses unversioned routes (`/api/*`). Future versions will use:
- URL-based versioning: `/api/v2/*`
- Backwards compatibility maintained for 6 months
- Deprecation warnings in headers

### 8.2. Version Migration
When introducing breaking changes:
1. Announce deprecation 30 days in advance
2. Support both old and new versions
3. Provide migration guide
4. Sunset old version after grace period

---

## 9. Monitoring and Logging

### 9.1. Logging
- Request/response logging for all API calls
- Error tracking with stack traces
- Performance metrics (response times)
- AI analysis success/failure rates

### 9.2. Metrics
- API endpoint usage statistics
- Authentication success/failure rates
- Database query performance
- AI service availability and latency

---

## 10. Future Enhancements

### 10.1. Planned Features (Post-MVP)
1. **Export Functionality**
   - `GET /api/incidents/export` - Export incidents to PDF/Excel
   
2. **Advanced Statistics**
   - `GET /api/statistics/dashboard` - Department dashboard metrics
   - `GET /api/statistics/trends` - Historical trend analysis

3. **User Management (Admin)**
   - `GET /api/admin/users` - List all department users
   - `PATCH /api/admin/users/{id}/role` - Change user role

4. **Notifications**
   - `POST /api/notifications/subscribe` - Subscribe to notifications
   - `GET /api/notifications` - List user notifications

5. **Webhooks**
   - `POST /api/webhooks` - Configure webhooks for incidents
   - External integrations

---

## Appendix A: Complete Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| **Authentication** |
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Authenticate user |
| POST | `/api/auth/logout` | Yes | End session |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user info |
| **Reference Data** |
| GET | `/api/provinces` | No | List all provinces |
| GET | `/api/provinces/{id}/counties` | No | List counties in province |
| GET | `/api/counties/{id}/fire-departments` | No | List fire departments in county |
| GET | `/api/fire-departments/{id}` | No | Get fire department details |
| **Profiles** |
| GET | `/api/profiles/me` | Yes | Get own profile |
| PATCH | `/api/profiles/me` | Yes | Update own profile |
| GET | `/api/profiles` | Yes | List department profiles |
| **Incidents** |
| GET | `/api/incidents` | Yes | List department incidents |
| GET | `/api/incidents/{id}` | Yes | Get incident details |
| POST | `/api/incidents` | Yes | Create new incident |
| PATCH | `/api/incidents/{id}` | Yes | Update incident |
| DELETE | `/api/incidents/{id}` | Yes | Delete incident |
| **AI Analysis** |
| POST | `/api/incidents/{id}/analyze` | Yes | Trigger AI analysis |

---

## Appendix B: Environment Variables

Required environment variables for API operation:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4-turbo

# Application Configuration
NODE_ENV=development|production
API_BASE_URL=http://localhost:4321

# Security
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=http://localhost:4321,https://firelog.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Appendix C: Sample API Workflows

### Workflow 1: User Registration and First Incident

```
1. GET /api/provinces
   → Retrieve list of provinces for registration form

2. GET /api/provinces/{province_id}/counties
   → Get counties in selected province

3. GET /api/counties/{county_id}/fire-departments
   → Get fire departments in selected county

4. POST /api/auth/register
   {
     "email": "user@example.com",
     "password": "SecurePass123!",
     "fire_department_id": "selected-uuid",
     "first_name": "Jan",
     "last_name": "Kowalski"
   }
   → User account created, session started

5. POST /api/incidents
   {
     "incident_name": "Pożar lasu",
     "description": "...",
     ...
   }
   → Incident created, AI analysis triggered

6. GET /api/incidents/{id}
   → Check if AI analysis completed (category & summary populated)
```

### Workflow 2: Login and View Department Incidents

```
1. POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "SecurePass123!"
   }
   → Receive access token

2. GET /api/auth/me
   Authorization: Bearer {token}
   → Verify session and get user info

3. GET /api/incidents?page=1&limit=20&sort_by=incident_date&order=desc
   Authorization: Bearer {token}
   → Retrieve recent incidents from user's department
```

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Status:** MVP Planning Phase

