# Plan implementacji widoku Dashboard

## 1. Przegląd
Dashboard to główny widok aplikacji FireLog, dostępny tylko dla zalogowanych użytkowników. Zapewnia centralny punkt dostępu do wszystkich funkcji aplikacji: przeglądania meldunków, tworzenia nowych meldunków i zarządzania profilem użytkownika. Widok składa się z nawigacji zakładek i dynamicznej zawartości, która zmienia się w zależności od wybranej zakładki.

## 2. Routing widoku
- **Ścieżka**: `/dashboard`
- **Ochrona**: Wymaga autoryzacji JWT
- **Przekierowanie**: Niezalogowani użytkownicy → `/login`
- **Hash routing**: `#meldunki`, `#nowy`, `#profil` dla zakładek

## 3. Struktura komponentów

```
Dashboard
├── NavigationHeader
│   ├── Logo (link do strony głównej)
│   ├── UserMenu (status użytkownika)
│   └── LogoutButton
├── TabNavigation
│   ├── MeldunkiTab
│   ├── NowyMeldunekTab
│   └── ProfilTab
└── ContentArea
    ├── MeldunkiList (aktywna w MeldunkiTab)
    ├── MeldunekForm (aktywna w NowyMeldunekTab)
    └── ProfileForm (aktywna w ProfilTab)
```

## 4. Szczegóły komponentów

### NavigationHeader
- **Opis**: Główny header z logo, menu użytkownika i opcją wylogowania
- **Główne elementy**: 
  - Logo FireLog (link do `/`)
  - Wyświetlanie nazwy użytkownika i jednostki OSP
  - Dropdown menu z opcjami użytkownika
  - Przycisk wylogowania
- **Obsługiwane interakcje**: 
  - Kliknięcie logo → przekierowanie do strony głównej
  - Kliknięcie menu → rozwijanie opcji użytkownika
  - Kliknięcie "Wyloguj" → potwierdzenie i wylogowanie
- **Obsługiwana walidacja**: 
  - Sprawdzenie ważności tokenu JWT
  - Walidacja sesji użytkownika
- **Typy**: `UserDTO`, `ProfileDTO`, `SessionDTO`
- **Propsy**: 
  - `user: UserDTO` - dane użytkownika
  - `profile: ProfileDTO` - profil użytkownika
  - `onLogout: () => void` - callback wylogowania

### TabNavigation
- **Opis**: Nawigacja między zakładkami Dashboard
- **Główne elementy**: 
  - Przyciski zakładek z ikonami
  - Wskaźnik aktywnej zakładki
  - Liczniki (np. liczba meldunków)
- **Obsługiwane interakcje**: 
  - Kliknięcie zakładki → zmiana aktywnej zakładki
  - Keyboard navigation (Tab, Enter, Arrow keys)
- **Obsługiwana walidacja**: 
  - Sprawdzenie uprawnień użytkownika do zakładek
- **Typy**: `TabType`, `TabState`
- **Propsy**: 
  - `activeTab: TabType` - aktualna zakładka
  - `onTabChange: (tab: TabType) => void` - callback zmiany zakładki
  - `meldunkiCount: number` - liczba meldunków

### MeldunkiTab
- **Opis**: Zakładka wyświetlająca listę meldunków użytkownika
- **Główne elementy**: 
  - Lista meldunków w formie kart
  - Filtry i sortowanie
  - Paginacja
  - Przyciski akcji (edycja, usuwanie)
- **Obsługiwane interakcje**: 
  - Kliknięcie meldunku → wyświetlenie szczegółów
  - Kliknięcie "Edytuj" → otwarcie formularza edycji
  - Kliknięcie "Usuń" → potwierdzenie i usunięcie
  - Zmiana filtrów → odświeżenie listy
- **Obsługiwana walidacja**: 
  - Sprawdzenie uprawnień do edycji/usuwania
  - Walidacja filtrów i sortowania
- **Typy**: `MeldunekDTO[]`, `MeldunkiListState`, `FilterOptions`
- **Propsy**: 
  - `meldunki: MeldunekDTO[]` - lista meldunków
  - `loading: boolean` - stan ładowania
  - `onEdit: (id: string) => void` - callback edycji
  - `onDelete: (id: string) => void` - callback usuwania

### NowyMeldunekTab
- **Opis**: Zakładka z formularzem tworzenia nowego meldunku
- **Główne elementy**: 
  - Formularz z polami: nazwa, opis, lokalizacja, typ zdarzenia
  - Walidacja w czasie rzeczywistym
  - Przycisk zapisu z loading state
  - Podgląd przed wysłaniem
