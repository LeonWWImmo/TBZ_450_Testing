const API_BASE = localStorage.getItem('OPEN_METEO_API_BASE') || 'http://localhost:4000';

const form = document.getElementById('query-form');
const statusEl = document.getElementById('status');
const tableBody = document.querySelector('#hours tbody');
let chart;

function setStatus(msg, type = 'info') {
  statusEl.textContent = msg || '';
  statusEl.className = type;
}

function buildQuery(params) {
  const qs = new URLSearchParams(params);
  return API_BASE.replace(/\/$/, '') + '/api/forecast?' + qs.toString();
}

async function fetchForecast({ latitude, longitude, hourly, timezone }) {
  const url = buildQuery({ latitude, longitude, hourly, timezone });
  const res = await fetch(url);
  if (!res.ok) throw new Error('Netzwerkfehler');
  return res.json();
}

function renderTable(hourly) {
  tableBody.innerHTML = '';
  const t = hourly.time || [];
  const temps = hourly.temperature_2m || [];
  const codes = hourly.weather_code || [];
  t.forEach((iso, i) => {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    const td3 = document.createElement('td');
    td1.textContent = new Date(iso).toLocaleString('de-CH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    td2.textContent = temps[i] ?? '-';
    td3.textContent = codes[i] ?? '-';
    tr.append(td1, td2, td3);
    tableBody.appendChild(tr);
  });
}

function renderChart(hourly) {
  const ctx = document.getElementById('tempChart');
  const labels = (hourly.time || []).map(t => new Date(t).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }));
  const data = hourly.temperature_2m || [];
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Temperatur (°C)', data, pointRadius: 0, tension: 0.3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: false } }
    }
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('Lade Vorhersage…');
  const latitude = document.getElementById('lat').value;
  const longitude = document.getElementById('lon').value;
  const hourly = document.getElementById('hourly').value;
  const timezone = document.getElementById('tz').value || 'auto';
  try {
    const json = await fetchForecast({ latitude, longitude, hourly, timezone });
    renderTable(json.hourly || {});
    renderChart(json.hourly || {});
    setStatus('');
  } catch (err) {
    setStatus(err.message || 'Fehler beim Laden', 'error');
  }
});
