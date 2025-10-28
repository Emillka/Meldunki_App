import { createClient } from '@supabase/supabase-js';
import type { 
  RegisterUserCommand, 
  RegisterResponseDTO,
  UserDTO,
  ProfileDTO,
  SessionDTO
} from '../types';
import type { Database } from '../db/database.types';

/**
 * AuthService - Serwis obsługujący operacje autoryzacji i autentykacji
 * 
 * Odpowiedzialności:
 * - Rejestracja nowych użytkowników
 * - Logowanie i wylogowanie
 * - Odświeżanie tokenów
 * - Zarządzanie sesjami
 * 
 * @example
 * ```typescript
 * const authService = new AuthService();
 * const { data, error } = await authService.registerUser(command);
 * ```
 */
export class AuthService {
  private supabase: ReturnType<typeof createClient<Database>>;
  
  constructor() {
    // Wykorzystanie SERVICE_ROLE_KEY dla operacji administracyjnych
    // Pozwala to na tworzenie użytkowników bez wymuszenia weryfikacji email
    // W server-side używamy process.env zamiast import.meta.env
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    this.supabase = createClient<Database>(
      supabaseUrl,
      supabaseKey
    );
  }
  
  /**
   * Rejestruje nowego użytkownika w systemie
   * 
   * Proces:
   * 1. Walidacja istnienia fire_department
   * 2. Utworzenie użytkownika przez Supabase Auth
   * 3. Automatyczne utworzenie profilu (trigger bazodanowy)
   * 4. Pobranie utworzonego profilu
   * 5. Zwrócenie danych użytkownika + sesji
   * 
   * @param command - Dane wymagane do rejestracji użytkownika
   * @returns Obiekt z danymi użytkownika lub błędem
   * 
   * @throws Error z message 'FIRE_DEPARTMENT_NOT_FOUND' jeśli jednostka OSP nie istnieje
   * @throws Error z message 'EMAIL_ALREADY_EXISTS' jeśli email jest już zarejestrowany
   * 
   * @example
   * ```typescript
   * const { data, error } = await authService.registerUser({
   *   email: 'test@example.com',
   *   password: 'StrongPass123!',
   *   profile: {
   *     fire_department_id: 'uuid',
   *     role: 'member'
   *   }
   * });
   * ```
   */
  async registerUser(
    command: RegisterUserCommand
  ): Promise<{ data: RegisterResponseDTO | null; error: Error | null }> {
    try {
      // 1. Sprawdzenie istnienia fire_department
      const fireDeptExists = await this.validateFireDepartmentExists(
        command.profile.fire_department_id
      );
      
      if (!fireDeptExists) {
        return {
          data: null,
          error: new Error('FIRE_DEPARTMENT_NOT_FOUND')
        };
      }
      
      // 2. Utworzenie użytkownika przez Supabase Auth
      // Ustaw docelowy URL przekierowania z e-maila potwierdzającego
      const siteUrl =
        process.env.PUBLIC_SITE_URL ||
        (typeof import.meta !== 'undefined' ? (import.meta as any).env?.PUBLIC_SITE_URL : undefined) ||
        process.env.RENDER_EXTERNAL_URL ||
        'https://meldunki-app.onrender.com';

      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: command.email,
        password: command.password,
        options: {
          emailRedirectTo: `${siteUrl}/login`,
          data: {
            fire_department_id: command.profile.fire_department_id,
            first_name: command.profile.first_name,
            last_name: command.profile.last_name,
            role: command.profile.role
          }
        }
      });
      
      console.log('Supabase signUp response:', { 
        user: authData?.user?.id, 
        session: !!authData?.session,
        error: authError?.message 
      });
      
      if (authError) {
        console.error('Supabase signUp error:', authError);
        // Sprawdzenie czy email już istnieje
        if (authError.message.includes('already registered') || 
            authError.message.includes('already been registered') ||
            authError.message.includes('User already registered')) {
          return {
            data: null,
            error: new Error('EMAIL_ALREADY_EXISTS')
          };
        }
        
        return { data: null, error: authError };
      }
      
      if (!authData.user) {
        console.error('No user created:', authData);
        return {
          data: null,
          error: new Error('User not created')
        };
      }
      
      // Sprawdź czy sesja istnieje (może być null jeśli wymagane jest potwierdzenie emaila)
      if (!authData.session) {
        console.log('No session created - email confirmation may be required');
        // Zwróć sukces ale bez sesji - użytkownik musi potwierdzić email
        return {
          data: {
            user: {
              id: authData.user.id,
              email: authData.user.email!,
              created_at: authData.user.created_at
            },
            profile: null as any, // Profil zostanie utworzony po potwierdzeniu emaila
            session: null as any
          },
          error: null
        };
      }
      
      // 3. Pobranie utworzonego profilu (utworzonego przez trigger)
      // Czekamy chwilę na zakończenie triggera
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile creation failed:', profileError);
        return {
          data: null,
          error: profileError || new Error('Profile not created')
        };
      }
      
      // 4. Formatowanie odpowiedzi
      const user: UserDTO = {
        id: authData.user.id,
        email: authData.user.email!,
        created_at: authData.user.created_at
      };
      
      const profileDTO: ProfileDTO = {
        id: profile.id,
        fire_department_id: profile.fire_department_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
      
      const session: SessionDTO = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at!,
        expires_in: authData.session.expires_in!
      };
      
      return {
        data: {
          user,
          profile: profileDTO,
          session
        },
        error: null
      };
    } catch (error) {
      console.error('Unexpected error in registerUser:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
  
  /**
   * Loguje użytkownika do systemu
   * 
   * @param email - Email użytkownika
   * @param password - Hasło użytkownika
   * @returns Obiekt z danymi użytkownika, profilem i sesją lub błędem
   * 
   * @example
   * ```typescript
   * const { data, error } = await authService.loginUser('test@example.com', 'password');
   * ```
   */
  async loginUser(
    email: string,
    password: string
  ): Promise<{ data: RegisterResponseDTO | null; error: Error | null }> {
    try {
      // 1. Logowanie przez Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        return {
          data: null,
          error: new Error('INVALID_CREDENTIALS')
        };
      }
      
      if (!authData.user || !authData.session) {
        return {
          data: null,
          error: new Error('Authentication failed')
        };
      }
      
      // 2. Pobranie profilu użytkownika
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile fetch failed:', profileError);
        return {
          data: null,
          error: profileError || new Error('Profile not found')
        };
      }
      
      // 3. Formatowanie odpowiedzi (używamy tego samego typu co register)
      const user: UserDTO = {
        id: authData.user.id,
        email: authData.user.email!,
        created_at: authData.user.created_at
      };
      
      const profileDTO: ProfileDTO = {
        id: profile.id,
        fire_department_id: profile.fire_department_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
      
      const session: SessionDTO = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at!,
        expires_in: authData.session.expires_in!
      };
      
      return {
        data: {
          user,
          profile: profileDTO,
          session
        },
        error: null
      };
    } catch (error) {
      console.error('Unexpected error in loginUser:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
  
  /**
   * Sprawdza czy jednostka OSP istnieje w bazie danych
   * 
   * @param id - UUID jednostki OSP
   * @returns true jeśli jednostka istnieje, false w przeciwnym wypadku
   * 
   * @private
   */
  private async validateFireDepartmentExists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('fire_departments')
      .select('id')
      .eq('id', id)
      .single();
    
    return !error && !!data;
  }
}

