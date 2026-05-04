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

interface CityWeatherProps {
  location: string;
  onError?: (error: string) => void;
}

export default function CityWeather({ location, onError }: CityWeatherProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (locationName: string) => {
    if (!locationName.trim()) {
      setError('Please provide a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      console.log('API Key:', apiKey);
      console.log('Searching for location:', locationName);

      if (!apiKey) {
        throw new Error('API key not found in environment');
      }

      // Fetch current weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${locationName}&appid=${apiKey}&units=metric`;
      console.log('Fetching from:', weatherUrl);
      
      const weatherResponse = await fetch(weatherUrl);

      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
      }

      const currentWeather: WeatherData = await weatherResponse.json();
      setWeatherData(currentWeather);
      console.log('Current Weather Data:', currentWeather);

      // Fetch 5-day forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${locationName}&appid=${apiKey}&units=metric`;
      const forecastResponse = await fetch(forecastUrl);

      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
      }

      const forecast: ForecastData = await forecastResponse.json();
      setForecastData(forecast);
      console.log('Forecast Data:', forecast);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CityWeather received location prop:', location);
    if (location) {
      fetchWeather(location);
    }
  }, [location]);

  // Get daily forecast (one per day at noon)
  const getDailyForecast = () => {
    if (!forecastData) return [];

    const dailyForecasts: { [key: string]: ForecastItem } = {};

    forecastData.list.forEach((item) => {
      const date = new Date(item.dt_txt).toLocaleDateString();
      // Only keep one forecast per day (preferably around noon)
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = item;
      }
    });

    return Object.values(dailyForecasts).slice(0, 5);
  };

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#000000' }}>
      {loading && <p style={{ color: '#000000', fontSize: '16px' }}>Loading weather data...</p>}
      {error && <p style={{ color: '#000000', fontSize: '16px', fontWeight: 'bold' }}>Error: {error}</p>}

      {weatherData && (
        <div>
          {/* Current Weather Display */}
          <div
            style={{
              border: '2px solid #333',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px',
              backgroundColor: '#f5f5f5',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Current Weather in {weatherData.name}, {weatherData.sys.country}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <img
                src={getWeatherIcon(weatherData.weather[0].icon)}
                alt={weatherData.weather[0].description}
                style={{ width: '80px', height: '80px', marginRight: '20px' }}
              />
              <div>
                <p style={{ fontSize: '36px', margin: '0', fontWeight: 'bold' }}>
                  {weatherData.main.temp}°C
                </p>
                <p style={{ fontSize: '18px', margin: '5px 0 0 0', textTransform: 'capitalize' }}>
                  {weatherData.weather[0].description}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Feels Like:</strong> {weatherData.main.feels_like}°C
                </p>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Humidity:</strong> {weatherData.main.humidity}%
                </p>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Wind Speed:</strong> {weatherData.wind.speed} m/s
                </p>
              </div>
              <div>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Temp Min:</strong> {weatherData.main.temp_min}°C
                </p>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Temp Max:</strong> {weatherData.main.temp_max}°C
                </p>
                <p style={{ marginBottom: '10px' }}>
                  <strong>Pressure:</strong> {weatherData.main.pressure} hPa
                </p>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast Display */}
          {forecastData && (
            <div>
              <h3>5-Day Forecast</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '15px',
                  marginTop: '15px',
                }}
              >
                {getDailyForecast().map((day, index) => (
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
                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      {formatDate(day.dt_txt)}
                    </p>
                    <img
                      src={getWeatherIcon(day.weather[0].icon)}
                      alt={day.weather[0].description}
                      style={{ width: '60px', height: '60px', margin: '0 auto 10px' }}
                    />
                    <p style={{ marginBottom: '10px', textTransform: 'capitalize', fontSize: '14px' }}>
                      {day.weather[0].description}
                    </p>
                    <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                      {day.main.temp}°C
                    </p>
                    <p style={{ marginBottom: '5px', fontSize: '12px' }}>
                      L: {day.main.temp_min}° H: {day.main.temp_max}°
                    </p>
                    <p style={{ marginBottom: '5px', fontSize: '12px' }}>
                      Humidity: {day.main.humidity}%
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
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
