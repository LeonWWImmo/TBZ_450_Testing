import { Router } from 'express';
import { getForecast } from '../services/openMeteo.js';

export const weatherRouter = Router();

function pickDefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

weatherRouter.get('/forecast', async (req, res) => {
  const {
    latitude,
    longitude,
    hourly,
    daily,
    current,
    timezone = 'auto',
    past_days,
    forecast_days
  } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'latitude und longitude sind erforderlich' });
  }

  if (!hourly && !daily && !current) {
    return res.status(400).json({ error: 'Mindestens einer von: hourly, daily oder current' });
  }

  try {
    const params = pickDefined({ latitude, longitude, hourly, daily, current, timezone, past_days, forecast_days });
    const data = await getForecast(params);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch forecast', message: err?.message || String(err) });
  }
});
