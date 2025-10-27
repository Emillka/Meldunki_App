import type { Database } from './database.types'

// table types
export type Province = Database['public']['Tables']['provinces']['Row']
export type ProvinceInsert = Database['public']['Tables']['provinces']['Insert']
export type ProvinceUpdate = Database['public']['Tables']['provinces']['Update']

export type County = Database['public']['Tables']['counties']['Row']
export type CountyInsert = Database['public']['Tables']['counties']['Insert']
export type CountyUpdate = Database['public']['Tables']['counties']['Update']

export type FireDepartment = Database['public']['Tables']['fire_departments']['Row']
export type FireDepartmentInsert = Database['public']['Tables']['fire_departments']['Insert']
export type FireDepartmentUpdate = Database['public']['Tables']['fire_departments']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Incident = Database['public']['Tables']['incidents']['Row']
export type IncidentInsert = Database['public']['Tables']['incidents']['Insert']
export type IncidentUpdate = Database['public']['Tables']['incidents']['Update']

// user roles enum
export type UserRole = 'member' | 'admin'

// extended types with relationships
export type ProfileWithDepartment = Profile & {
  fire_departments: FireDepartment | null
}

export type IncidentWithRelations = Incident & {
  profiles: Profile
  fire_departments: FireDepartment
}

export type FireDepartmentWithLocation = FireDepartment & {
  counties: County & {
    provinces: Province
  }
}

