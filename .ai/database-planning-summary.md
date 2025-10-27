# Podsumowanie planowania bazy danych FireLog MVP

Data: 23 października 2025

---

## Decyzje podjęte przez użytkownika

### Runda 1 (Pytania fundamentalne)

1. **Jednostki straży pożarnej**: Użytkownik podczas rejestracji wybiera jednostkę z listy rozwijanej. Baza danych zostanie zasilona danymi przez administratora systemu.

2. **Lokalizacja w meldunkach**: Przechowywać tylko adres tekstowy (bez współrzędnych geograficznych).

3. **Siły i środki**: Zgoda na rekomendację – pole tekstowe z dodatkową kolumną JSONB dla strukturalnych danych.

4. **System ról**: Zgoda na implementację podstawowego systemu ról już w MVP (firefighter, admin, commander).

5. **Relacja użytkownik-meldunek**: Zgoda na model gdzie meldunek ma autora, ale jest widoczny dla całej jednostki poprzez RLS policies.

6. **Dowódca i kierowca**: Zgoda na pola tekstowe (nie referencje do tabeli users).

7. **Wyniki analizy AI**: Zgoda na przechowywanie jako kolumny w tabeli reports.

8. **Indeksy**: Zgoda na wszystkie proponowane indeksy dla optymalizacji wydajności.

9. **Row Level Security**: Zgoda na wszystkie proponowane polityki RLS.

10. **Soft delete**: Zgoda na implementację soft delete z polami deleted_at i deleted_by_user_id.

### Runda 2 (Pytania szczegółowe)

1. **Struktura tabeli fire_departments**: Zgoda na proponowaną strukturę z unique constraint.

2. **Data zdarzenia**: **ZMIANA** – data zdarzenia ma być generowana automatycznie w chwili utworzenia meldunku (nie wpisywana ręcznie).

3. **Czasy akcji**: **ZMIANA** – nie będzie żadnych pól związanych z czasem trwania akcji (start_time, end_time, duration).

4. **Tabela users/profiles**: Zgoda na model z tabelą profiles powiązaną z Supabase Auth.

5. **Ograniczenia dat**: **ZMIANA** – ominąć poprzez automatyczne wstawienie daty (generowana przez system).

6. **Struktura JSONB**: Zgoda na proponowany schemat JSON dla resources_deployed_structured.

7. **Audit log**: Zgoda na utworzenie tabeli report_audit_log dla historii zmian.

8. **Kategorie AI**: Zgoda na użycie ENUM dla ai_category.

9. **Logi eksportów**: Zgoda na utworzenie tabeli export_logs.

10. **Triggery**: Zgoda na wszystkie proponowane triggery i funkcje PostgreSQL.

---

## Dopasowane rekomendacje

### 1. Struktura tabel

**fire_departments**
```sql
CREATE TABLE fire_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voivodeship VARCHAR(50) NOT NULL,
  county VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_fire_department UNIQUE(voivodeship, county, name)
);
```

