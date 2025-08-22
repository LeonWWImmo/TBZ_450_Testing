# Open‑Meteo Wetter‑App (JS Backend + HTML/JS Frontend)

## Struktur
```
openmeteo-weather-js/
├─ server/            # Express-Backend (JavaScript, ESM)
│  ├─ src/
│  │  ├─ routes/weather.js
│  │  ├─ services/openMeteo.js
│  │  └─ index.js
│  ├─ package.json
│  └─ .env.example
└─ web/               # Statisches Frontend (HTML + JS + CSS)
   ├─ index.html
   ├─ app.js
   └─ styles.css
```

## Start
```bash
# Backend
cd server
cp .env.example .env
npm install
npm run dev   # http://localhost:4000

# Frontend
# Öffne web/index.html direkt im Browser
# oder starte einen statischen Server: z. B. npx serve web
```

Das Frontend greift standardmäßig auf `http://localhost:4000` zu. Du kannst die Basis-URL im Browser über
```js
localStorage.setItem('OPEN_METEO_API_BASE', 'http://dein-host:4000')
```
ändern.

## Beispiel-Request
```
GET http://localhost:4000/api/forecast?latitude=47.3769&longitude=8.5417&hourly=temperature_2m,weather_code&timezone=Europe/Zurich
```

## Hinweise
- In‑Memory Cache im Service (`CACHE_TTL_MS` per .env; Default 5 min).
- Query‑Parameter werden 1:1 an Open‑Meteo weitergereicht (Basisvalidierung im Router).
- Frontend nutzt Chart.js (CDN) für ein einfaches Temperatur‑Diagramm.
- **Tests sind absichtlich NICHT enthalten**, damit ihr eigene Tests hinzufügen könnt.
