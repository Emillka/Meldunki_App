// Skrypt do dodania przykładowych meldunków
const sampleMeldunki = [
  {
    id: 1,
    incident_name: "Pożar budynku mieszkalnego",
    description: "Interwencja w związku z pożarem mieszkania na 3. piętrze. Ogień został ugaszony, nikt nie ucierpiał. Przyczyna: zwarcie instalacji elektrycznej.",
    incident_date: "2024-01-15",
    location_address: "ul. Słowackiego 15, Warszawa",
    forces_and_resources: "2 pojazdy gaśnicze, 1 drabina, 8 strażaków",
    commander: "Jan Kowalski",
    driver: "Piotr Nowak",
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    incident_name: "Wypadek komunikacyjny",
    description: "Zderzenie dwóch samochodów osobowych na skrzyżowaniu. Kierowcy nie wymagali hospitalizacji. Utrudnienia w ruchu przez 2 godziny.",
    incident_date: "2024-01-20",
    location_address: "ul. Marszałkowska 100, Warszawa",
    forces_and_resources: "1 pojazd ratowniczy, 4 strażaków",
    commander: "Anna Wiśniewska",
    driver: "Michał Zieliński",
    created_at: "2024-01-20T14:45:00Z"
  },
  {
    id: 3,
    incident_name: "Zalanie piwnicy",
    description: "Pęknięcie rury wodociągowej w piwnicy budynku. Woda zalana piwnica, uszkodzone rzeczy mieszkańców. Rura naprawiona przez wodociągi.",
    incident_date: "2024-01-25",
    location_address: "ul. Krakowskie Przedmieście 25, Warszawa",
    forces_and_resources: "1 pojazd pompowy, 6 strażaków",
    commander: "Tomasz Kowalczyk",
    driver: "Krzysztof Lewandowski",
    created_at: "2024-01-25T08:15:00Z"
  }
];

// Dodaj do localStorage
localStorage.setItem('meldunki', JSON.stringify(sampleMeldunki));
console.log('Dodano przykładowe meldunki:', sampleMeldunki.length);
