/**
 * Skrypt do tworzenia konta administratora
 * Uruchom: node src/scripts/create-admin-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Załaduj zmienne środowiskowe
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Brak zmiennych środowiskowych SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🚀 Tworzenie konta administratora...');
    
    // Dane administratora
    const adminData = {
      email: 'admin@firelog.pl',
      password: 'Admin123!@#',
      profile: {
        fire_department_id: null, // Będzie ustawione później
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin'
      }
    };
    
    // 1. Sprawdź czy istnieje już administrator
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id, user:auth.users!inner(email)')
      .eq('role', 'admin');
    
    if (checkError) {
      console.error('❌ Błąd podczas sprawdzania istniejących administratorów:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  Administrator już istnieje:');
      existingUsers.forEach(user => {
        console.log(`   - ${user.user.email}`);
      });
      return;
    }
    
    // 2. Pobierz pierwszą jednostkę OSP (jako domyślną)
    const { data: fireDepartments, error: deptError } = await supabase
      .from('fire_departments')
      .select('id, name')
      .limit(1);
    
    if (deptError || !fireDepartments || fireDepartments.length === 0) {
      console.error('❌ Brak jednostek OSP w bazie danych. Najpierw dodaj jednostkę OSP.');
      return;
    }
    
    const defaultFireDept = fireDepartments[0];
    console.log(`📋 Używanie jednostki OSP: ${defaultFireDept.name}`);
    
    // 3. Utwórz użytkownika w Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Automatycznie potwierdź email
      user_metadata: {
        fire_department_id: defaultFireDept.id,
        first_name: adminData.profile.first_name,
        last_name: adminData.profile.last_name,
        role: adminData.profile.role
      }
    });
    
    if (authError) {
      console.error('❌ Błąd podczas tworzenia użytkownika:', authError);
      return;
    }
    
    if (!authData.user) {
      console.error('❌ Nie udało się utworzyć użytkownika');
      return;
    }
    
    console.log('✅ Użytkownik utworzony w Supabase Auth');
    
    // 4. Sprawdź czy profil został utworzony automatycznie
    await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj na trigger
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('❌ Profil nie został utworzony automatycznie. Tworzenie ręczne...');
      
      // Utwórz profil ręcznie
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          fire_department_id: defaultFireDept.id,
          first_name: adminData.profile.first_name,
          last_name: adminData.profile.last_name,
          role: adminData.profile.role
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ Błąd podczas tworzenia profilu:', createProfileError);
        return;
      }
      
      console.log('✅ Profil utworzony ręcznie');
    } else {
      console.log('✅ Profil utworzony automatycznie');
    }
    
    // 5. Wyświetl informacje o utworzonym koncie
    console.log('\n🎉 Konto administratora zostało utworzone pomyślnie!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Hasło:', adminData.password);
    console.log('👤 Rola: Administrator');
    console.log('🏢 Jednostka OSP:', defaultFireDept.name);
    console.log('\n⚠️  WAŻNE: Zmień hasło po pierwszym logowaniu!');
    console.log('🔗 Link do logowania: http://localhost:4321/login');
    
  } catch (error) {
    console.error('❌ Nieoczekiwany błąd:', error);
  }
}

// Uruchom skrypt
createAdminUser();
