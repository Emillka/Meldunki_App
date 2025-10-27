// main supabase client
export { supabase } from './supabase'

// database types
export type { Database } from './database.types'

// table types
export type {
  Province,
  ProvinceInsert,
  ProvinceUpdate,
  County,
  CountyInsert,
  CountyUpdate,
  FireDepartment,
  FireDepartmentInsert,
  FireDepartmentUpdate,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Incident,
  IncidentInsert,
  IncidentUpdate,
  UserRole,
  ProfileWithDepartment,
  IncidentWithRelations,
  FireDepartmentWithLocation,
} from './types'