**profiles** (rozszerzenie Supabase Auth)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fire_department_id UUID NOT NULL REFERENCES fire_departments(id),
  role VARCHAR(20) DEFAULT 'firefighter' CHECK (role IN ('firefighter', 'admin', 'commander')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**incident_category ENUM**
```sql
CREATE TYPE incident_category AS ENUM (
  'Pożar',
  'Miejscowe Zagrożenie',
  'Wypadek Drogowy',
  'Alarm Fałszywy',
  'Inne'
);
```

**reports**
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  fire_department_id UUID NOT NULL REFERENCES fire_departments(id),
  
  -- Pola wymagane
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_name VARCHAR(255) NOT NULL,
  location_address TEXT NOT NULL,
  
  -- Pola opcjonalne
  incident_details TEXT,
  resources_deployed TEXT,
  resources_deployed_structured JSONB,
  commander_name VARCHAR(100),
  driver_name VARCHAR(100),
  
  -- Analiza AI
  ai_category incident_category,
  ai_summary TEXT,
  ai_analyzed_at TIMESTAMP WITH TIME ZONE,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by_user_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**report_audit_log**
```sql
CREATE TABLE report_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**export_logs**
```sql
CREATE TABLE export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  fire_department_id UUID NOT NULL REFERENCES fire_departments(id),
  export_type VARCHAR(50) NOT NULL,
  date_from DATE,
  date_to DATE,
  reports_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Indeksy

```sql
-- Indeksy dla tabeli reports
CREATE INDEX idx_reports_fire_department_id ON reports(fire_department_id);
CREATE INDEX idx_reports_created_by_user_id ON reports(created_by_user_id);
CREATE INDEX idx_reports_incident_date ON reports(incident_date DESC);
CREATE INDEX idx_reports_ai_category ON reports(ai_category);
CREATE INDEX idx_reports_deleted_at ON reports(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_resources_gin ON reports USING GIN (resources_deployed_structured);

-- Indeksy dla tabeli profiles
CREATE INDEX idx_profiles_fire_department_id ON profiles(fire_department_id);

-- Indeksy dla tabeli report_audit_log
CREATE INDEX idx_audit_report_id ON report_audit_log(report_id);
CREATE INDEX idx_audit_timestamp ON report_audit_log(timestamp DESC);

-- Indeksy dla tabeli export_logs
CREATE INDEX idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX idx_export_logs_fire_department_id ON export_logs(fire_department_id);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at DESC);
```

### 3. Triggery i funkcje

**Auto-update updated_at**
```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_modtime
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_fire_departments_modtime
BEFORE UPDATE ON fire_departments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
```

**Auto-create profile przy rejestracji**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, fire_department_id, first_name, last_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'fire_department_id')::UUID,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Prevent hard delete (wymuszenie soft delete)**
```sql
CREATE OR REPLACE FUNCTION prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Hard delete not allowed. Use soft delete by setting deleted_at.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_hard_delete_reports
BEFORE DELETE ON reports
FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete();
```

**Audit log trigger**
```sql
CREATE OR REPLACE FUNCTION log_report_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}';
  old_vals JSONB := '{}';
  new_vals JSONB := '{}';
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- Porównaj pola i zapisz tylko zmienione
    IF OLD.incident_name IS DISTINCT FROM NEW.incident_name THEN
      changed_fields := changed_fields || '{"incident_name": true}';
      old_vals := old_vals || jsonb_build_object('incident_name', OLD.incident_name);
      new_vals := new_vals || jsonb_build_object('incident_name', NEW.incident_name);
    END IF;
    -- ... podobnie dla innych pól ...
    
    INSERT INTO report_audit_log (report_id, user_id, action, changed_fields, old_values, new_values)
    VALUES (NEW.id, auth.uid(), 'updated', changed_fields, old_vals, new_vals);
    
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO report_audit_log (report_id, user_id, action, new_values)
    VALUES (NEW.id, auth.uid(), 'created', to_jsonb(NEW));
    
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO report_audit_log (report_id, user_id, action, old_values)
    VALUES (OLD.id, auth.uid(), 'deleted', to_jsonb(OLD));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_report_changes
AFTER INSERT OR UPDATE OR DELETE ON reports
FOR EACH ROW EXECUTE FUNCTION log_report_changes();
```

**Walidacja fire_department_id**
```sql
CREATE OR REPLACE FUNCTION validate_user_fire_department()
RETURNS TRIGGER AS $$
DECLARE
  user_dept_id UUID;
BEGIN
  SELECT fire_department_id INTO user_dept_id
  FROM profiles
  WHERE id = auth.uid();
  
  IF NEW.fire_department_id != user_dept_id THEN
    RAISE EXCEPTION 'User can only create reports for their own fire department';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_report_fire_department
BEFORE INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION validate_user_fire_department();
```

### 4. Row Level Security (RLS) Policies

**Włączenie RLS**
```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
```

