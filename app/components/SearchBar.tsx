'use client';

import { useState, useEffect } from 'react';
import RecentSearches from './RecentSearches';

interface SearchBarProps {
  onSearch?: (location: string) => void;
  onWeatherFound?: (weather: WeatherData, forecast: ForecastData) => void;
}

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

export default function SearchBar({ onSearch, onWeatherFound }: SearchBarProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (err) {
        console.error('Error parsing recentSearches from localStorage:', err);
      }
    }
  }, []);

  // Validation function
  const validateInput = (value: string): { isValid: boolean; errorMessage?: string } => {
    // Check if input is empty or only whitespace
    if (!value.trim()) {
      return { isValid: false, errorMessage: 'Location cannot be empty' };
    }

    // Check minimum length
    if (value.trim().length < 2) {
      return { isValid: false, errorMessage: 'Location must be at least 2 characters' };
    }

    // Check maximum length
    if (value.trim().length > 50) {
      return { isValid: false, errorMessage: 'Location cannot exceed 50 characters' };
    }

    // Check for invalid characters (only allow letters, spaces, hyphens, and apostrophes)
    const validPattern = /^[a-zA-Z\s\-']+$/;
    if (!validPattern.test(value.trim())) {
      return {
        isValid: false,
        errorMessage: 'Location can only contain letters, spaces, hyphens, and apostrophes',
      };
    }

    return { isValid: true };
  };

  // Add search to history (max 3) with API response
  const addToSearchHistory = (location: string, weatherData: WeatherData, forecastData: ForecastData) => {
    setRecentSearches((prevSearches) => {
      let updated = [...prevSearches];
      let removedLocation: string | null = null;
      
      // Remove if already exists (to avoid duplicates)
      updated = updated.filter((search) => search !== location);
      
      // Add new search at the beginning
      updated.unshift(location);
      
      // Keep only last 3
      if (updated.length > 3) {
        removedLocation = updated.pop() || null;
      }
      
      // Remove old location from localStorage if it exceeded the limit
      if (removedLocation) {
        localStorage.removeItem(removedLocation);
      }
      
      // Store the API response with location as key
      const apiResponse = {
        weather: weatherData,
        forecast: forecastData,
      };
      localStorage.setItem(location, JSON.stringify(apiResponse));
      
      // Save to localStorage
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSearch = () => {
    const validation = validateInput(input);
    console.log('Search clicked, input:', input);
    console.log('Validation result:', validation);

    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid input');
      return;
    }

    // If validation passes, fetch weather
    const trimmedLocation = input.trim();
    console.log('Fetching weather for:', trimmedLocation);
    fetchWeather(trimmedLocation);
    setInput(''); // Clear input after search
    setError(null);
  };

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

      // Add to search history with API response
      addToSearchHistory(currentWeather.name, currentWeather, forecast);

      // Call the callback to notify parent
      if (onWeatherFound) {
        onWeatherFound(currentWeather, forecast);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setWeatherData(null);
      setForecastData(null);
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
    <div style={{ marginBottom: '20px' }}>
      {/* Search Input and Button */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter city name (e.g., London, New York)"
            style={{
              padding: '10px',
              fontSize: '16px',
              border: error ? '2px solid red' : '2px solid #ccc',
              borderRadius: '4px',
              flex: 1,
              minWidth: '200px',
              color: '#ffffff',
              backgroundColor: '#1a1a1a',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0056b3';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#007bff';
            }}
          >
            Search
          </button>
      </div>

      {/* Error Card */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '2px solid #f44336',
            borderRadius: '8px',
            padding: '15px 20px',
            marginBottom: '15px',
            color: '#c62828',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 4px rgba(244, 67, 54, 0.2)',
          }}
        >
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading Message */}
      {loading && <p style={{ color: '#000000', fontSize: '16px', marginTop: '15px' }}>Loading weather data...</p>}

      {/* Recent Searches Component */}
      <RecentSearches 
        searches={recentSearches} 
        onSearchClick={(location) => {
          setInput(location);
          fetchWeather(location);
        }} 
      />
    </div>
  );
}
