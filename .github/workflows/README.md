# Pull Request Workflow Documentation

## Przegląd

Workflow dla Pull Requestów (`pr-checks.yml`) automatycznie weryfikuje jakość kodu i testy przed mergowaniem do brancha `master` lub `main`.

## Wyzwalacze

Workflow uruchamia się automatycznie gdy:
- Otworzony zostanie nowy Pull Request do `master`/`main`
- Pull Request zostanie zsynchronizowany (nowe commity)
- Pull Request zostanie ponownie otwarty
- Pull Request zostanie oznaczony jako "ready for review"

## Zadania (Jobs)

### 1. Linting & Type Checking (`lint-and-type-check`)
**Wymagane: ✅**

- Sprawdza składnię TypeScript
- Weryfikuje typy używając `astro check`
- Nie wymaga dodatkowych zmiennych środowiskowych

**Czas wykonania:** ~2-3 minuty

### 2. Unit Tests (`unit-tests`)
**Wymagane: ✅**

- Uruchamia testy jednostkowe (`test:unit`)
- Uruchamia testy API (`test:api`)
- Uruchamia testy integracyjne (`test:integration`)
- Generuje raport pokrycia kodu (codecov)

**Czas wykonania:** ~3-5 minut

### 3. E2E Tests (`e2e-tests`)
**Opcjonalne: ⚠️**

- Uruchamia testy end-to-end przy użyciu Playwright
- Wymaga zbudowanej aplikacji i działającego serwera
- Uruchamia się tylko dla Pull Requestów oznaczonych jako "ready for review" (nie dla draftów)
- Generuje raport HTML z wynikami testów

**Czas wykonania:** ~5-10 minut

**Uwaga:** Testy e2e mogą być pominięte jeśli nie są skonfigurowane zmienne środowiskowe dla testów.

### 4. Build Check (`build-check`)
**Wymagane: ✅**

- Buduje aplikację produkcyjną
- Weryfikuje czy build się powiódł (sprawdza katalog `dist`)
- Zapobiega mergowaniu kodu, który nie może być zbudowany

**Czas wykonania:** ~2-4 minuty

## Status Checks

Aby Pull Request mógł zostać zmergowany, wszystkie **wymagane** zadania muszą przejść:
- ✅ Linting & Type Checking
- ✅ Unit Tests
- ✅ Build Check

Zadanie **E2E Tests** jest opcjonalne i nie blokuje mergowania.

## Lokalne testowanie

Możesz przetestować workflow lokalnie używając skryptu:

```bash
# Podstawowe testy (bez e2e)
./scripts/test-pr-workflow.sh

# Z testami e2e
./scripts/test-pr-workflow.sh --with-e2e
```

Skrypt symuluje wszystkie kroki z workflow GitHub Actions.

## Wymagania

- Node.js 20+
- npm ci (dla reprodukowalnych instalacji)
- Wszystkie zależności zdefiniowane w `package.json`

## Konfiguracja zmiennych środowiskowych

Dla testów e2e mogą być potrzebne zmienne środowiskowe. Są one opcjonalne i workflow będzie działać bez nich (z wyjątkiem testów e2e).

## Rozwiązywanie problemów

### Workflow nie uruchamia się
- Sprawdź czy Pull Request jest skierowany do `master` lub `main`
- Sprawdź czy workflow nie jest wyłączony w ustawieniach repozytorium

### Testy e2e nie działają
- Sprawdź czy masz skonfigurowane zmienne środowiskowe dla testów
- Testy e2e są opcjonalne - możesz je pominąć dla draft PRs

### Build nie przechodzi
- Sprawdź lokalnie czy `npm run build` działa
- Sprawdź logi workflow w GitHub Actions