- **Obsługiwane interakcje**: 
  - Wypełnianie pól formularza
  - Walidacja w czasie rzeczywistym
  - Wysłanie formularza
  - Anulowanie i powrót do listy
- **Obsługiwana walidacja**: 
  - Wymagane pola (nazwa, opis, lokalizacja)
  - Format danych (email, daty)
  - Długość tekstu (min/max znaków)
  - Unikalność nazwy meldunku
- **Typy**: `CreateMeldunekRequestDTO`, `MeldunekFormState`, `ValidationErrors`
- **Propsy**: 
  - `onSubmit: (data: CreateMeldunekRequestDTO) => Promise<void>` - callback zapisu
  - `onCancel: () => void` - callback anulowania
  - `loading: boolean` - stan ładowania

### ProfilTab
- **Opis**: Zakładka z danymi użytkownika i opcjami edycji
- **Główne elementy**: 
  - Wyświetlanie danych użytkownika (imię, nazwisko, email)
  - Informacje o jednostce OSP
  - Formularz edycji profilu
  - Ustawienia konta
- **Obsługiwane interakcje**: 
  - Przełączanie między widokiem a edycją
  - Edycja danych profilu
  - Zapisywanie zmian
- **Obsługiwana walidacja**: 
  - Format email
  - Długość pól tekstowych
  - Unikalność email (jeśli zmieniany)
- **Typy**: `ProfileDTO`, `UpdateProfileRequestDTO`, `ProfileState`
- **Propsy**: 
  - `profile: ProfileDTO` - dane profilu
  - `onUpdate: (data: UpdateProfileRequestDTO) => Promise<void>` - callback aktualizacji
  - `loading: boolean` - stan ładowania

## 5. Typy

### DashboardState
```typescript
interface DashboardState {
  activeTab: 'meldunki' | 'nowy' | 'profil';
  user: UserDTO | null;
  profile: ProfileDTO | null;
  loading: boolean;
  error: string | null;
}
```

