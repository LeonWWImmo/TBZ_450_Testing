# Open‑Meteo Wetter‑App (JS Backend + HTML/JS Frontend)

## Struktur
```
├── openmeteo-weather-js/
├── Repo_Aufgaben/
├── server/
│ ├── node_modules/
│ ├── src/
│ │ ├── routes/
│ │ │ └── weather.js
│ │ ├── services/
│ │ │ ├── openMeteo.js
│ │ │ └── openMeteo.test.js
│ │ └── index.js
│ ├── .env
│ ├── .env.example
│ ├── package-lock.json
│ └── package.json
├── web/
│ ├── about.html
│ ├── app.js
│ ├── forecast.html
│ ├── index.html
│ ├── settings.html
│ └── styles.css
└── README.md
```

## Start
```bash
# Backend
cd openmethe-wather-js/server
npm install
npm start   # http://localhost:4000

# Frontend
# Öffne web/index.html direkt im Browser

#Test 
cd openmethe-wather-js/server
npm test 
```


## Beispiel-Request
```
GET http://localhost:4000/api/forecast?latitude=47.3769&longitude=8.5417&hourly=temperature_2m,weather_code&timezone=Europe/Zurich
```

## 1. Planung 

### Ziel:
Eine kleine Wetter-App, die Vorhersagedaten von Open-Meteo
 abruft, im Backend cached und im Frontend visualisiert.

### Technologien:

**Backend:** Node.js, Express 
Dieses Backend ruft die Open-Meteo-API ab und cached Antworten kurzzeitig.  
Die Business-Logik wird mit **Vitest** (JavaScript) getestet – nach dem **TDD-Zyklus: Red → Green → Refactor**.

**Frontend:** HTML, CSS, Chart.js (Diagramme)

**Tests:** vitest

### Vorgehen:

1. Backend aufsetzen 

2. Frontend bauen → Form, Tabelle, Chart

3. Tests planen

4. Start lokal sicherstellen

## Tests 
### Was wird getestet?
URL/Parameter & Header: nur definierte Query-Parameter werden gesetzt, Accept: application/json ist vorhanden.
**Caching:** bei identischen Parametern wird fetch nur einmal aufgerufen (TTL-Cache).
 
**Fehlerfall:** bei HTTP-Fehlern wirft die Funktion eine klare Exception.

### Testfälle 
```
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
 
const importService = async () => {
  // Testfreundliches TTL setzen
  vi.stubEnv("CACHE_TTL_MS", "60000");
  vi.resetModules(); // Modul frisch laden, damit ENV greift
  return await import("./openMeteo.js");
};
 
describe("getForecast()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });
 
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
 
  it("setzt nur definierte Query-Parameter und Accept-Header", async () => {
    const { getForecast } = await importService();
 
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });
 
    await getForecast({
      latitude: 47.38,
      longitude: 8.54,
      hourly: "temperature_2m",
      timezone: "auto",
      daily: undefined, // sollen NICHT in der URL landen
      current: "",
    });
 
    expect(global.fetch).toHaveBeenCalledTimes(1);
 
    const calledUrl = new URL(global.fetch.mock.calls[0][0]);
    const headers = global.fetch.mock.calls[0][1]?.headers;
 
    expect(calledUrl.origin + calledUrl.pathname)
      .toBe("https://api.open-meteo.com/v1/forecast");
    expect(calledUrl.searchParams.get("latitude")).toBe("47.38");
    expect(calledUrl.searchParams.get("longitude")).toBe("8.54");
    expect(calledUrl.searchParams.get("hourly")).toBe("temperature_2m");
    expect(calledUrl.searchParams.get("timezone")).toBe("auto");
 
    // Unerlaubte/undefinierte Keys dürfen nicht auftauchen
    expect(calledUrl.searchParams.has("daily")).toBe(false);
    expect(calledUrl.searchParams.has("current")).toBe(false);
 
    expect(headers).toMatchObject({ Accept: "application/json" });
  });
 
  it("verwendet Cache: gleiche Params → nur 1 fetch()", async () => {
    const { getForecast } = await importService();
 
    const payload = { latitude: 47.0, longitude: 8.0, hourly: "temperature_2m" };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 1 }),
    });
 
    await getForecast(payload); // erster fetch
    await getForecast(payload); // aus Cache
 
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
 
  it("wirft bei HTTP-Fehlern eine klare Fehlermeldung", async () => {
    const { getForecast } = await importService();
 
    global.fetch.mockResolvedValueOnce({ ok: false, status: 502 });
    await expect(getForecast({ latitude: 1, longitude: 2 }))
      .rejects.toThrow(/Open-Meteo returned 502/);
  });
});
Getestete Funktion (SUT): src/services/openMeteo.js
js
Code kopieren
const BASE = 'https://api.open-meteo.com/v1/forecast';
 
const cache = new Map();
const TTL = Number(process.env.CACHE_TTL_MS || 5 * 60 * 1000);
 
function isDefined(v) {
  return v !== undefined && v !== null && v !== '';
}
 
function cacheKey(params) {
  return JSON.stringify(
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  );
}
 
export async function getForecast(params) {
  const key = cacheKey(params);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.data;
 
  const url = new URL(BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (isDefined(v)) url.searchParams.set(k, String(v));
  });
 
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
 
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
 
  const json = await res.json();
  cache.set(key, { expires: now + TTL, data: json });
  return json;
}
 
export function resetCache() { cache.clear(); }
export { cacheKey };
```
Die Business-Logik (`getForecast`) wird mit **Vitest** getestet.  
Folgende Szenarien sind abgedeckt:

