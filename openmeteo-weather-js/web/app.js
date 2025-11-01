// /app.js
const UI = {
  form: document.getElementById('query-form'),
  status: document.getElementById('status'),
  tableBody: document.querySelector('#hours tbody'),
  chartEl: document.getElementById('tempChart'),
  btnGeo: document.getElementById('btn-geolocate'),
  inputs: {
    lat: document.getElementById('lat'),
    lon: document.getElementById('lon'),
    hourly: document.getElementById('hourly'),
    tz: document.getElementById('tz'),
  }
};

const DEFAULT_HOURLY = 'temperature_2m,weather_code';
const OPEN_METEO_BASE = (localStorage.getItem('OPEN_METEO_API_BASE') || '').trim();
const USE_PROXY = !!OPEN_METEO_BASE;
const API_BASE = USE_PROXY ? OPEN_METEO_BASE.replace(/\/$/, '') : 'https://api.open-meteo.com/v1/forecast';

let chart;
let currentAbort;

/* why: give clear feedback states */
function setStatus(msg, type = 'info') {
  UI.status.textContent = msg || '';
  UI.status.className = type;
}

function parseNum(v) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function paramsFromUI() {
  const lat = parseNum(UI.inputs.lat.value);
  const lon = parseNum(UI.inputs.lon.value);
  const hourly = (UI.inputs.hourly.value || DEFAULT_HOURLY).trim();
  const tz = (UI.inputs.tz.value || Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto').trim();
  return { lat, lon, hourly, tz };
}

function syncToURL({ lat, lon, hourly, tz }) {
  const usp = new URLSearchParams({
    lat: String(lat), lon: String(lon), hourly, tz
  });
  history.replaceState(null, '', '?' + usp.toString());
}

function syncFromURL() {
  const q = new URLSearchParams(location.search);
  if (q.has('lat')) UI.inputs.lat.value = q.get('lat');
  if (q.has('lon')) UI.inputs.lon.value = q.get('lon');
  if (q.has('hourly')) UI.inputs.hourly.value = q.get('hourly');
  if (q.has('tz')) UI.inputs.tz.value = q.get('tz');
}

function buildURL({ lat, lon, hourly, tz }) {
  if (USE_PROXY) {
    // Expected proxy route: /api/forecast?latitude=..&longitude=..&hourly=..&timezone=..
    const qs = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly, timezone: tz });
    return `${API_BASE}/api/forecast?${qs.toString()}`;
  }
  const qs = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly, timezone: tz });
  return `${API_BASE}?${qs.toString()}`;
}

async function fetchJSON(url, { timeoutMs = 10000 } = {}) {
  if (currentAbort) currentAbort.abort();
  const ctrl = new AbortController();
  currentAbort = ctrl;
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
    currentAbort = null;
  }
}

const WMO = {
  0: { icon: '☀️', text: 'Klar' },
  1: { icon: '🌤️', text: 'Überwiegend klar' },
  2: { icon: '⛅', text: 'Teilweise bewölkt' },
  3: { icon: '☁️', text: 'Bewölkt' },
  45: { icon: '🌫️', text: 'Nebel' }, 48: { icon: '🌫️', text: 'Reifiger Nebel' },
  51: { icon: '🌦️', text: 'Leichter Nieselregen' }, 53: { icon: '🌧️', text: 'Mäßiger Nieselregen' }, 55: { icon: '🌧️', text: 'Starker Nieselregen' },
  61: { icon: '🌧️', text: 'Leichter Regen' }, 63: { icon: '🌧️', text: 'Mäßiger Regen' }, 65: { icon: '🌧️', text: 'Starker Regen' },
  66: { icon: '🌨️', text: 'Gefrierender Regen (leicht)' }, 67: { icon: '🌨️', text: 'Gefrierender Regen (stark)' },
  71: { icon: '❄️', text: 'Leichter Schneefall' }, 73: { icon: '❄️', text: 'Mäßiger Schneefall' }, 75: { icon: '❄️', text: 'Starker Schneefall' },
  80: { icon: '🌧️', text: 'Leichte Schauer' }, 81: { icon: '🌧️', text: 'Mäßige Schauer' }, 82: { icon: '🌧️', text: 'Heftige Schauer' },
  95: { icon: '⛈️', text: 'Gewitter' }, 96: { icon: '⛈️', text: 'Gewitter mit leichtem Hagel' }, 99: { icon: '⛈️', text: 'Gewitter mit starkem Hagel' },
};

