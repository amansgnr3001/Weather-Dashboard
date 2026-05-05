'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt_txt: string;
}

interface ForecastData {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
  };
}

export default function Home() {
  const [geoWeatherData, setGeoWeatherData] = useState<WeatherData | null>(null);
  const [geoForecastData, setGeoForecastData] = useState<ForecastData | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [expandedGeoCard, setExpandedGeoCard] = useState(false);
  const [displayedWeather, setDisplayedWeather] = useState<WeatherData | null>(null);
  const [displayedForecast, setDisplayedForecast] = useState<ForecastData | null>(null);
  const [tempUnit, setTempUnit] = useState(0); // 0 = Celsius, 1 = Fahrenheit
  const [searchInput, setSearchInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      setGeoLoading(true);
      const { latitude, longitude } = position.coords;

      try {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
        if (!apiKey) {
          throw new Error('API key not found');
        }

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
        );

        if (!res.ok) {
          throw new Error(`Weather API error: ${res.status}`);
        }

        const weather = await res.json();
        setGeoWeatherData(weather);

        // Fetch 5-day forecast
        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
        );

        if (!forecastRes.ok) {
          throw new Error(`Forecast API error: ${forecastRes.status}`);
        }

        const forecast = await forecastRes.json();
        setGeoForecastData(forecast);
      } catch (err) {
        console.error('Error fetching geolocation weather:', err);
      } finally {
        setGeoLoading(false);
      }
    });
  }, []);

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getDailyForecast = (forecast: ForecastData | null) => {
    if (!forecast) return [];

    const dailyForecasts: { [key: string]: ForecastItem } = {};

    forecast.list.forEach((item) => {
      const date = new Date(item.dt_txt).toLocaleDateString();
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = item;
      }
    });

    return Object.values(dailyForecasts).slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const convertTemperature = (celsius: number): number => {
    if (tempUnit === 1) {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  };

  const getTempUnit = (): string => {
    return tempUnit === 0 ? '°C' : '°F';
  };

  const handleSearch = async (city: string) => {
    if (!city.trim()) return;
    
    setSearchLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
      );

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error('Location not found');
      }

      const weather = await weatherRes.json();
      const forecast = await forecastRes.json();

      setDisplayedWeather(weather);
      setDisplayedForecast(forecast);
      setExpandedGeoCard(false);
      setSearchInput('');
    } catch (err) {
      console.error('Search error:', err);
      alert('Could not find weather for that location');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGeoCardClick = () => {
    setExpandedGeoCard(!expandedGeoCard);
    // When geolocation card is clicked, it overwrites the displayed weather
    if (!expandedGeoCard) {
      setDisplayedWeather(geoWeatherData);
      setDisplayedForecast(geoForecastData);
    }
  };

  return (
    <div style={{ backgroundColor: '#0f1419', minHeight: '100vh', color: '#ffffff', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top Navigation Bar */}
      <div style={{ backgroundColor: '#1a202c', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d3748' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Menu Icon */}
          <button style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}>☰</button>
          {/* Bell Icon */}
          <button style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}>🔔</button>
          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0aec0' }}>
            <span>📍</span>
            <span style={{ fontSize: '14px' }}>{displayedWeather?.name || geoWeatherData?.name || 'Select Location'}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ flex: 0.4 }}>
          <input
            type="text"
            placeholder="Search city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchInput);
              }
            }}
            disabled={searchLoading}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#2d3748',
              border: '1px solid #4a5568',
              borderRadius: '24px',
              color: '#ffffff',
              fontSize: '14px',
              opacity: searchLoading ? 0.6 : 1,
              cursor: searchLoading ? 'not-allowed' : 'text',
            }}
          />
        </div>

        {/* Right Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Settings */}
          <button style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}>⚙️</button>
          {/* Theme Toggle */}
          <button
            onClick={() => setTempUnit(tempUnit === 0 ? 1 : 0)}
            style={{
              backgroundColor: '#2d3748',
              border: 'none',
              color: '#ffffff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            {tempUnit === 0 ? '🌙' : '☀️'}
          </button>
          {/* Profile */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#c48a62', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '32px', display: 'flex', gap: '32px' }}>
        {/* Left Side - Main Weather Card and Forecast */}
        <div style={{ flex: 1 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', borderBottom: '1px solid #2d3748', paddingBottom: '16px' }}>
            <button style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: '16px', cursor: 'pointer', paddingBottom: '8px', borderBottom: '2px solid #0066cc' }}>Today</button>
            <button style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: '16px', cursor: 'pointer' }}>Tomorrow</button>
            <button style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: '16px', cursor: 'pointer' }}>Next 7 days</button>
          </div>

          {/* Main Weather Card */}
          {displayedWeather && (expandedGeoCard || displayedWeather.name !== geoWeatherData?.name) && (
            <div style={{ backgroundColor: '#1a202c', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Left: Weather Icon and Main Info */}
                <div>
                  <img
                    src={getWeatherIcon(displayedWeather.weather[0].icon)}
                    alt={displayedWeather.weather[0].description}
                    style={{ width: '120px', height: '120px' }}
                  />
                </div>

                {/* Right: Temperature and Details */}
                <div>
                  <div style={{ fontSize: '64px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {convertTemperature(displayedWeather.main.temp).toFixed(0)}{getTempUnit()}
                  </div>
                  <div style={{ fontSize: '18px', color: '#a0aec0', marginBottom: '24px', textTransform: 'capitalize' }}>
                    {displayedWeather.weather[0].description}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Real Feel</div>
                      <div style={{ fontSize: '16px' }}>{convertTemperature(displayedWeather.main.feels_like).toFixed(0)}{getTempUnit()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Wind</div>
                      <div style={{ fontSize: '16px' }}>NE {displayedWeather.wind.speed} km/h</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Pressure</div>
                      <div style={{ fontSize: '16px' }}>{displayedWeather.main.pressure} hPa</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Humidity</div>
                      <div style={{ fontSize: '16px' }}>{displayedWeather.main.humidity}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Toggle Button */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button style={{ backgroundColor: '#0066cc', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              Forecast
            </button>
            <button style={{ backgroundColor: 'transparent', color: '#a0aec0', border: '1px solid #4a5568', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              Air quality
            </button>
          </div>

          {/* 7-Day Forecast Grid */}
          {displayedForecast && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
              {getDailyForecast(displayedForecast).map((day, index) => {
                const dayName = new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#1a202c',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      border: index === 0 ? '2px solid #4a5568' : '1px solid #2d3748',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '8px' }}>
                      {dayName}
                    </div>
                    <img
                      src={getWeatherIcon(day.weather[0].icon)}
                      alt={day.weather[0].description}
                      style={{ width: '48px', height: '48px', margin: '0 auto 8px' }}
                    />
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {convertTemperature(day.main.temp).toFixed(0)}{getTempUnit()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                      {convertTemperature(day.main.temp_min).toFixed(0)}° / {convertTemperature(day.main.temp_max).toFixed(0)}°
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - Chance of Rain Chart */}
        <div style={{ width: '240px' }}>
          <div style={{ backgroundColor: '#1a202c', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '24px' }}>Chance of rain</div>
            
            {/* Rain Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '160px', gap: '8px' }}>
              {[65, 45, 85, 30, 70, 50, 40].map((height, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#0066cc',
                    borderRadius: '4px',
                    flex: 1,
                    height: `${height}%`,
                    minHeight: '20px',
                  }}
                />
              ))}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '24px', fontSize: '12px', color: '#a0aec0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Rainy</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Sunny</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Heavy</span>
              </div>
            </div>

            {/* Time Labels */}
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', fontSize: '10px', color: '#718096', textAlign: 'center' }}>
              <div>10AM</div>
              <div>11AM</div>
              <div>12AM</div>
              <div>1PM</div>
              <div>2PM</div>
              <div>3PM</div>
              <div>4PM</div>
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Card - Below Main Content */}
      {geoWeatherData && !geoLoading && (
        <div style={{ padding: '0 32px', marginBottom: '32px' }}>
          <div
            onClick={handleGeoCardClick}
            style={{
              backgroundColor: '#1a202c',
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
              border: expandedGeoCard ? '2px solid #0066cc' : '1px solid #2d3748',
              transition: 'all 0.3s ease',
              maxWidth: '300px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#a0aec0' }}>
              Your Location
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
              {geoWeatherData.name}, {geoWeatherData.sys.country}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px' }}>
              {convertTemperature(geoWeatherData.main.temp).toFixed(0)}{getTempUnit()}
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              {expandedGeoCard ? 'Click to collapse' : 'Click to expand'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
