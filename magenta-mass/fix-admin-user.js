/**
 * Naprawa konta administratora - najprostsza metoda
 * Uruchom: node fix-admin-user.js
 */

import { createClient } from '@supabase/supabase-js';

// Wpisz tutaj swoje dane Supabase (lub użyj .env)
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://sodwkdnwagiivbazygmq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZHdrZG53YWdpaXZiYXp5Z21xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYwMjM3MCwiZXhwIjoyMDc3MTc4MzcwfQ.2iOwFJ3rnk6PlZmBwpW268RsQ1jD32T0fdFstB-7AOM';

// Sprawdź czy zmienne są ustawione (nie są wartościami domyślnymi lub puste)
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || 
    SUPABASE_URL.includes('WPROWADŹ') || SUPABASE_SERVICE_KEY.includes('WPROWADŹ')) {
  console.error('❌ Uzupełnij SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY w pliku!');
  console.error('   Albo ustaw je w zmiennych środowiskowych');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixAdminUser() {
  try {
    console.log('🔧 Naprawa konta administratora...\n');

    const adminEmail = 'admin@firelog.pl';
    const adminPassword = 'Admin123!@#';

    // 1. Sprawdź czy użytkownik istnieje (poprzez listUsers)
    console.log('🔍 Sprawdzanie czy użytkownik istnieje...');
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Błąd podczas sprawdzania użytkowników:', listError.message);
      return;
    }

    const existingUser = usersList.users?.find(u => u.email === adminEmail);
    let userId;

    if (existingUser) {
      console.log('✅ Użytkownik już istnieje, resetuję hasło...');
      userId = existingUser.id;

      // Zresetuj hasło przez oficjalne API
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true // Potwierdź email
      });

      if (updateError) {
        console.error('❌ Błąd resetowania hasła:', updateError.message);
        return;
      }

      console.log('✅ Hasło zostało zresetowane\n');
    } else {
      console.log('📝 Tworzenie nowego użytkownika...');

      // Utwórz nowego użytkownika przez oficjalne API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: 'System',
          last_name: 'Administrator'
        }
      });

      if (createError) {
        console.error('❌ Błąd tworzenia użytkownika:', createError.message);
        return;
      }

      if (!newUser?.user) {
        console.error('❌ Nie udało się utworzyć użytkownika');
        return;
      }

      userId = newUser.user.id;
      console.log('✅ Użytkownik został utworzony\n');
    }

    // 2. Poczekaj chwilę na trigger (automatyczne utworzenie profilu)
    console.log('⏳ Czekam na utworzenie profilu...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Sprawdź i utwórz/zaktualizuj profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Pobierz pierwszą jednostkę OSP
    const { data: fireDept } = await supabase
      .from('fire_departments')
      .select('id')
      .limit(1)
      .single();

    if (!fireDept) {
      console.error('❌ Brak jednostek OSP! Najpierw dodaj jednostkę OSP.');
      return;
    }

    if (profileError || !profile) {
      console.log('📝 Tworzenie profilu administratora...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          fire_department_id: fireDept.id,
          first_name: 'System',
          last_name: 'Administrator',
          role: 'admin'
        });

      if (insertError) {
        console.error('❌ Błąd tworzenia profilu:', insertError.message);
        return;
      }
      console.log('✅ Profil został utworzony\n');
    } else {
      console.log('📝 Aktualizowanie profilu...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          fire_department_id: fireDept.id,
          first_name: 'System',
          last_name: 'Administrator'
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Błąd aktualizacji profilu:', updateError.message);
        return;
      }
      console.log('✅ Profil został zaktualizowany\n');
    }

    // 4. Podsumowanie
    console.log('🎉 Konto administratora gotowe!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Hasło:', adminPassword);
    console.log('👤 Rola: Administrator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Możesz się teraz zalogować!');
    console.log('🔗 http://localhost:4321/login');
    console.log('\n⚠️  WAŻNE: Zmień hasło po pierwszym logowaniu!');

  } catch (error) {
    console.error('❌ Nieoczekiwany błąd:', error);
  }
}

// Uruchom
fixAdminUser();