function weatherIcon(code) { return (WMO[code] || { icon: '❔' }).icon; }
function weatherText(code) { return (WMO[code] || { text: 'Unbekannt' }).text; }

function setWeatherBackground(code) {
  const map = { 0:'sunny',1:'sunny',2:'cloudy',3:'cloudy',45:'foggy',48:'foggy',51:'rainy',61:'rainy',71:'snowy',80:'rainy',95:'stormy',96:'stormy',99:'stormy' };
  document.body.setAttribute('data-weather', map[code] || 'default');
}

function renderTable(hourly) {
  UI.tableBody.innerHTML = '';
  const t = hourly.time || [];
  const temps = hourly.temperature_2m || [];
  const codes = hourly.weather_code || [];

  t.forEach((iso, i) => {
    const tr = document.createElement('tr');

    const td1 = document.createElement('td');
    td1.textContent = new Date(iso).toLocaleString('de-CH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

    const td2 = document.createElement('td');
    td2.textContent = (temps[i] ?? '-') ;

    const code = codes[i];
    const td3 = document.createElement('td');
    td3.textContent = (code ?? '-');

    const td4 = document.createElement('td');
    td4.textContent = weatherIcon(code);

    const td5 = document.createElement('td');
    td5.textContent = weatherText(code);

    tr.append(td1, td2, td3, td4, td5);
    UI.tableBody.appendChild(tr);
  });

  if (codes.length > 0) setWeatherBackground(codes[0]);
}

function renderChart(hourly) {
  const labels = (hourly.time || []).map(t =>
    new Date(t).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  );
  const data = hourly.temperature_2m || [];
  if (chart) chart.destroy();
  chart = new Chart(UI.chartEl, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Temperatur (°C)', data, pointRadius: 0, tension: 0.3, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: false } },
      animation: (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined)
    }
  });
}

async function loadForecast() {
  setStatus('Lade Vorhersage…');
  const p = paramsFromUI();
  if (p.lat == null || p.lon == null) { setStatus('Bitte gültige Koordinaten eingeben.', 'error'); return; }
  syncToURL(p);

  const hourly = p.hourly || DEFAULT_HOURLY;
  const url = buildURL({ lat: p.lat, lon: p.lon, hourly, tz: p.tz });

  try {
    const json = await fetchJSON(url);
    if (!json?.hourly) throw new Error('Antwort ohne stündliche Daten.');
    renderTable(json.hourly);
    renderChart(json.hourly);
    setStatus('');
  } catch (err) {
    const msg = (err?.name === 'AbortError') ? 'Abgebrochen.' :
                /HTTP 4\d\d/.test(err?.message) ? 'Anfragefehler (4xx).' :
                /HTTP 5\d\d/.test(err?.message) ? 'Serverfehler (5xx).' :
                'Fehler beim Laden.';
    setStatus(msg, 'error');
  }
}

/* Geolocation */
function geolocate() {
  if (!navigator.geolocation) { setStatus('Geolocation nicht verfügbar.', 'error'); return; }
  setStatus('Bestimme Standort…');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      UI.inputs.lat.value = pos.coords.latitude.toFixed(4);
      UI.inputs.lon.value = pos.coords.longitude.toFixed(4);
      setStatus('Standort gesetzt. Lade…');
      loadForecast();
    },
    () => setStatus('Konnte Standort nicht ermitteln.', 'error'),
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill timezone
  if (!UI.inputs.tz.value) UI.inputs.tz.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';

  syncFromURL();

  UI.form.addEventListener('submit', (e) => { e.preventDefault(); loadForecast(); });
  UI.btnGeo?.addEventListener('click', geolocate);

  // Auto-load first view
  loadForecast();
});
