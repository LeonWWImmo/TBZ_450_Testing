

# 🌤 Code-Architektur – OpenMeteo Weather App

## 🔹 Überblick

Das Projekt besteht aus zwei Hauptteilen:

```
TBZ_450_Testing/
│
├── openmeteo-weather-js/
│   ├── server/        ← Node.js + Express Backend (API + Tests)
│   └── web/           ← Statisches Frontend (HTML, CSS, JS)
│
└── .github/workflows/ ← CI/CD-Pipelines (automatische Tests)
```

Die Architektur folgt dem Prinzip:
👉 **Client (Frontend)** ↔ **Server (Backend)** ↔ **Externe API (OpenMeteo)**

---

## 🔹 Architekturdiagramm

```plaintext
                ┌────────────────────────────┐
                │        Frontend (web)       │
                │  index.html / script.js     │
                │  → Sendet API-Requests      │
                │  → Zeigt Wetterdaten an     │
                └──────────────┬──────────────┘
                               │ HTTP (Fetch)
                               ▼
                ┌────────────────────────────┐
                │       Backend (server)     │
                │  Express API Endpoint      │
                │  /api/forecast             │
                │                            │
                │  ├─ routes/forecast.js     │
                │  ├─ services/openMeteo.js  │ ← Kommuniziert mit externer API
                │  └─ tests/openMeteo.test.js│ ← Unit Tests (Vitest)
                └──────────────┬──────────────┘
                               │ HTTPS Request
                               ▼
                ┌────────────────────────────┐
                │  Externe API (open-meteo)  │
                │  → Liefert JSON-Daten      │
                └────────────────────────────┘
```

---

## 🔹 Backend-Struktur (`openmeteo-weather-js/server/`)

| Ordner / Datei                   | Funktion                                   |
| -------------------------------- | ------------------------------------------ |
| `src/index.js`                   | Einstiegspunkt, startet Express-Server     |
| `src/routes/`                    | Enthält Routen (z. B. `/api/forecast`)     |
| `src/services/openMeteo.js`      | Verbindung zur OpenMeteo-API mit Caching   |
| `src/services/openMeteo.test.js` | Unit-Tests für den Service (Vitest)        |
| `.env`                           | Konfiguration (z. B. Port, API-Optionen)   |
| `package.json`                   | Abhängigkeiten, Skripte (z. B. `npm test`) |

---

## 🔹 Frontend-Struktur (`openmeteo-weather-js/web/`)

| Datei        | Funktion                                                          |
| ------------ | ----------------------------------------------------------------- |
| `index.html` | Basis-Webseite mit Suchfeld & Resultat-Anzeige                    |
| `style.css`  | Design (Layout, Farben, Responsive View)                          |
| `script.js`  | Logik: sendet Fetch-Requests an das Backend, verarbeitet Response |

---

## 🔹 CI/CD-Integration (`.github/workflows/ci.yml`)

| Workflow    | Beschreibung                                                   |
| ----------- | -------------------------------------------------------------- |
| `ci.yml`    | Führt bei jedem Push automatisch die Unit-Tests im Backend aus |
| Tool        | GitHub Actions mit Node.js 20                                  |
| Test Runner | Vitest (`npx vitest --run`)                                    |
| Ergebnis    | Sichtbar in GitHub → Actions-Tab                               |

---

## 🔹 Architekturprinzipien

| Prinzip                      | Umsetzung                                                          |
| ---------------------------- | ------------------------------------------------------------------ |
| **Separation of Concerns**   | Frontend und Backend strikt getrennt                               |
| **Single Responsibility**    | Jede Datei (z. B. `openMeteo.js`) hat eine klar definierte Aufgabe |
| **Testbarkeit**              | Backend-Funktionen isoliert mit Vitest testbar                     |
| **Schnittstellenklarheit**   | `/api/forecast` ist zentrale Kommunikationsschnittstelle           |
| **Green Code / Performance** | API-Responses werden gecacht (`Map()`-Cache mit TTL)               |

---

## 🔹 Datenfluss

1️⃣ **Frontend:**
Benutzer gibt Ort/Koordinaten ein → Klick auf „Laden“.

2️⃣ **Backend:**
Route `/api/forecast` nimmt Request entgegen → ruft Open-Meteo API auf → cached Ergebnis.

3️⃣ **Frontend:**
Antwort (JSON) wird angezeigt → Temperaturverlauf, Wetterdaten usw.

---

## 🔹 Technologien

| Bereich     | Tool / Technologie                        |
| ----------- | ----------------------------------------- |
| Backend     | Node.js, Express                          |
| Frontend    | HTML, CSS, JavaScript (Fetch API)         |
| Tests       | Vitest                                    |
| Pipeline    | GitHub Actions                            |
| API         | [open-meteo.com](https://open-meteo.com/) |
| Caching     | JavaScript `Map()` im Service             |
| Environment | `.env`-Variablen (z. B. Port, Cache TTL)  |

---

