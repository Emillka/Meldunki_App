# FireLog – Aplikacja do rejestrowania meldunków straży pożarnej

## 1. Cel projektu
Aplikacja **FireLog** ma umożliwić jednostkom straży pożarnej  (OSP) szybkie i uporządkowane tworzenie elektronicznych meldunków z akcji.  
Celem jest zastąpienie papierowych raportów nowoczesnym, prostym systemem webowym.

---

## 2. Problem
Aktualnie większość jednostek prowadzi meldunki w zeszytach, Excelu lub nieformalnych systemach.  
Powoduje to trudności w:
- odnajdywaniu danych o akcjach z przeszłości,  
- analizie liczby i rodzaju interwencji,  
- raportowaniu dla komend lub urzędów.  

**FireLog** rozwiązuje te problemy, centralizując wszystkie meldunki w jednym miejscu i automatyzując część analizy danych.

---

## 3. Użytkownicy i User Stories

### 👨‍🚒 Strażak / Dowódca
Potrzebuje szybkiego sposobu na zapisanie meldunku z akcji.  
Chce, aby dane były dostępne dla reszty jednostki.  
Oczekuje prostoty obsługi.

**User Stories:**
- Jako strażak chcę **założyć konto** przy użyciu e-maila i hasła.  
- Jako strażak chcę **zalogować się** klasycznie, aby mieć dostęp do meldunków.  
- Jako strażak chcę **pozostać zalogowany** między sesjami.  
- Jako strażak chcę **wylogować się** w dowolnym momencie.  
- Jako strażak chcę widzieć **swój status zalogowania** (np. „Zalogowany jako Jan Kowalski”).  
- Jako strażak chcę mieć dostęp do **meldunków i formularza dodawania** tylko po zalogowaniu.  

---

### 👩‍💻 Administrator jednostki
Zarządza kontami użytkowników jednostki.  
Eksportuje meldunki do raportów miesięcznych.  
Sprawdza statystyki działań (w przyszłości).  

**User Stories:**
- Jako administrator chcę **zarządzać kontami użytkowników** jednostki.  
- Jako administrator chcę **eksportować meldunki** tylko po zalogowaniu.  
- Jako administrator chcę mieć dostęp do **panelu administracyjnego** po uwierzytelnieniu.  
- Jako administrator chcę, aby aplikacja **blokowała dostęp do nieautoryzowanych stron** bez logowania.  

---

### 🧭 Scenariusze dostępności stron

| Strona / funkcja | Dla wszystkich | Tylko po zalogowaniu |
|------------------|----------------|----------------------|
| Strona główna / opis projektu | ✅ | |
| Rejestracja | ✅ | |
| Logowanie | ✅ | |
| Lista meldunków | | ✅ |
| Formularz dodawania meldunku | | ✅ |
| Edycja / usuwanie meldunku | | ✅ |
| Panel administratora | | ✅ |
| Wylogowanie | | ✅ |
| Strona 404 / brak dostępu | ✅ | |

---

## 4. Zakres funkcjonalny (high-level)

**Główne moduły:**
- Rejestracja i logowanie użytkownika (e-mail + hasło)
- Lista meldunków – widok wszystkich akcji
- Formularz dodawania meldunku
- Edycja / usuwanie meldunku
- Analiza zdarzenia – automatyczne podsumowanie lub kategoryzacja akcji
- Test jednostkowy funkcji analizy
- CI/CD – automatyczne uruchamianie testów przy zmianach w repozytorium

---

## 5. Funkcje (szczegóły)

### 5.1. Autoryzacja – E-mail + Hasło

#### 🔐 Rejestracja użytkownika
Użytkownik podaje:
- e-mail,  
- województwo, powiat, nazwę jednostki ( z listy rozwijanej),  
- hasło.  

Dane są zapisywane w bazie (hasło zahaszowane przy pomocy bcrypt).  
Konto jest automatycznie aktywne po rejestracji.

#### 🔑 Logowanie
- Użytkownik podaje e-mail i hasło.  
- Backend generuje token JWT sesyjny (ważny 7 dni).  
- Token zapisywany w przeglądarce (cookie lub localStorage).  
- Użytkownik może się wylogować (token usuwany).  

#### 🧭 Mechanika
- **Backend:** Node.js + Express + JWT + bcrypt  
- **Hasła:** przechowywane w postaci hashy bcrypt  
- **Tokeny JWT:** ważne 7 dni  
- **Middleware autoryzacyjny:** weryfikuje token przy każdym zapytaniu  
- **Frontend:** zarządza stanem logowania i przekierowaniami  

#### 🔄 Integracja z modułami
- **Lista meldunków:** dostępna tylko po zalogowaniu.  
- **Formularz meldunku:** wymaga ważnego tokena JWT.  
- **UI:** pokazuje różne przyciski w zależności od stanu sesji (np. „Zaloguj się” / „Wyloguj się”).  
- **Bezpieczeństwo:** każde zapytanie API musi zawierać `Authorization: Bearer <token>`.  

---

### 5.2. CRUD Meldunków
Każdy meldunek zawiera:
- Data zdarzenia  
- Nazwa zdarzenia  
- Lokalizacja (adres lub współrzędne)  
- Szczegóły zdarzenia (opis przebiegu akcji)  
- Siły i środki zadysponowane  
- Dowódca akcji  
- Kierowca pojazdu  
- Czas rozpoczęcia i zakończenia  

**Operacje:**
- [C] Dodaj nowy meldunek  
- [R] Wyświetl listę i szczegóły  
- [U] Edytuj meldunek  
- [D] Usuń meldunek  

---

### 5.3. Logika biznesowa (AI lub reguły)
Na podstawie opisu akcji system generuje:
- Kategorię zdarzenia (np. „Pożar”, „Miejscowe Zagrożenie”, „Inne”)  
- Krótkie streszczenie przebiegu akcji  

---

### 5.4. Testy
- Test jednostkowy (unit test) dla funkcji analizy tekstu  
- Alternatywnie test E2E symulujący dodanie meldunku  

---

### 5.5. CI/CD
- Automatyczne uruchamianie testów po każdej zmianie w repozytorium  
- (Opcjonalnie) automatyczne wdrożenie aplikacji  

---

## 6. Kryteria sukcesu
✅ Można założyć konto e-mail + hasło  
✅ Można się zalogować i wylogować  
✅ System pamięta sesję użytkownika (JWT)  
✅ Można dodać, edytować i usunąć meldunek  
✅ Funkcja analizy działa poprawnie  
✅ Testy przechodzą pomyślnie  
✅ CI/CD uruchamia testy automatycznie  

---

## 7. Poza zakresem (Out of Scope)
- System ról i uprawnień  
- Powiadomienia SMS  
- Raporty PDF (na etapie MVP)  

---

## 8. Możliwe rozszerzenia po MVP
- Generowanie raportów PDF  
- Wykresy miesięczne / statystyki  
- Integracja z mapami  
- System powiadomień (e-mail / SMS)  

