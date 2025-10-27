# Supabase Usage Examples in Astro

## Astro Component (Server-side)

```astro
---
// src/pages/incidents.astro
import { supabase } from '@/lib/db'
import type { IncidentWithRelations } from '@/lib/db'

// server-side data fetching
const { data: incidents, error } = await supabase
  .from('incidents')
  .select(`
    *,
    profiles (
      first_name,
      last_name
    ),
    fire_departments (
      name
    )
  `)
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.error('Error fetching incidents:', error)
}
---

<div>
  <h1>Recent Incidents</h1>
  {incidents?.map((incident) => (
    <div key={incident.id}>
      <h2>{incident.incident_name}</h2>
      <p>{incident.description}</p>
      <small>
        Created by: {incident.profiles?.first_name} {incident.profiles?.last_name}
      </small>
    </div>
  ))}
</div>
```

## React Component with Client-side Updates

```tsx
// src/components/IncidentForm.tsx
import { useState } from 'react'
import { supabase } from '@/lib/db'
import type { IncidentInsert } from '@/lib/db'

export function IncidentForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    
    const newIncident: IncidentInsert = {
      user_id: 'current-user-id', // Get from auth
      fire_department_id: 'user-department-id', // Get from profile
      incident_date: formData.get('date') as string,
      incident_name: formData.get('name') as string,
      description: formData.get('description') as string,
      start_time: formData.get('start_time') as string,
      location_address: formData.get('location') as string,
    }

    const { data, error } = await supabase
      .from('incidents')
      .insert(newIncident)
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      // Success! Redirect or show success message
      window.location.href = `/incidents/${data.id}`
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Incident name" required />
      <input name="date" type="date" required />
      <input name="start_time" type="datetime-local" required />
      <input name="location" placeholder="Location" />
      <textarea name="description" placeholder="Description" required />
      
      {error && <p className="error">{error}</p>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Incident'}
      </button>
    </form>
  )
}
```

## Authentication Example

```typescript
// src/lib/auth.ts
import { supabase } from '@/lib/db'

export async function signUp(email: string, password: string, fireDepartmentId: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fire_department_id: fireDepartmentId,
        role: 'member'
      }
    }
  })
  
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getCurrentProfile() {
  const { user } = await getCurrentUser()
  
  if (!user) return { profile: null, error: new Error('Not authenticated') }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      fire_departments (
        id,
        name,
        counties (
          name,
          provinces (
            name
          )
        )
      )
    `)
    .eq('id', user.id)
    .single()
  
  return { profile, error }
}
```

## Realtime Subscriptions

```typescript
// src/components/IncidentsList.tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/db'
import type { Incident } from '@/lib/db'

export function IncidentsList() {
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    // Initial fetch
    fetchIncidents()

    // Subscribe to changes
    const channel = supabase
      .channel('incidents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          console.log('Change received!', payload)
          fetchIncidents() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchIncidents() {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setIncidents(data)
  }

  return (
    <div>
      {incidents.map((incident) => (
        <div key={incident.id}>
          <h3>{incident.incident_name}</h3>
          <p>{incident.description}</p>
        </div>
      ))}
    </div>
  )
}
```

## API Routes (Astro Endpoints)

```typescript
// src/pages/api/incidents/[id].ts
import type { APIRoute } from 'astro'
import { supabase } from '@/lib/db'

export const GET: APIRoute = async ({ params }) => {
  const { id } = params
  
  const { data: incident, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(incident), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const { id } = params
  const updates = await request.json()

  const { data: incident, error } = await supabase
    .from('incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(incident), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params

  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(null, { status: 204 })
}
```