1. Test 1 **Query-Parameter & Header**  
   - Nur gültige Parameter werden in die URL geschrieben  
   - Undefinierte/Leere Werte werden ignoriert  
   - Header enthält immer `Accept: application/json`

2. Test 2 **Caching**  
   - Bei identischen Parametern wird nur **einmal** `fetch` aufgerufen  
   - Weitere Aufrufe innerhalb der TTL kommen aus dem Cache

3. TEST 3 **Fehlerfälle**  
   - Wenn die API einen HTTP-Fehler liefert (`res.ok === false`),  
     wirft die Funktion eine klare Fehlermeldung mit 

## TAG 07 Übungen     
## Testing Backend 
Die Controller-Tests prüfen den Weather Controller (routes/weather.js), der auf dem Express-Server läuft.
Hierbei wird Supertest verwendet, um echte HTTP-Requests gegen die Express-App (index.js) zu simulieren.

### Controller
**Fehlerfall** 

- Request ohne latitude → Controller gibt 400 Bad Request mit Fehlermeldung zurück.
- Request ohne Vorhersageparameter → Controller gibt 400 Bad Request zurück.
-Wenn getForecast im Service einen Fehler wirft → Controller gibt 502 Bad Gateway zurück.

**gültige Anfrage**

Request mit latitude, longitude und hourly → Service wird aufgerufen, Controller gibt 200 OK + JSON zurück.

### Service-/Mapper-Tests
Die Service-Tests prüfen die Hilfsklasse openMeteo.js.
Dieser Service kümmert sich um Caching und API-Kommunikation mit Open-Meteo.

**Deterministisches Verhalten von `cacheKey`**
- Reihenfolge der Parameter darf keinen Einfluss auf den Key haben.

**Caching-Verhalten von `getForecast`**
- Beim ersten Aufruf wird ein API-Call durchgeführt (hier per `fetch` gemockt).
- Beim zweiten Aufruf mit gleichen Parametern wird das Ergebnis **aus dem Cache** zurückgegeben.
- Mit **Chai SoftAssertions (`chaiExpect`)** wird überprüft, dass mehrere Bedingungen gleichzeitig erfüllt sind:
  - Ergebnis enthält `{ ok: true }`
  - Beide Ergebnisse (`res1` und `res2`) sind inhaltlich korrekt
  - Beide Referenzen zeigen auf dasselbe Objekt (Cache).

**Fehlerfall – API-Error**
- Wenn `fetch` einen Fehlerstatus liefert (`ok: false`) → `getForecast` wirft eine Exception.

#### Relultat 
![alt text](image.png)

### Reports 
Für automatisierte Reports wurde Vitest Coverage eingerichtet.
#### package.json
```
"scripts": {
  "test": "vitest --run",
  "coverage": "vitest run --coverage"
}
```

#### vitest.config.js
```
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
```
![alt text](image-1.png)


## Pipeline
```
name: Node.js CI – OpenMeteo Weather

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-test:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: openmeteo-weather-js/server  

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: echo "Build step – Node/Express benötigt keinen Build-Prozess."

      - name: Run tests
        run: npx vitest --run --reporter=junit --outputFile=vitest-report.xml

      - name: Upload test report
        uses: actions/upload-artifact@v4
        with:
          name: vitest-report
          path: openmeteo-weather-js/server/vitest-report.xml
 
```
### Auslöser
- **Push** auf den Branch `main`
- **Pull Request** auf den Branch `main`

### Ablauf

| Schritt | Beschreibung |
|----------|---------------|
| **Checkout repository** | Klont das Repository in den Runner |
| **Setup Node.js** | Installiert Node.js Version 20 |
| **Install dependencies** | Führt `npm ci` aus, um Abhängigkeiten zu installieren |
| **Build project** | Kein Build-Prozess notwendig (Node/Express) |
| **Run tests** | Führt Tests mit `vitest` aus und erstellt einen JUnit-Testreport |
| **Upload test report** | Lädt den Testreport als Artefakt hoch |

![alt text](image-2.png)
![alt text](image-3.png)
In diesem Bild sieht man, dass die Pipeline funktioniert und die Tests auch erfolgreicht durchgegangen sind