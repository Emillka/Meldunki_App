.ai/mvp.md


# FireLog – MVP

## 🎯 Cel MVP
Stworzyć działającą wersję aplikacji, w której zalogowany użytkownik może:
1. Dodać meldunek z akcji.  
2. Zobaczyć listę wszystkich swoich meldunków.  
3. Edytować lub usunąć meldunek.  
4. Uzyskać automatyczną analizę zdarzenia.  

---

## 🔧 Zakres MVP

### 1. Autoryzacja
- Rejestracja użytkownika.  
- Logowanie i wylogowanie.  
- Ochrona danych użytkownika.

### 2. CRUD Meldunków
- Formularz tworzenia nowego meldunku.  
- Lista meldunków użytkownika.  
- Widok szczegółów meldunku.  
- Edycja i usuwanie meldunku.

### 3. Logika biznesowa
- Analiza tekstu meldunku.  
- Generacja kategorii zdarzenia i krótkiego podsumowania.  

### 4. Testy
- Unit test dla funkcji analizy tekstu.  

### 5. CI/CD
- Automatyczne uruchamianie testów po każdej zmianie w repozytorium.  

---

## 🚫 Poza zakresem MVP
- Raporty i statystyki.  
- System ról użytkowników.  
- Integracje z zewnętrznymi API.  
- Powiadomienia e-mail/SMS.  

---

## ✅ Kryteria sukcesu
- Aplikacja działa w przeglądarce.  
- Logowanie i rejestracja działają poprawnie.  
- CRUD meldunków działa.  
- Analiza zdarzenia zwraca wynik.  
- Testy przechodzą poprawnie.  
- CI/CD działa i uruchamia testy.  