**Policies dla tabeli reports**
```sql
-- SELECT: Użytkownik może odczytać aktywne meldunki ze swojej jednostki
CREATE POLICY "Users can view reports from their fire department"
ON reports FOR SELECT
TO authenticated
USING (
  fire_department_id = (
    SELECT fire_department_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

-- INSERT: Użytkownik może tworzyć meldunki dla swojej jednostki
CREATE POLICY "Users can create reports for their fire department"
ON reports FOR INSERT
TO authenticated
WITH CHECK (
  fire_department_id = (
    SELECT fire_department_id FROM profiles WHERE id = auth.uid()
  )
  AND created_by_user_id = auth.uid()
);

-- UPDATE: Tylko autor lub administrator jednostki może edytować
CREATE POLICY "Users can update their own reports or admins can update any"
ON reports FOR UPDATE
TO authenticated
USING (
  (created_by_user_id = auth.uid() OR
   EXISTS (
     SELECT 1 FROM profiles 
     WHERE id = auth.uid() 
     AND role = 'admin'
     AND fire_department_id = reports.fire_department_id
   ))
  AND deleted_at IS NULL
)
WITH CHECK (
  (created_by_user_id = auth.uid() OR
   EXISTS (
     SELECT 1 FROM profiles 
     WHERE id = auth.uid() 
     AND role = 'admin'
     AND fire_department_id = reports.fire_department_id
   ))
);

-- DELETE: Soft delete - tylko autor lub administrator
CREATE POLICY "Users can soft delete their own reports or admins can delete any"
ON reports FOR UPDATE
TO authenticated
USING (
  (created_by_user_id = auth.uid() OR
   EXISTS (
     SELECT 1 FROM profiles 
     WHERE id = auth.uid() 
     AND role = 'admin'
     AND fire_department_id = reports.fire_department_id
   ))
  AND deleted_at IS NULL
)
WITH CHECK (deleted_at IS NOT NULL);
```

**Policies dla tabeli profiles**
```sql
-- SELECT: Użytkownik może odczytać podstawowe dane innych użytkowników ze swojej jednostki
CREATE POLICY "Users can view profiles from their fire department"
ON profiles FOR SELECT
TO authenticated
USING (
  fire_department_id = (
    SELECT fire_department_id FROM profiles WHERE id = auth.uid()
  )
);

-- UPDATE: Użytkownik może edytować tylko swój profil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Administratorzy mogą zarządzać użytkownikami swojej jednostki
CREATE POLICY "Admins can manage users in their fire department"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND fire_department_id = profiles.fire_department_id
  )
);
```

**Policies dla tabeli fire_departments**
```sql
-- SELECT: Wszyscy zalogowani użytkownicy mogą przeglądać jednostki (dla listy rozwijanej)
CREATE POLICY "Authenticated users can view all fire departments"
ON fire_departments FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Tylko administratorzy systemu (nie jednostek)
-- Zarządzane przez backend lub bezpośrednio w bazie
```

**Policies dla tabeli report_audit_log**
```sql
-- SELECT: Tylko administratorzy jednostki mogą przeglądać audit log
CREATE POLICY "Admins can view audit logs for their fire department"
ON report_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND fire_department_id IN (
      SELECT fire_department_id FROM reports WHERE id = report_audit_log.report_id
    )
  )
);

-- INSERT: Tylko przez triggery (SECURITY DEFINER)
```

**Policies dla tabeli export_logs**
```sql
-- SELECT: Administratorzy mogą przeglądać logi eksportów swojej jednostki
CREATE POLICY "Admins can view export logs for their fire department"
ON export_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND fire_department_id = export_logs.fire_department_id
  )
);

-- INSERT: Użytkownicy mogą tworzyć logi eksportu dla swojej jednostki
CREATE POLICY "Users can create export logs for their fire department"
ON export_logs FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND fire_department_id = (
    SELECT fire_department_id FROM profiles WHERE id = auth.uid()
  )
);
```

### 5. Struktura JSONB dla resources_deployed_structured

Rekomendowany schemat:
```json
{
  "vehicles": [
    {
      "type": "GBA",
      "registration": "DSW 1234",
      "model": "MAN TGM 13.290"
    },
    {
      "type": "SLRt",
      "registration": "DSW 5678",
      "model": "Mercedes Atego"
    }
  ],
  "personnel": {
    "total": 12,
    "from_unit": 8,
    "external": 4,
    "breakdown": {
      "firefighters": 10,
      "commanders": 2
    }
  },
  "equipment": [
    "autopompa",
    "podest mechaniczny",
    "sprzęt hydrauliczny",
    "agregat prądotwórczy"
  ],
  "water_used_liters": 5000
}
```

