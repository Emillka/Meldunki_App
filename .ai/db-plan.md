# Schemat Bazy Danych PostgreSQL – FireLog

## 1. Tabele z kolumnami, typami danych i ograniczeniami

### 1.1. `provinces` (Województwa)
Tabela zawierająca listę województw w Polsce.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator województwa |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Nazwa województwa |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

---

### 1.2. `counties` (Powiaty)
Tabela zawierająca listę powiatów przypisanych do województw.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator powiatu |
| `province_id` | UUID | NOT NULL, FOREIGN KEY → provinces(id) ON DELETE CASCADE | Identyfikator województwa |
| `name` | VARCHAR(100) | NOT NULL | Nazwa powiatu |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

**Ograniczenia:**
- `UNIQUE(province_id, name)` – unikalna kombinacja województwa i nazwy powiatu

---

### 1.3. `fire_departments` (Jednostki OSP)
Tabela zawierająca listę jednostek Ochotniczej Straży Pożarnej.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator jednostki |
| `county_id` | UUID | NOT NULL, FOREIGN KEY → counties(id) ON DELETE CASCADE | Identyfikator powiatu |
| `name` | VARCHAR(255) | NOT NULL | Nazwa jednostki OSP |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

**Ograniczenia:**
- `UNIQUE(county_id, name)` – unikalna kombinacja powiatu i nazwy jednostki

---

### 1.4. `profiles` (Profile użytkowników)
Tabela rozszerzająca dane użytkowników z `auth.users` (Supabase Auth).
This table is managed by Supabase Auth


| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Identyfikator użytkownika (ten sam co w auth.users) |
| `fire_department_id` | UUID | NOT NULL, FOREIGN KEY → fire_departments(id) ON DELETE RESTRICT | Identyfikator jednostki OSP |
| `first_name` | VARCHAR(100) | NULL | Imię użytkownika |
| `last_name` | VARCHAR(100) | NULL | Nazwisko użytkownika |
| `role` | VARCHAR(50) | NOT NULL, DEFAULT 'member' | Rola użytkownika (member, admin) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia profilu |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Ograniczenia:**
- `CHECK(role IN ('member', 'admin'))` – rola może być tylko 'member' lub 'admin'

---

### 1.5. `incidents` (Meldunki z akcji)
Główna tabela zawierająca meldunki straży pożarnej.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator meldunku |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE | Identyfikator użytkownika, który utworzył meldunek |
| `fire_department_id` | UUID | NOT NULL, FOREIGN KEY → fire_departments(id) ON DELETE RESTRICT | Identyfikator jednostki OSP |
| `incident_date` | DATE | NOT NULL | Data zdarzenia |
| `incident_name` | VARCHAR(255) | NOT NULL | Nazwa zdarzenia |
| `location_address` | TEXT | NULL | Adres zdarzenia |
| `location_latitude` | DECIMAL(10, 8) | NULL | Szerokość geograficzna |
| `location_longitude` | DECIMAL(11, 8) | NULL | Długość geograficzna |
| `description` | TEXT | NOT NULL | Szczegółowy opis przebiegu akcji |
| `forces_and_resources` | TEXT | NULL | Siły i środki zadysponowane |
| `commander` | VARCHAR(255) | NULL | Dowódca akcji |
| `driver` | VARCHAR(255) | NULL | Kierowca pojazdu |
| `start_time` | TIMESTAMPTZ | NOT NULL | Czas rozpoczęcia akcji |
| `end_time` | TIMESTAMPTZ | NULL | Czas zakończenia akcji |
| `category` | VARCHAR(100) | NULL | Kategoria zdarzenia (generowana przez AI) |
| `summary` | TEXT | NULL | Krótkie streszczenie akcji (generowane przez AI) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia meldunku |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Ograniczenia:**
- `CHECK(end_time IS NULL OR end_time >= start_time)` – czas zakończenia musi być późniejszy niż czas rozpoczęcia
- `CHECK(location_latitude IS NULL OR (location_latitude >= -90 AND location_latitude <= 90))` – walidacja szerokości geograficznej
- `CHECK(location_longitude IS NULL OR (location_longitude >= -180 AND location_longitude <= 180))` – walidacja długości geograficznej

---

## 2. Relacje między tabelami

### Hierarchia administracyjna:
- **provinces** (1) → (N) **counties** 
  - *Jedno województwo ma wiele powiatów*
  
- **counties** (1) → (N) **fire_departments**
  - *Jeden powiat ma wiele jednostek OSP*

### Użytkownicy:
- **fire_departments** (1) → (N) **profiles**
  - *Jedna jednostka OSP ma wielu użytkowników*
  
- **auth.users** (1) → (1) **profiles**
  - *Każdy użytkownik Supabase Auth ma dokładnie jeden profil*

### Meldunki:
- **profiles** (1) → (N) **incidents**
  - *Jeden użytkownik może utworzyć wiele meldunków*
  
- **fire_departments** (1) → (N) **incidents**
  - *Jedna jednostka OSP ma wiele meldunków*

---

## 3. Indeksy

