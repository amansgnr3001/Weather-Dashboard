'use client';

import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';

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

  const handleGeoCardClick = () => {
    setExpandedGeoCard(!expandedGeoCard);
    // When geolocation card is clicked, it overwrites the displayed weather
    if (!expandedGeoCard) {
      setDisplayedWeather(geoWeatherData);
      setDisplayedForecast(geoForecastData);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Temperature Unit Toggle Button - Top Left */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button
          onClick={() => setTempUnit(tempUnit === 0 ? 1 : 0)}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: tempUnit === 0 ? '#007bff' : '#ff9800',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
        >
          {tempUnit === 0 ? '°C Celsius' : '°F Fahrenheit'}
        </button>
      </div>

      <h1 style={{ textAlign: 'center', color: '#000000' }}>Weather Forecasting Dashboard</h1>

      {/* Search Bar Row with Geolocation Card */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {geoLoading && <p style={{ textAlign: 'center', color: '#000000', margin: '0' }}>Getting your location...</p>}
          <SearchBar onWeatherFound={(weather, forecast) => {
            setDisplayedWeather(weather);
            setDisplayedForecast(forecast);
            setExpandedGeoCard(false);
          }} />
        </div>

        {/* Right: Geolocation Compact Card */}
        {geoWeatherData && !geoLoading && (
          <div
            onClick={handleGeoCardClick}
            style={{
              cursor: 'pointer',
              border: '2px solid #28a745',
              borderRadius: '8px',
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              minWidth: '200px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.2)';
            }}
          >
            <p style={{ margin: '0 0 8px 0', color: '#000000', fontSize: '14px', fontWeight: 'bold' }}>
              {geoWeatherData.name}, {geoWeatherData.sys.country}
            </p>
            <p style={{ margin: '0', color: '#28a745', fontSize: '20px', fontWeight: 'bold' }}>
              {convertTemperature(geoWeatherData.main.temp).toFixed(1)}{getTempUnit()}
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '12px' }}>
              {expandedGeoCard ? 'Click to collapse' : 'Click to expand'}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Weather Details Section - Toggles between geolocation and search */}
      {displayedWeather && (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#000000', marginBottom: '30px' }}>
          {/* Current Weather Display */}
          <div
            style={{
              border: expandedGeoCard ? '2px solid #28a745' : '2px solid #007bff',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px',
              backgroundColor: expandedGeoCard ? '#f0fdf4' : '#f0f8ff',
            }}
          >
            <h2 style={{ marginTop: 0, color: '#000000' }}>
              Current Weather in {displayedWeather.name}, {displayedWeather.sys.country}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <img
                src={getWeatherIcon(displayedWeather.weather[0].icon)}
                alt={displayedWeather.weather[0].description}
                style={{ width: '80px', height: '80px', marginRight: '20px' }}
              />
              <div>
                <p style={{ fontSize: '36px', margin: '0', fontWeight: 'bold', color: '#000000' }}>
                  {convertTemperature(displayedWeather.main.temp).toFixed(1)}{getTempUnit()}
                </p>
                <p style={{ fontSize: '18px', margin: '5px 0 0 0', textTransform: 'capitalize', color: '#000000' }}>
                  {displayedWeather.weather[0].description}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <p style={{ marginBottom: '10px', color: '#000000' }}>
                  <strong>Feels Like:</strong> {convertTemperature(displayedWeather.main.feels_like).toFixed(1)}{getTempUnit()}
                </p>
                <p style={{ marginBottom: '10px', color: '#000000' }}>
                  <strong>Humidity:</strong> {displayedWeather.main.humidity}%
                </p>
                <p style={{ marginBottom: '10px', color: '#000000' }}>
                  <strong>Wind Speed:</strong> {displayedWeather.wind.speed} m/s
                </p>
              </div>
              <div>
                <p style={{ marginBottom: '10px', color: '#000000' }}>
                  <strong>Temp Min:</strong> {convertTemperature(displayedWeather.main.temp_min).toFixed(1)}{getTempUnit()}
                </p>
                <p style={{ marginBottom: '10px', color: '#000000' }}>
                  <strong>Temp Max:</strong> {convertTemperature(displayedWeather.main.temp_max).toFixed(1)}{getTempUnit()}
                </p>
                <p style={{ marginBottom: '10px', color: '#000000' }}>
                  <strong>Pressure:</strong> {displayedWeather.main.pressure} hPa
                </p>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          {displayedForecast && (
            <div>
              <h3 style={{ color: '#000000', margin: '20px 0 15px 0' }}>5-Day Forecast</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '15px',
                  marginTop: '15px',
                }}
              >
                {getDailyForecast(displayedForecast).map((day, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: '#fff',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#000000' }}>
                      {formatDate(day.dt_txt)}
                    </p>
                    <img
                      src={getWeatherIcon(day.weather[0].icon)}
                      alt={day.weather[0].description}
                      style={{ width: '60px', height: '60px', margin: '0 auto 10px' }}
                    />
                    <p style={{ marginBottom: '10px', textTransform: 'capitalize', fontSize: '14px', color: '#000000' }}>
                      {day.weather[0].description}
                    </p>
                    <p style={{ marginBottom: '5px', fontWeight: 'bold', color: '#000000' }}>
                      {convertTemperature(day.main.temp).toFixed(1)}{getTempUnit()}
                    </p>
                    <p style={{ marginBottom: '5px', fontSize: '12px', color: '#000000' }}>
                      L: {convertTemperature(day.main.temp_min).toFixed(1)}° H: {convertTemperature(day.main.temp_max).toFixed(1)}°
                    </p>
                    <p style={{ marginBottom: '5px', fontSize: '12px', color: '#000000' }}>
                      Humidity: {day.main.humidity}%
                    </p>
                    <p style={{ fontSize: '12px', color: '#000000' }}>
                      Wind: {day.wind.speed} m/s
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