Przykładowe zapytania JSONB:
```sql
-- Znajdź meldunki z użyciem konkretnego pojazdu
SELECT * FROM reports 
WHERE resources_deployed_structured @> '{"vehicles": [{"type": "GBA"}]}';

-- Znajdź meldunki z więcej niż 10 strażakami
SELECT * FROM reports 
WHERE (resources_deployed_structured->'personnel'->>'total')::int > 10;

-- Znajdź meldunki z użyciem agregatu prądotwórczego
SELECT * FROM reports 
WHERE resources_deployed_structured->'equipment' ? 'agregat prądotwórczy';
```

---

## Podsumowanie planowania bazy danych

### Główne wymagania

Schemat bazy danych został zaprojektowany dla aplikacji **FireLog MVP** - systemu do elektronicznej rejestracji meldunków straży pożarnej. Główne założenia:

1. **Multi-tenancy na poziomie jednostek OSP** - każda jednostka straży pożarnej ma izolowane dane, ale użytkownicy mogą współdzielić meldunki w ramach jednostki
2. **Bezpieczeństwo przez RLS** - wszystkie tabele chronione politykami Row Level Security
3. **Audytowalność** - soft delete i audit log zapewniają śledzenie zmian
4. **Elastyczność** - JSONB dla strukturalnych danych opcjonalnych
5. **Automatyzacja** - triggery dla update timestamps, tworzenia profili, walidacji

### Kluczowe encje i relacje

```
auth.users (Supabase Auth)
    ↓ 1:1
profiles
    ↓ N:1
fire_departments

profiles (created_by_user_id)
    ↓ 1:N
reports
    ↓ N:1
fire_departments

reports
    ↓ 1:N
report_audit_log

profiles (user_id)
    ↓ 1:N
export_logs
    ↓ N:1
fire_departments
```

**Główne encje:**
- `fire_departments` - jednostki straży pożarnej (predefiniowane)
- `profiles` - profile użytkowników (rozszerzenie Supabase Auth)
- `reports` - meldunki z akcji
- `report_audit_log` - historia zmian meldunków
- `export_logs` - logi eksportów danych

### Ważne decyzje projektowe

1. **Data zdarzenia automatyczna**: Pole `incident_date` jest ustawiane automatycznie na `CURRENT_DATE` przy tworzeniu meldunku, co upraszcza proces i eliminuje błędy.

2. **Brak czasów trwania akcji**: Rezygnacja z pól `start_time`, `end_time`, `duration` - to uproszczenie dla MVP, można dodać w przyszłości jeśli zajdzie potrzeba.

3. **Dual storage dla zasobów**: Pole tekstowe `resources_deployed` dla szybkiego wprowadzania + JSONB `resources_deployed_structured` dla przyszłej analizy.

4. **Soft delete obowiązkowy**: Trigger `prevent_hard_delete()` wymusza miękkie usuwanie, co zapewnia możliwość odzyskania danych i audyt.

5. **ENUM dla kategorii AI**: Typ `incident_category` zapewnia spójność danych i wydajność zapytań.

### Bezpieczeństwo

**Row Level Security** zapewnia:
- Izolację danych między jednostkami OSP
- Kontrolę dostępu opartą na rolach (firefighter, admin, commander)
- Ograniczenie edycji do autorów meldunków lub administratorów
- Dostęp do audit logów tylko dla administratorów

**Audytowalność:**
- `report_audit_log` śledzi wszystkie zmiany w meldunkach
- `export_logs` zapisuje kto i kiedy eksportował dane
- Soft delete z informacją kto i kiedy usunął rekord

**Walidacja:**
- Triggery walidujące zgodność `fire_department_id` użytkownika z meldunkiem
- Check constraints dla ról użytkowników
- Unique constraints dla jednostek OSP

### Skalowalność

**Indeksy** zoptymalizowane pod:
- Filtrowanie po jednostce (`fire_department_id`)
- Sortowanie po dacie zdarzenia
- Wyszukiwanie po kategorii AI
- Zapytania JSONB (GIN index)
- Filtrowanie aktywnych rekordów (partial index na `deleted_at`)

