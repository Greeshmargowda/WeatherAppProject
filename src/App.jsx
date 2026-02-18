import React, { useState } from 'react';

const API_BASE_URL = 'https://api.weatherstack.com';
const API_KEY = import.meta.env.VITE_WEATHERSTACK_API_KEY;

const MODES = {
  CURRENT: 'current',
  HISTORICAL: 'historical',
  MARINE: 'marine',
};

function buildUrl({ mode, location, date }) {
  const params = new URLSearchParams();
  params.set('access_key', API_KEY || '');

  if (mode === MODES.MARINE) {
    // Marine endpoint requires lat,long
    params.set('query', location);
    return `${API_BASE_URL}/marine?${params.toString()}`;
  }

  params.set('query', location);

  if (mode === MODES.HISTORICAL && date) {
    params.set('historical_date', date);
  }

  const endpoint = mode === MODES.HISTORICAL ? 'historical' : 'current';
  return `${API_BASE_URL}/${endpoint}?${params.toString()}`;
}

function App() {
  const [mode, setMode] = useState(MODES.CURRENT);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setWeatherData(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!API_KEY) {
      setError('Missing API key. Please set VITE_WEATHERSTACK_API_KEY in your .env file.');
      return;
    }

    if (!location.trim()) {
      setError('Please enter a location (city name or "lat,lon").');
      return;
    }

    if (mode === MODES.HISTORICAL && !date) {
      setError('Please pick a historical date.');
      return;
    }

    setIsLoading(true);
    setError('');
    setWeatherData(null);

    try {
      const url = buildUrl({ mode, location: location.trim(), date });
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.info || 'Failed to fetch weather data.');
      }

      setWeatherData(json);
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching weather data.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrent = () => {
    if (!weatherData || !weatherData.current) return null;

    const { location: loc, current } = weatherData;

    return (
      <div className="glass-card">
        <h2 className="card-title">Current Weather</h2>
        <p className="location-label">
          {loc?.name}, {loc?.country}
        </p>
        <div className="current-main">
          <div className="current-temp">
            <span className="temp-value">{current.temperature}°C</span>
            <span className="temp-feels">Feels like {current.feelslike}°C</span>
          </div>
          <div className="current-meta">
            <p>{current.weather_descriptions?.[0]}</p>
            <p>Humidity: {current.humidity}%</p>
            <p>Wind: {current.wind_speed} km/h {current.wind_dir}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderHistorical = () => {
    if (!weatherData || !weatherData.historical) return null;

    const dayData = weatherData.historical[date];
    if (!dayData) return null;

    return (
      <div className="glass-card">
        <h2 className="card-title">Historical Weather</h2>
        <p className="location-label">
          {weatherData.location?.name}, {weatherData.location?.country}
        </p>
        <p className="date-label">{date}</p>
        <div className="historical-grid">
          <div>
            <p className="metric-label">Max Temp</p>
            <p className="metric-value">{dayData.maxtemp}°C</p>
          </div>
          <div>
            <p className="metric-label">Min Temp</p>
            <p className="metric-value">{dayData.mintemp}°C</p>
          </div>
          <div>
            <p className="metric-label">Avg Temp</p>
            <p className="metric-value">{dayData.avgtemp}°C</p>
          </div>
          <div>
            <p className="metric-label">Avg Humidity</p>
            <p className="metric-value">{dayData.avghumidity}%</p>
          </div>
        </div>
      </div>
    );
  };

  const renderMarine = () => {
    if (!weatherData || !weatherData.marine) return null;

    const marine = weatherData.marine[0];
    if (!marine) return null;

    return (
      <div className="glass-card">
        <h2 className="card-title">Marine Weather</h2>
        <p className="location-label">
          Lat: {marine.lat}, Lon: {marine.lon}
        </p>
        <div className="historical-grid">
          <div>
            <p className="metric-label">Water Temp</p>
            <p className="metric-value">{marine.water_temp_c}°C</p>
          </div>
          <div>
            <p className="metric-label">Swell Height</p>
            <p className="metric-value">{marine.swell_height_m} m</p>
          </div>
          <div>
            <p className="metric-label">Swell Period</p>
            <p className="metric-value">{marine.swell_period_secs} s</p>
          </div>
          <div>
            <p className="metric-label">Wave Height</p>
            <p className="metric-value">{marine.wave_height_m} m</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPanel = () => {
    if (!weatherData) return null;
    if (mode === MODES.CURRENT) return renderCurrent();
    if (mode === MODES.HISTORICAL) return renderHistorical();
    if (mode === MODES.MARINE) return renderMarine();
    return null;
  };

  return (
    <div className="app-root">
      <div className="background-gradient" />
      <main className="app-shell">
        <header className="app-header glass-card">
          <div>
            <h1 className="app-title">Weather</h1>
            <p className="app-subtitle">Real-time, historical &amp; marine insights</p>
          </div>
          <div className="mode-toggle">
            <button
              type="button"
              className={`pill-button ${mode === MODES.CURRENT ? 'pill-button-active' : ''}`}
              onClick={() => handleModeChange(MODES.CURRENT)}
            >
              Current
            </button>
            <button
              type="button"
              className={`pill-button ${mode === MODES.HISTORICAL ? 'pill-button-active' : ''}`}
              onClick={() => handleModeChange(MODES.HISTORICAL)}
            >
              Historical
            </button>
            <button
              type="button"
              className={`pill-button ${mode === MODES.MARINE ? 'pill-button-active' : ''}`}
              onClick={() => handleModeChange(MODES.MARINE)}
            >
              Marine
            </button>
          </div>
        </header>

        <section className="layout-grid">
          <form className="glass-card controls-card" onSubmit={handleSubmit}>
            <h2 className="card-title">Location &amp; Filters</h2>
            <label className="field">
              <span className="field-label">
                {mode === MODES.MARINE ? 'Coordinates (lat,lon)' : 'Location'}
              </span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={
                  mode === MODES.MARINE ? 'e.g. 36.96,-122.02' : 'e.g. London, New York, 48.85,2.35'
                }
                className="text-input"
              />
            </label>

            {mode === MODES.HISTORICAL && (
              <label className="field">
                <span className="field-label">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-input"
                />
              </label>
            )}

            <div className="quick-locations">
              <span className="field-label">Quick locations</span>
              <div className="chip-row">
                {['London', 'New York', 'Tokyo', 'Sydney'].map((city) => (
                  <button
                    key={city}
                    type="button"
                    className="chip"
                    onClick={() => setLocation(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Fetching...' : 'Get Weather'}
            </button>

            {error && <p className="error-text">{error}</p>}
          </form>

          <div className="results-column">{renderPanel()}</div>
        </section>

        <footer className="footer-text">
          Powered by Weatherstack • Glassmorphic UI demo
        </footer>
      </main>
    </div>
  );
}

export default App;

