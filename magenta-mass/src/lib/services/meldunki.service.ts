import { createClient } from '@supabase/supabase-js';
import type {
  CreateMeldunekCommand,
  CreateMeldunekResponseDTO,
  MeldunekDTO
} from '../types';
import type { Database } from '../db/database.types';

/**
 * Service do zarządzania meldunkami
 * 
 * Obsługuje tworzenie, pobieranie i zarządzanie meldunkami użytkowników
 */
export class MeldunkiService {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor() {
    // Environment variables for server-side
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    this.supabase = createClient<Database>(
      supabaseUrl,
      supabaseKey
    );
  }

  /**
   * Tworzy nowy meldunek
   * 
   * @param command - Dane meldunku do utworzenia
   * @returns Obiekt z utworzonym meldunkiem lub błędem
   * 
   * @example
   * ```typescript
   * const { data, error } = await meldunkiService.createMeldunek({
   *   user_id: 'user-uuid',
   *   fire_department_id: 'dept-uuid',
   *   title: 'Pożar budynku',
   *   description: 'Opis zdarzenia...',
   *   location: 'ul. Główna 1',
   *   incident_type: 'fire',
   *   severity: 'high',
   *   incident_date: '2024-01-15'
   * });
   * ```
   */
  async createMeldunek(command: CreateMeldunekCommand): Promise<{ data: CreateMeldunekResponseDTO | null; error: Error | null }> {
    try {
      // 1. Sprawdzenie czy użytkownik ma dostęp do jednostki OSP
      try {
        const hasAccess = await this.validateUserFireDepartmentAccess(
          command.user_id, 
          command.fire_department_id
        );
        
        if (!hasAccess) {
          return {
            data: null,
            error: new Error('FIRE_DEPARTMENT_ACCESS_DENIED')
          };
        }
      } catch (error) {
        // Przekaż oryginalny błąd z validateUserFireDepartmentAccess
        return {
          data: null,
          error: error as Error
        };
      }

      // 2. Przygotowanie danych do wstawienia (mapowanie na strukturę incidents)
      const meldunekData = {
        user_id: command.user_id,
        fire_department_id: command.fire_department_id,
        incident_name: command.title.trim(),
        description: command.description.trim(),
        location_address: command.location.trim(),
        incident_date: command.incident_date,
        start_time: new Date().toISOString(), // Current time as start
        end_time: command.duration_minutes ? 
          new Date(Date.now() + command.duration_minutes * 60000).toISOString() : 
          null,
        category: command.incident_type,
        summary: command.additional_notes?.trim() || null,
        forces_and_resources: command.equipment_used?.join(', ') || null,
        commander: null, // Will be filled later
        driver: null // Will be filled later
      };

      // 3. Wstawienie meldunku do bazy
      const { data: meldunek, error: insertError } = await this.supabase
        .from('incidents')
        .insert(meldunekData)
        .select('*')
        .single();

      if (insertError) {
        console.error('Meldunek creation failed:', insertError);
        return {
          data: null,
          error: insertError
        };
      }

      if (!meldunek) {
        return {
          data: null,
          error: new Error('Meldunek not created')
        };
      }

      // 4. Formatowanie odpowiedzi (mapowanie z incidents na MeldunekDTO)
      const meldunekDTO: MeldunekDTO = {
        id: meldunek.id,
        user_id: meldunek.user_id,
        fire_department_id: meldunek.fire_department_id,
        title: meldunek.incident_name,
        description: meldunek.description,
        location: meldunek.location_address || '',
        incident_type: meldunek.category as 'fire' | 'rescue' | 'medical' | 'other',
        severity: 'medium', // Default severity since incidents table doesn't have this field
        status: 'submitted',
        created_at: meldunek.created_at,
        updated_at: meldunek.updated_at,
        incident_date: meldunek.incident_date,
        duration_minutes: meldunek.end_time && meldunek.start_time ? 
          Math.round((new Date(meldunek.end_time).getTime() - new Date(meldunek.start_time).getTime()) / 60000) : 
          undefined,
        participants_count: undefined, // Not available in incidents table
        equipment_used: meldunek.forces_and_resources ? meldunek.forces_and_resources.split(', ') : undefined,
        weather_conditions: undefined, // Not available in incidents table
        additional_notes: meldunek.summary || undefined
      };

      return {
        data: {
          meldunek: meldunekDTO,
          message: 'Meldunek został pomyślnie utworzony'
        },
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in createMeldunek:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Pobiera meldunki użytkownika
   * 
   * @param userId - ID użytkownika
   * @param limit - Maksymalna liczba meldunków (domyślnie 50)
   * @returns Lista meldunków użytkownika
   */
  async getUserMeldunki(userId: string, limit: number = 50): Promise<{ data: MeldunekDTO[] | null; error: Error | null }> {
    try {
      const { data: incidents, error } = await this.supabase
        .from('incidents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch user incidents:', error);
        return {
          data: null,
          error
        };
      }

      const meldunkiDTO: MeldunekDTO[] = incidents.map(incident => ({
        id: incident.id,
        user_id: incident.user_id,
        fire_department_id: incident.fire_department_id,
        title: incident.incident_name,
        description: incident.description,
        location: incident.location_address || '',
        incident_type: incident.category as 'fire' | 'rescue' | 'medical' | 'other',
        severity: 'medium', // Default since incidents table doesn't have severity
        status: 'submitted',
        created_at: incident.created_at,
        updated_at: incident.updated_at,
        incident_date: incident.incident_date,
        duration_minutes: incident.end_time && incident.start_time ? 
          Math.round((new Date(incident.end_time).getTime() - new Date(incident.start_time).getTime()) / 60000) : 
          undefined,
        participants_count: undefined, // Not available in incidents table
        equipment_used: incident.forces_and_resources ? incident.forces_and_resources.split(', ') : undefined,
        weather_conditions: undefined, // Not available in incidents table
        additional_notes: incident.summary || undefined
      }));

      return {
        data: meldunkiDTO,
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in getUserMeldunki:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Sprawdza czy użytkownik ma dostęp do jednostki OSP
   * 
   * @param userId - ID użytkownika
   * @param fireDepartmentId - ID jednostki OSP
   * @returns true jeśli użytkownik ma dostęp
   * 
   * @private
   */
  private async validateUserFireDepartmentAccess(userId: string, fireDepartmentId: string): Promise<boolean> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('fire_department_id')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Profile fetch failed:', error);
      throw error || new Error('Profile not found');
    }

    return profile.fire_department_id === fireDepartmentId;
  }
}
