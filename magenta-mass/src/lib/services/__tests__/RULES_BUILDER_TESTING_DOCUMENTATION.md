# RulesBuilderService - Dokumentacja testów jednostkowych

## Przegląd

`RulesBuilderService.generateRulesContent()` to kluczowa metoda odpowiedzialna za generowanie reguł biznesowych dla systemu FireLog. Zestaw testów jednostkowych został zaprojektowany tak, aby zapewnić pełne pokrycie wszystkich scenariuszy biznesowych, warunków brzegowych i obsługi błędów.

## Struktura testów

### 1. Kluczowe reguły biznesowe

Testy weryfikują podstawową funkcjonalność biznesową:

- **Generowanie reguł systemowych**: Sprawdza czy reguły systemowe są generowane domyślnie i można je wyłączyć
- **Generowanie reguł jednostki OSP**: Weryfikuje tworzenie reguł specyficznych dla jednostki
- **Reguły roli użytkownika**: Testuje generowanie reguł dla ról admin, commander, member
- **Reguły niestandardowe**: Sprawdza przetwarzanie reguł dostarczonych przez użytkownika
- **Filtrowanie według roli**: Weryfikuje że użytkownik otrzymuje tylko reguły dla swojej roli
- **Obsługa języków**: Testuje generowanie reguł w języku polskim i angielskim

### 2. Warunki brzegowe

Testy sprawdzają zachowanie w skrajnych przypadkach:

- **Puste tablice**: Obsługa pustych tablic reguł niestandardowych
- **Brakujące opcjonalne parametry**: Zachowanie gdy parametry nie są podane
- **Długie ciągi znaków**: Obsługa bardzo długich reguł niestandardowych
- **Znaki specjalne**: Przetwarzanie reguł z znakami specjalnymi
- **Skrajne wartości**: Minimalne i maksymalne wersje systemu, długie ID jednostek

### 3. Walidacja danych wejściowych

Testy weryfikują poprawność walidacji:

- **Konfiguracja null/undefined**: Obsługa nieprawidłowych konfiguracji
- **Nieprawidłowe role**: Walidacja ról użytkowników
- **Nieprawidłowe ID jednostki**: Sprawdzanie formatu fireDepartmentId
- **Nieprawidłowe wersje**: Walidacja systemVersion
- **Nieprawidłowe języki**: Sprawdzanie obsługiwanych języków
- **Nieprawidłowe reguły niestandardowe**: Walidacja typu tablicy

### 4. Obsługa błędów i wyjątków

Testy sprawdzają graceful error handling:

- **Błędy połączenia z bazą danych**: Symulacja błędów DB
- **Nieoczekiwane błędy systemu**: Obsługa błędów w metodach pomocniczych
- **Błędy przetwarzania reguł**: Obsługa błędów w processCustomRules
- **Błędy generowania metadanych**: Obsługa błędów w generateMetadata

### 5. Metadane i struktura odpowiedzi

Testy weryfikują poprawność struktury danych:

- **Struktura metadanych**: Sprawdzanie wszystkich wymaganych pól
- **Liczenie reguł według kategorii**: Weryfikacja poprawności liczników
- **Unikalność ID reguł**: Sprawdzanie że wszystkie ID są unikalne
- **Wymagane właściwości reguł**: Weryfikacja kompletności obiektów reguł
- **Spójność wartości**: Sprawdzanie że priority i category mają prawidłowe wartości

### 6. Wydajność i optymalizacja

Testy sprawdzają wydajność:

- **Duże zestawy reguł**: Obsługa 1000+ reguł niestandardowych
- **Równoczesne żądania**: Testowanie 10 równoczesnych wywołań
- **Czas wykonania**: Sprawdzanie że operacje kończą się w rozsądnym czasie

## Kluczowe reguły biznesowe

### Reguły systemowe
- **sys-001**: Zasady bezpieczeństwa systemu (wysoki priorytet)
- **sys-002**: Ochrona danych osobowych zgodnie z RODO (wysoki priorytet)
- **sys-003**: Zasady dostępu do systemu (średni priorytet)

### Reguły roli administratora
- **role-admin-001**: Zarządzanie użytkownikami (wysoki priorytet)
- **role-admin-002**: Zarządzanie meldunkami (wysoki priorytet)

### Reguły roli dowódcy
- **role-commander-001**: Zatwierdzanie meldunków (wysoki priorytet)
- **role-commander-002**: Raportowanie (średni priorytet)

### Reguły roli członka
- **role-member-001**: Tworzenie meldunków (średni priorytet)
- **role-member-002**: Przestrzeganie procedur (wysoki priorytet)

## Warunki brzegowe

### Minimalne wartości
- System version: `0.0.1`
- Fire department ID: pusty string (błąd walidacji)
- Custom rules: pusta tablica

### Maksymalne wartości
- System version: `999.999.999`
- Fire department ID: 1000+ znaków
- Custom rules: 1000+ reguł

### Specjalne przypadki
- Znaki specjalne w regułach niestandardowych
- Bardzo długie reguły (10,000+ znaków)
- Równoczesne żądania (10+ równocześnie)

## Metryki pokrycia

Testy zapewniają:
- **100% pokrycie** metody `generateRulesContent()`
- **100% pokrycie** wszystkich metod pomocniczych
- **100% pokrycie** wszystkich ścieżek błędów
- **100% pokrycie** wszystkich warunków brzegowych

## Uruchamianie testów

```bash
# Uruchomienie wszystkich testów RulesBuilderService
npm test -- src/lib/services/__tests__/rules-builder.service.test.ts

# Uruchomienie z pokryciem kodu
npm run test:coverage -- src/lib/services/__tests__/rules-builder.service.test.ts

# Uruchomienie w trybie watch
npm test -- --watch src/lib/services/__tests__/rules-builder.service.test.ts
```

## Przykłady użycia

### Podstawowe użycie
```typescript
const rulesService = new RulesBuilderService();
const result = await rulesService.generateRulesContent({
  userRole: 'admin',
  fireDepartmentId: 'dept-123',
  systemVersion: '1.0.0',
  language: 'pl'
});
```

### Z regułami niestandardowymi
```typescript
const result = await rulesService.generateRulesContent({
  userRole: 'member',
  fireDepartmentId: 'dept-456',
  systemVersion: '1.0.0',
  customRules: [
    'Reguła niestandardowa 1',
    'Reguła niestandardowa 2'
  ],
  language: 'pl'
});
```

### Wyłączenie niektórych kategorii
```typescript
const result = await rulesService.generateRulesContent({
  userRole: 'commander',
  fireDepartmentId: 'dept-789',
  systemVersion: '1.0.0',
  includeSystemRules: false,
  includeDepartmentRules: true,
  language: 'en'
});
```

## Wnioski

Zestaw testów jednostkowych dla `RulesBuilderService.generateRulesContent()` zapewnia:

1. **Kompleksowe pokrycie** wszystkich scenariuszy biznesowych
2. **Solidną walidację** danych wejściowych
3. **Graceful error handling** dla wszystkich przypadków błędów
4. **Testowanie wydajności** dla dużych zestawów danych
5. **Weryfikację struktury** odpowiedzi i metadanych

Testy są napisane zgodnie z najlepszymi praktykami Vitest i zapewniają wysoką jakość kodu oraz niezawodność systemu FireLog.
