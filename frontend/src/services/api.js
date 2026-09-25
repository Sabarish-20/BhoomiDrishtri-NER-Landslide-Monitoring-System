const API_BASE_URL = 'http://localhost:8000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function fetchCorridorGrid() {
  const res = await fetch(`${API_BASE_URL}/api/corridor/grid`);
  if (!res.ok) throw new Error('Failed to fetch corridor grid GeoJSON');
  return res.json();
}

export async function fetchCurrentWeather() {
  const res = await fetch(`${API_BASE_URL}/api/weather/current`);
  if (!res.ok) throw new Error('Failed to fetch weather telemetry');
  return res.json();
}

export async function triggerStormSimulation(rainfall_mm_hr, antecedent_days = 5, event_name = 'Cloudburst Surge') {
  const res = await fetch(`${API_BASE_URL}/api/simulation/trigger-storm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rainfall_mm_hr, antecedent_days, event_name })
  });
  if (!res.ok) throw new Error('Failed to trigger storm simulation');
  return res.json();
}

export async function resetStormSimulation() {
  const res = await fetch(`${API_BASE_URL}/api/simulation/reset`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset simulation');
  return res.json();
}

export async function fetchActiveAlerts() {
  const res = await fetch(`${API_BASE_URL}/api/alerts/active`);
  if (!res.ok) throw new Error('Failed to fetch active CAP alerts');
  return res.json();
}

export async function fetchLatestCapXml() {
  const res = await fetch(`${API_BASE_URL}/api/alerts/latest.xml`);
  if (!res.ok) throw new Error('Failed to fetch CAP XML');
  return res.text();
}

export async function submitCitizenReport(reportData) {
  const res = await fetch(`${API_BASE_URL}/api/crowdsource/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
  if (!res.ok) throw new Error('Failed to submit citizen report');
  return res.json();
}

export async function fetchCrowdsourceClusters() {
  const res = await fetch(`${API_BASE_URL}/api/crowdsource/clusters`);
  if (!res.ok) throw new Error('Failed to fetch crowdsource clusters');
  return res.json();
}

export async function fetchLogisticsDepots() {
  const res = await fetch(`${API_BASE_URL}/api/logistics/depots`);
  if (!res.ok) throw new Error('Failed to fetch BRO depots');
  return res.json();
}

export async function fetchDispatchAdvisory(targetKm, debrisVolume = 450) {
  const res = await fetch(`${API_BASE_URL}/api/logistics/dispatch?target_km=${targetKm}&debris_volume_m3=${debrisVolume}`);
  if (!res.ok) throw new Error('Failed to fetch dispatch advisory');
  return res.json();
}
