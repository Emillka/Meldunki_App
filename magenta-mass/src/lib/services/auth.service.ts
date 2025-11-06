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
      
      // Update profile with is_verified if provided
      if (command.profile.is_verified !== undefined) {
        const { error: updateError } = await this.supabase
          .from('profiles')
          .update({ is_verified: command.profile.is_verified } as any)
          .eq('id', authData.user.id);
        
        if (updateError) {
          console.error('Failed to update is_verified:', updateError);
          // Don't fail registration, just log the error
        } else {
          // Update profile object for response
          (profile as any).is_verified = command.profile.is_verified;
        }
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
        is_verified: (profile as any).is_verified ?? false,
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
      
      // 2. Sprawdzenie czy email został potwierdzony
      if (!authData.user.email_confirmed_at) {
        return {
          data: null,
          error: new Error('EMAIL_NOT_CONFIRMED')
        };
      }
      
      // 3. Pobranie profilu użytkownika
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
      
      // 4. Formatowanie odpowiedzi (używamy tego samego typu co register)
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
        is_verified: (profile as any).is_verified ?? false,
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
  
  /**
   * Wysyła email z linkiem resetowania hasła
   * 
   * @param email - Email użytkownika, który chce zresetować hasło
   * @returns Obiekt z informacją o sukcesie lub błędem
   */
  async requestPasswordReset(email: string): Promise<{ data: { message: string } | null; error: Error | null }> {
    try {
      const siteUrl =
        process.env.PUBLIC_SITE_URL ||
        (typeof import.meta !== 'undefined' ? (import.meta as any).env?.PUBLIC_SITE_URL : undefined) ||
        process.env.RENDER_EXTERNAL_URL ||
        'https://meldunki-app.onrender.com';

      const redirectUrl = `${siteUrl}/reset-password`;
      
      console.log('=== Password Reset Request ===');
      console.log('Email:', email);
      console.log('Redirect URL:', redirectUrl);
      console.log('Site URL:', siteUrl);
      console.log('Using Supabase URL:', process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL);
      
      // Check if user exists first (optional, but helps with debugging)
      // Note: Supabase will not send email if user doesn't exist, but won't return error
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
        
        if (serviceRoleKey && supabaseUrl) {
          const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
          const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
          
          if (!listError && users) {
            const userExists = users.some(user => user.email?.toLowerCase() === email.toLowerCase());
            console.log('User exists in database:', userExists);
            if (!userExists) {
              console.warn('⚠️ User with this email does not exist in database');
            }
          }
        }
      } catch (checkError) {
        console.warn('Could not check if user exists:', checkError);
        // Continue anyway - Supabase will handle it
      }

      // Try using anon key client for resetPasswordForEmail (may work better than service role)
      // Some Supabase configurations require anon key for password reset
      const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
      const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      
      let resetClient = this.supabase;
      
      // Try with anon key if available (resetPasswordForEmail may require anon key)
      if (anonKey && supabaseUrl) {
        console.log('Trying resetPasswordForEmail with anon key client...');
        const { createClient } = await import('@supabase/supabase-js');
        resetClient = createClient(supabaseUrl, anonKey);
      } else {
        console.log('Using service role key client for resetPasswordForEmail...');
      }

      // Use the same configuration as signUp for consistency
      // Supabase may require emailRedirectTo to be in the same format
      console.log('Calling resetPasswordForEmail...');
      const { data, error } = await resetClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
        // Add captcha token if available (for production)
        // captchaToken: captchaToken
      });

      if (error) {
        console.error('❌ Password reset request error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          email: email,
          redirectUrl: redirectUrl,
          fullError: JSON.stringify(error, null, 2)
        });
        
        // Check for specific error types
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          console.error('⚠️ Rate limit exceeded for password reset');
        }
        if (error.message?.includes('email') || error.message?.includes('not found')) {
          console.error('⚠️ Email not found or invalid');
        }
        
        return {
          data: null,
          error: error
        };
      }

      console.log('✅ Password reset email sent successfully:', {
        email: email,
        data: data,
        redirectUrl: redirectUrl
      });
      console.log('=== End Password Reset Request ===');

      return {
        data: {
          message: 'Link resetowania hasła został wysłany na podany adres email.'
        },
        error: null
      };
    } catch (error) {
      console.error('❌ Unexpected error in requestPasswordReset:', {
        error: error,
        email: email,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      });
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
  
  /**
   * Resetuje hasło użytkownika używając tokena z linku
   * 
   * @param newPassword - Nowe hasło
   * @returns Obiekt z informacją o sukcesie lub błędem
   */
  async resetPassword(newPassword: string): Promise<{ data: { message: string } | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password reset error:', error);
        return {
          data: null,
          error: error
        };
      }

      return {
        data: {
          message: 'Hasło zostało pomyślnie zresetowane.'
        },
        error: null
      };
    } catch (error) {
      console.error('Unexpected error in resetPassword:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}