### 3.1. Indeksy dla wydajności zapytań

```sql
-- Indeksy dla tabeli counties
CREATE INDEX idx_counties_province_id ON counties(province_id);

-- Indeksy dla tabeli fire_departments
CREATE INDEX idx_fire_departments_county_id ON fire_departments(county_id);

-- Indeksy dla tabeli profiles
CREATE INDEX idx_profiles_fire_department_id ON profiles(fire_department_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Indeksy dla tabeli incidents
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_fire_department_id ON incidents(fire_department_id);
CREATE INDEX idx_incidents_incident_date ON incidents(incident_date DESC);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_category ON incidents(category);

-- Indeks dla wyszukiwania pełnotekstowego (opcjonalnie)
CREATE INDEX idx_incidents_description_fts ON incidents USING gin(to_tsvector('polish', description));
CREATE INDEX idx_incidents_incident_name_fts ON incidents USING gin(to_tsvector('polish', incident_name));
```

---

## 4. Zasady PostgreSQL (Row Level Security - RLS)

### 4.1. Włączenie RLS dla wszystkich tabel

```sql
-- Włączenie RLS dla tabel użytkowników i meldunków
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
```

---

### 4.2. Polityki RLS dla tabeli `profiles`

#### Polityka odczytu własnego profilu
```sql
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);
```

#### Polityka odczytu profili z tej samej jednostki
```sql
CREATE POLICY "Users can view profiles from their fire department"
  ON profiles
  FOR SELECT
  USING (
    fire_department_id IN (
      SELECT fire_department_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

#### Polityka aktualizacji własnego profilu
```sql
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

