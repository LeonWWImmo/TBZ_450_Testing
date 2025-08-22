const BASE = 'https://api.open-meteo.com/v1/forecast';

const cache = new Map();
const TTL = Number(process.env.CACHE_TTL_MS || 5 * 60 * 1000);

function cacheKey(params) {
  return JSON.stringify(Object.entries(params).sort(([a],[b]) => a.localeCompare(b)));
}

export async function getForecast(params) {
  const key = cacheKey(params);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.data;

  const url = new URL(BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
  const json = await res.json();
  cache.set(key, { expires: now + TTL, data: json });
  return json;
}