**Partycjonowanie** (przyszłość):
- Możliwość partycjonowania tabeli `reports` po dacie zdarzenia lub jednostce przy wzroście danych
- `report_audit_log` może być partycjonowana po miesiącach

### Integracja z Supabase

- Wykorzystanie `auth.users` dla autentykacji
- Tabela `profiles` jako rozszerzenie z dodatkowymi danymi
- Trigger automatycznie tworzący profil przy rejestracji
- RLS policies wykorzystujące `auth.uid()` dla kontroli dostępu
- Funkcje `SECURITY DEFINER` dla operacji wymagających podwyższonych uprawnień

### Kwestie techniczne

1. **Timestamp with timezone**: Wszystkie pola czasu używają `TIMESTAMP WITH TIME ZONE` dla poprawnej obsługi stref czasowych.

2. **UUID jako klucze główne**: Gen_random_uuid() zapewnia unikalne identyfikatory bez kolizji.

3. **JSONB vs JSON**: Użycie JSONB dla wydajności zapytań i indeksowania.

4. **Trigger chain**: Kolejność triggerów jest ważna (BEFORE vs AFTER) - update_modified_column musi być BEFORE, audit log AFTER.

---

## Nierozwiązane kwestie

### Wymagające decyzji przed implementacją:

1. **Zasilenie bazy jednostek OSP**:
   - Czy użytkownik dostarczy pełną listę jednostek (województwo, powiat, nazwa)?
   - W jakim formacie (CSV, Excel, SQL)?
   - Ile jednostek należy przewidzieć (setki, tysiące)?

2. **Domyślna rola użytkownika**:
   - Czy przy rejestracji wszyscy dostają rolę 'firefighter'?
   - Jak administratorzy są promowani? Przez super-admina czy samorejestracja pierwszego użytkownika jednostki?

3. **Trigger dla audit log - szczegóły implementacji**:
   - Czy logować wszystkie pola czy tylko wybrane?
   - Czy zapisywać pełne stare/nowe wartości czy tylko zmienione pola?
   - Limit rozmiaru `report_audit_log` - czy czyścić stare wpisy?

4. **Eksport meldunków**:
   - Jakie formaty eksportu (CSV, JSON, inne)?
   - Czy eksport powinien być asynchroniczny (dla dużych zbiorów danych)?
   - Czy zapisywać plik eksportu w storage czy tylko metadane w `export_logs`?

5. **Analiza AI**:
   - Czy analiza AI powinna być uruchamiana automatycznie przy tworzeniu meldunku czy na żądanie?
   - Jak obsługiwać retry w przypadku błędu API?
   - Czy zapisywać metadata o użytym modelu AI w bazie?

### Do rozważenia w przyszłości:

1. **Wersjonowanie meldunków**: Obecnie audit log śledzi zmiany, ale może być potrzeba przechowywania pełnych wersji dokumentów.

2. **Załączniki**: Zdjęcia, dokumenty PDF - czy tabela `report_attachments` z referencją do Supabase Storage?

3. **Komentarze/notatki**: Możliwość dodawania komentarzy do meldunków przez innych członków jednostki.

4. **Szablony meldunków**: Predefiniowane szablony dla typowych rodzajów akcji.

5. **Powiadomienia**: System notyfikacji dla nowych/edytowanych meldunków - tabela `notifications`?

6. **Statystyki i raporty**: Zmaterializowane widoki dla szybkich agregatów statystycznych?

7. **Backup i retencja**: Polityka przechowywania danych, archiwizacja starych meldunków.

---

## Następne kroki

1. **Implementacja schematu**: Utworzenie migration files dla Supabase
2. **Zasilenie danymi testowymi**: Przygotowanie przykładowych jednostek OSP i użytkowników
3. **Testy RLS policies**: Weryfikacja poprawności polityk bezpieczeństwa
4. **Dokumentacja API**: Określenie endpointów dla CRUD operacji
5. **Setup CI/CD**: Konfiguracja automatycznych testów migracji bazy danych

