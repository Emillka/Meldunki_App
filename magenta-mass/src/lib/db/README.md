# Database Layer

This directory contains all database-related code for the FireLog application.

## Files

- **`database.types.ts`** - Auto-generated TypeScript types from Supabase schema (DO NOT EDIT MANUALLY)
- **`supabase.ts`** - Supabase client configuration
- **`types.ts`** - Helper types and extended types with relationships
- **`index.ts`** - Barrel exports for convenient imports

## Usage

### Import the Supabase client

```typescript
import { supabase } from '@/lib/db'

// or
import { supabase } from '@/lib/db/supabase'
```

### Import types

```typescript
import type { 
  Incident, 
  IncidentInsert, 
  Profile,
  FireDepartment 
} from '@/lib/db'
```

### Example: Fetching incidents

```typescript
import { supabase } from '@/lib/db'
import type { IncidentWithRelations } from '@/lib/db'

// fetch all incidents for current user's fire department
const { data: incidents, error } = await supabase
  .from('incidents')
  .select(`
    *,
    profiles:user_id (
      id,
      first_name,
      last_name
    ),
    fire_departments:fire_department_id (
      id,
      name
    )
  `)
  .order('incident_date', { ascending: false })
```

### Example: Creating an incident

```typescript
import { supabase } from '@/lib/db'
import type { IncidentInsert } from '@/lib/db'

const newIncident: IncidentInsert = {
  user_id: 'user-uuid',
  fire_department_id: 'department-uuid',
  incident_date: '2025-10-23',
  incident_name: 'Pożar lasu',
  description: 'Szczegółowy opis akcji...',
  start_time: '2025-10-23T14:30:00Z',
  location_address: 'ul. Leśna 123, Warszawa'
}

const { data, error } = await supabase
  .from('incidents')
  .insert(newIncident)
  .select()
  .single()
```

### Example: Updating a profile

```typescript
import { supabase } from '@/lib/db'
import type { ProfileUpdate } from '@/lib/db'

const updates: ProfileUpdate = {
  first_name: 'Jan',
  last_name: 'Kowalski',
  fire_department_id: 'department-uuid'
}

const { data, error } = await supabase
  .from('profiles')
  .update(updates)
  .eq('id', userId)
  .select()
  .single()
```

### Example: Fetching fire departments with location

```typescript
import { supabase } from '@/lib/db'

const { data: departments, error } = await supabase
  .from('fire_departments')
  .select(`
    *,
    counties:county_id (
      name,
      provinces:province_id (
        name
      )
    )
  `)
  .order('name')
```

## Regenerating Types

After making changes to the database schema via migrations, regenerate the types:

```bash
# From project root
supabase gen types typescript --local > magenta-mass/src/lib/db/database.types.ts
```

## Environment Variables

Make sure you have the following environment variables set in `.env.local`:

```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

For local development, these values come from `supabase status` output.

## Row Level Security (RLS)

All tables have Row Level Security enabled. The policies ensure:

- Users can only see data from their fire department
- Users can only modify their own data (unless admin)
- Admins can manage all data within their department

For more details, see the migration files in `/supabase/migrations/`.