#### Polityka tworzenia profilu (podczas rejestracji)
```sql
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### 4.3. Polityki RLS dla tabeli `incidents`

#### Polityka odczytu meldunków z własnej jednostki
```sql
CREATE POLICY "Users can view incidents from their fire department"
  ON incidents
  FOR SELECT
  USING (
    fire_department_id IN (
      SELECT fire_department_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

#### Polityka tworzenia meldunków
```sql
CREATE POLICY "Users can create incidents for their fire department"
  ON incidents
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND fire_department_id IN (
      SELECT fire_department_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

#### Polityka aktualizacji własnych meldunków
```sql
CREATE POLICY "Users can update their own incidents"
  ON incidents
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

#### Polityka usuwania własnych meldunków
```sql
CREATE POLICY "Users can delete their own incidents"
  ON incidents
  FOR DELETE
  USING (user_id = auth.uid());
```

---

### 4.4. Polityki dla administratorów (opcjonalne rozszerzenie)

```sql
-- Administratorzy mogą edytować wszystkie meldunki w swojej jednostce
CREATE POLICY "Admins can update all incidents in their department"
  ON incidents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND fire_department_id = incidents.fire_department_id
    )
  );

-- Administratorzy mogą usuwać wszystkie meldunki w swojej jednostce
CREATE POLICY "Admins can delete all incidents in their department"
  ON incidents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND fire_department_id = incidents.fire_department_id
    )
  );
```

---

## 5. Triggery i funkcje pomocnicze

### 5.1. Automatyczna aktualizacja `updated_at`

```sql
-- Funkcja do automatycznej aktualizacji pola updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla tabeli profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla tabeli incidents
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 5.2. Automatyczne tworzenie profilu po rejestracji (Supabase)

```sql
-- Funkcja tworząca profil użytkownika po rejestracji w auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, fire_department_id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'fire_department_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger wywoływany po utworzeniu nowego użytkownika
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. Dane pomocnicze i inicjalizacja

### 6.1. Wstępne wypełnienie słowników

```sql
-- Przykładowe województwa (do pełnej implementacji należy dodać wszystkie 16)
INSERT INTO provinces (name) VALUES
  ('mazowieckie'),
  ('małopolskie'),
  ('śląskie'),
  ('pomorskie'),
  ('dolnośląskie'),
  ('wielkopolskie'),
  ('zachodniopomorskie'),
  ('lubelskie'),
  ('łódzkie'),
  ('podkarpackie'),
  ('warmińsko-mazurskie'),
  ('kujawsko-pomorskie'),
  ('podlaskie'),
  ('świętokrzyskie'),
  ('lubuskie'),
  ('opolskie');
```

---

## 7. Uwagi i decyzje projektowe

### 7.1. Normalizacja
Schemat został znormalizowany do **3NF (Third Normal Form)**:
- Wszystkie atrybuty zależą tylko od klucza głównego
- Brak zależności przechodnich
- Struktura hierarchiczna (województwa → powiaty → jednostki) zapewnia spójność danych

### 7.2. Użycie UUID zamiast SERIAL
- **Zalety:** bezpieczniejsze (brak przewidywalnych ID), łatwiejsze do replikacji i scalania baz
- **Wady:** większy rozmiar (128 bitów vs 32/64 bity), wolniejsze indeksowanie
- **Decyzja:** UUID jest lepszym wyborem dla aplikacji webowej z uwagi na bezpieczeństwo

### 7.3. Obsługa lokalizacji
Schemat przewiduje dwie opcje zapisu lokalizacji:
- **Adres tekstowy** (`location_address`)
- **Współrzędne GPS** (`location_latitude`, `location_longitude`)

Opcjonalnie można dodać typ `GEOGRAPHY(POINT)` dla zaawansowanych zapytań geoprzestrzennych:
```sql
ALTER TABLE incidents ADD COLUMN location_point GEOGRAPHY(POINT, 4326);
```

### 7.4. Kategorie zdarzeń
Pole `category` jest typu `VARCHAR` dla elastyczności. Alternatywnie można utworzyć osobną tabelę `incident_categories` i użyć relacji, jeśli lista kategorii będzie ściśle określona.

Przykładowe kategorie:
- Pożar
- Miejscowe Zagrożenie
- Fałszywy Alarm
- Wypadek Drogowy
- Inne

### 7.5. Soft Delete vs Hard Delete
Aktualnie schemat używa **hard delete**. Jeśli wymagane jest zachowanie historii usuniętych rekordów, należy dodać kolumny:
```sql
ALTER TABLE incidents ADD COLUMN deleted_at TIMESTAMPTZ NULL;
ALTER TABLE incidents ADD COLUMN deleted_by UUID NULL;
```

I zmodyfikować polityki RLS, aby wykluczały rekordy z `deleted_at IS NOT NULL`.

### 7.6. Wydajność zapytań
- Indeksy zostały utworzone dla najczęściej używanych kolumn w klauzulach WHERE i JOIN
- Indeks na `incident_date DESC` wspiera sortowanie meldunków od najnowszych
- Indeksy pełnotekstowe (`gin`) umożliwiają szybkie wyszukiwanie w opisach (opcjonalne)

### 7.7. Bezpieczeństwo
- **RLS (Row Level Security)** zapewnia izolację danych między jednostkami OSP
- Użytkownicy mogą widzieć tylko meldunki z własnej jednostki
- Możliwość rozszerzenia o role (admin, member) dla bardziej granularnych uprawnień

### 7.8. Integracja z Supabase Auth
- Tabela `profiles` rozszerza dane z `auth.users`
- Trigger automatycznie tworzy profil po rejestracji użytkownika
- Metadane z rejestracji (`fire_department_id`) są przenoszone do profilu

### 7.9. Timestampy
Wszystkie tabele zawierają:
- `created_at` – data utworzenia (automatyczna)
- `updated_at` – data ostatniej modyfikacji (aktualizowana przez trigger)

### 7.10. Walidacja danych
Ograniczenia CHECK zapewniają:
- Poprawność współrzędnych geograficznych
- Logiczną kolejność czasów (end_time >= start_time)
- Prawidłowe wartości dla ról użytkowników

---

## 8. Kolejne kroki implementacji

1. **Utworzenie migracji w Supabase:**
   - Utworzyć pliki migracji SQL w katalogu `/supabase/migrations/`
   - Uruchomić migracje: `supabase db push`

2. **Wypełnienie słowników:**
   - Dodać wszystkie województwa, powiaty i jednostki OSP
   - Można to zrobić przez import z pliku CSV lub manualnie

3. **Testowanie polityk RLS:**
   - Upewnić się, że użytkownicy nie widzą danych z innych jednostek
   - Przetestować wszystkie operacje CRUD

4. **Optymalizacja:**
   - Monitorować wydajność zapytań
   - Dodać dodatkowe indeksy jeśli potrzebne
   - Rozważyć partycjonowanie tabeli `incidents` jeśli będzie bardzo duża

5. **Backupy:**
   - Skonfigurować automatyczne backupy bazy danych
   - Supabase oferuje to out-of-the-box dla projektów płatnych

---

## 9. Diagram ERD (opis słowny)

```
┌─────────────┐
│  provinces  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────┐
│   counties  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴────────────┐
│ fire_departments  │
└──────┬────────────┘
       │ 1
       ├────────────────┐
       │ N              │ N
┌──────┴──────┐   ┌────┴──────┐
│  profiles   │   │ incidents │
│             │   │           │
│ ┌─────────┐ │   │           │
│ │auth.users│ │   │           │
│ └─────────┘ │   │           │
└─────────────┘   └───────────┘
       │ 1
       │
       │ N
       └──────────────▶ incidents
```

---

## 10. Podsumowanie

Schemat bazy danych został zaprojektowany z myślą o:
- ✅ **Bezpieczeństwie** – RLS izoluje dane między jednostkami
- ✅ **Wydajności** – odpowiednie indeksy dla często wykonywanych zapytań
- ✅ **Skalowalności** – hierarchiczna struktura administracyjna
- ✅ **Elastyczności** – możliwość rozbudowy o nowe funkcje (role, kategorie, soft delete)
- ✅ **Spójności danych** – ograniczenia i klucze obce zapewniają integralność
- ✅ **Łatwości integracji** – współpraca z Supabase Auth i SDK

Schemat jest gotowy do implementacji i spełnia wszystkie wymagania określone w PRD oraz MVP.

