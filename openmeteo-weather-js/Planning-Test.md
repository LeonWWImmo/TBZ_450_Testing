# Testkonzept – Projekt OpenMeteo Weather

## 1. Zusammenfassung (Introduction)
Das Projekt *OpenMeteo Weather* ist eine einfache Wetter-Anwendung.  
Das **Backend** (Node.js/Express) ruft Wetterdaten von der Open-Meteo-API ab und cached die Ergebnisse.  
Das **Frontend** (statisches HTML/JS) zeigt die Vorhersage für eine bestimmte Location im Browser an.  

Ziel des Testkonzepts:  
- Sicherstellen, dass die API korrekt funktioniert (Happy-Path & Fehlerfälle)  
- Validierung der Preis-/Eingabelogik (Latitude/Longitude)  
- Sicherstellen, dass das Frontend im Browser funktioniert (E2E-Test)  
- Performance- und Lasttests für das Backend  

---

## 2. Big Picture – Systemarchitektur & Test Items
**Systemarchitektur:**  
- **Backend**: Node/Express → REST-Endpunkt `/api/forecast`  
- **Frontend**: Statisches HTML + JavaScript → nutzt REST-API  
- **Externe Schnittstelle**: Open-Meteo-API (3rd Party)  

**Test Items:**  
- REST-Endpunkt `/api/forecast`  
- Frontend-Interaktion (Eingabe Koordinaten → Ausgabe Temperaturwerte)  
- Cache-Mechanismus im Backend  
- Fehlerbehandlung bei ungültigen Parametern  

---

## 3. Test Features (zu testen)
- **Backend API**: Statuscodes, JSON-Antwort, Fehlerfälle  
- **Frontend Workflow**: Eingabe Koordinaten → Daten laden → Werte anzeigen  
- **Validierung**: Pflichtfelder `latitude`/`longitude`  
- **Performance**: Antwortzeiten unter Last (z. B. mit k6)  

---

## 4. Features not to be tested
- Genauigkeit der Wetterdaten (kommt von Open-Meteo, nicht unser Fokus)  
- Browser-Kompatibilität auf allen möglichen Endgeräten (nur moderner Browser getestet)  
- Mobile-Optimierung (nicht Teil des Projekts)  

---

## 5. Testvorgehen
- Vorgehen nach **TDD (Test Driven Development)**:  
  1. Zuerst Unit-Tests schreiben (z. B. Vitest für `getForecast()`).  
  2. Code schreiben/anpassen, bis Test grün ist.  
  3. Refactoring, ohne Logik zu ändern.  

- Zusätzlich:  
  - **API-Tests** mit Postman/Newman  
  - **E2E-Tests** mit Playwright  
  - **Loadtests** mit k6  

---

## 6. Kriterien für erfolgreiche Tests
- Alle Unit-Tests grün (Backend-Funktionalität abgesichert).  
- E2E-Tests erfolgreich (User-Workflow durchspielbar).  
- Performance-Test: Antwortzeiten < 200 ms bei 20 gleichzeitigen Nutzern.  
- Fehlermeldungen klar und korrekt bei ungültigen Eingaben.  

---

## 7. Testumgebung
- Node.js (LTS)  
- Vitest (Unit-Tests)  
- Postman/Newman (API-Tests)  
- Playwright (E2E im Browser)  
- k6 (Load-/Performance-Tests)  

---

## 8. Planung
- **Unit-Tests Backend**: 0.5 Tag  
- **API-Tests (Postman)**: 0.25 Tag  
- **E2E-Tests Frontend (Playwright)**: 0.5 Tag  
- **Loadtests (k6)**: 0.5 Tag  
- **Dokumentation/Testkonzept**: 1 Tag  

**Gesamtaufwand:** ca. 2.5 Tage  