### MeldunkiListState
```typescript
interface MeldunkiListState {
  meldunki: MeldunekDTO[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    category: string | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### MeldunekFormState
```typescript
interface MeldunekFormState {
  data: CreateMeldunekRequestDTO;
  loading: boolean;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
}
```

### ProfileState
```typescript
interface ProfileState {
  profile: ProfileDTO | null;
  editing: boolean;
  loading: boolean;
  error: string | null;
  formData: UpdateProfileRequestDTO;
  formErrors: Record<string, string>;
}
```

### TabType
```typescript
type TabType = 'meldunki' | 'nowy' | 'profil';
```

## 6. Zarządzanie stanem

Dashboard wykorzystuje kombinację lokalnego stanu komponentów i globalnego stanu aplikacji:

### useAuth Hook
```typescript
interface UseAuthReturn {
  user: UserDTO | null;
  profile: ProfileDTO | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### useMeldunki Hook
```typescript
interface UseMeldunkiReturn {
  meldunki: MeldunekDTO[];
  loading: boolean;
  error: string | null;
  createMeldunek: (data: CreateMeldunekRequestDTO) => Promise<void>;
  updateMeldunek: (id: string, data: UpdateMeldunekRequestDTO) => Promise<void>;
  deleteMeldunek: (id: string) => Promise<void>;
  refreshMeldunki: () => Promise<void>;
}
```

### useTabNavigation Hook
```typescript
interface UseTabNavigationReturn {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  navigateToTab: (tab: TabType) => void;
}
```

## 7. Integracja API

### Endpointy wykorzystywane:
- `GET /api/auth/me` - pobranie danych użytkownika
- `GET /api/incidents` - lista meldunków z filtrami i paginacją
- `POST /api/incidents` - tworzenie nowego meldunku
- `PATCH /api/incidents/{id}` - edycja meldunku
- `DELETE /api/incidents/{id}` - usuwanie meldunku
- `PATCH /api/profiles/me` - aktualizacja profilu

### Typy żądań i odpowiedzi:
- **Request**: `CreateMeldunekRequestDTO`, `UpdateMeldunekRequestDTO`, `UpdateProfileRequestDTO`
- **Response**: `ApiSuccessResponse<MeldunekDTO[]>`, `ApiSuccessResponse<MeldunekDTO>`, `ApiSuccessResponse<ProfileDTO>`

## 8. Interakcje użytkownika

### Nawigacja między zakładkami:
1. Użytkownik klika zakładkę → `setActiveTab(tab)`
2. Aktualizacja URL hash → `window.location.hash = tab`
3. Renderowanie odpowiedniej zawartości → `ContentArea`

### Tworzenie meldunku:
1. Użytkownik wypełnia formularz → walidacja w czasie rzeczywistym
2. Kliknięcie "Zapisz" → `createMeldunek(data)`
3. Sukces → przekierowanie do listy meldunków
4. Błąd → wyświetlenie komunikatu błędu

### Edycja meldunku:
1. Kliknięcie "Edytuj" → otwarcie formularza z danymi
2. Modyfikacja danych → walidacja
3. Kliknięcie "Zapisz" → `updateMeldunek(id, data)`
4. Sukces → odświeżenie listy

### Usuwanie meldunku:
1. Kliknięcie "Usuń" → wyświetlenie potwierdzenia
2. Potwierdzenie → `deleteMeldunek(id)`
3. Sukces → usunięcie z listy

## 9. Warunki i walidacja

### Warunki API:
- **Autoryzacja**: Wszystkie requesty wymagają `Authorization: Bearer {token}`
- **Rate limiting**: Maksymalnie 100 requestów/minutę
- **Walidacja danych**: Sprawdzenie formatu i wymaganych pól
- **Uprawnienia**: Użytkownik może edytować tylko swoje meldunki

### Walidacja komponentów:
- **Formularz meldunku**: Nazwa (wymagana, max 255 znaków), Opis (wymagany, min 10 znaków), Lokalizacja (wymagana)
- **Profil**: Email (format RFC 5322), Imię/Nazwisko (max 100 znaków)
- **Filtry**: Data (format ISO 8601), Kategoria (enum), Wyszukiwanie (max 100 znaków)

## 10. Obsługa błędów

### Scenariusze błędów:
- **401 Unauthorized**: Przekierowanie do `/login`
- **403 Forbidden**: Wyświetlenie komunikatu o braku uprawnień
- **404 Not Found**: Komunikat "Meldunek nie został znaleziony"
- **422 Validation Error**: Podświetlenie błędnych pól formularza
- **500 Server Error**: Komunikat "Wystąpił błąd serwera, spróbuj ponownie"
- **Network Error**: Komunikat "Brak połączenia z internetem"

### Strategie obsługi:
- **Retry mechanism**: Automatyczne ponowienie requestu przy błędach sieciowych
- **Fallback UI**: Wyświetlenie cached danych przy braku połączenia
- **Error boundaries**: Przechwytywanie błędów React i wyświetlanie fallback UI
- **Toast notifications**: Nieintruzywne powiadomienia o błędach

## 11. Kroki implementacji

### Krok 1: Utworzenie typów i interfejsów
- Dodanie typów `DashboardState`, `MeldunkiListState`, `MeldunekFormState`, `ProfileState`
- Definicja interfejsów dla hooków `useAuth`, `useMeldunki`, `useTabNavigation`
- **Czas**: 30 minut

### Krok 2: Implementacja hooków zarządzania stanem
- `useAuth` - zarządzanie autoryzacją i danymi użytkownika
- `useMeldunki` - CRUD operacje na meldunkach
- `useTabNavigation` - zarządzanie nawigacją między zakładkami
- **Czas**: 2 godziny

### Krok 3: Implementacja NavigationHeader
- Logo z linkiem do strony głównej
- Wyświetlanie danych użytkownika
- Menu użytkownika z opcją wylogowania
- **Czas**: 1 godzina

### Krok 4: Implementacja TabNavigation
- Przyciski zakładek z ikonami
- Wskaźnik aktywnej zakładki
- Liczniki (liczba meldunków)
- **Czas**: 1 godzina

### Krok 5: Implementacja MeldunkiTab
- Lista meldunków w formie kart
- Filtry i sortowanie
- Paginacja
- Przyciski akcji (edycja, usuwanie)
- **Czas**: 3 godziny

### Krok 6: Implementacja NowyMeldunekTab
- Formularz tworzenia meldunku
- Walidacja w czasie rzeczywistym
- Loading states
- Obsługa błędów
- **Czas**: 2 godziny

### Krok 7: Implementacja ProfilTab
- Wyświetlanie danych profilu
- Formularz edycji
- Obsługa aktualizacji
- **Czas**: 1.5 godziny

### Krok 8: Integracja z API
- Konfiguracja endpointów
- Obsługa autoryzacji
- Error handling
- **Czas**: 2 godziny

### Krok 9: Testy
- Unit testy dla komponentów
- Integration testy dla hooków
- E2E testy dla przepływów użytkownika
- **Czas**: 3 godziny

### Krok 10: Optymalizacja i finalizacja
- Performance optimization
- Accessibility compliance
- Responsive design
- Code review
- **Czas**: 2 godziny

**Całkowity czas implementacji**: ~18 godzin
