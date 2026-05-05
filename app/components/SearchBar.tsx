'use client';

import { useState, useRef } from 'react';
import { WeatherData, ForecastData } from '../types';
import RecentSearches from './RecentSearches';

interface SearchBarProps {
  recentSearches: string[];
  isDarkTheme: boolean;
  isLoading: boolean;
  onWeatherFound: (weather: WeatherData, forecast: ForecastData) => void;
  onError: (message: string) => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
}

export default function SearchBar({
  recentSearches,
  isDarkTheme,
  isLoading,
  onWeatherFound,
  onError,
  onLoadStart,
  onLoadEnd,
}: SearchBarProps) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cardBg = isDarkTheme ? '#1a2540' : '#ffffff';
  const border = isDarkTheme ? '#2d3748' : '#cbd5e0';
  const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';

  const handleSearch = async (city: string) => {
    const trimmed = city.trim();
    if (!trimmed) return;

    onLoadStart();
    setInput('');
    setShowDropdown(false);
    inputRef.current?.blur();

    try {
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      // Check localStorage cache first
      const cached = localStorage.getItem(trimmed);
      if (cached) {
        const { weather, forecast } = JSON.parse(cached);
        onWeatherFound(weather, forecast);
        return;
      }

      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${trimmed}&appid=${apiKey}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${trimmed}&appid=${apiKey}&units=metric`),
      ]);

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error(`City "${trimmed}" not found. Please check the spelling and try again.`);
      }

      const weather: WeatherData = await weatherRes.json();
      const forecast: ForecastData = await forecastRes.json();

      // Cache the result
      localStorage.setItem(weather.name, JSON.stringify({ weather, forecast }));

      onWeatherFound(weather, forecast);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      onLoadEnd();
    }
  };

  return (
    <div
      data-search-container
      style={{ position: 'relative', width: '100%' }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        id="city-search-input"
        type="text"
        placeholder="Search city..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(input); }}
        disabled={isLoading}
        aria-label="Search for a city"
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: cardBg,
          border: `1px solid ${border}`,
          borderRadius: '20px',
          color: textColor,
          fontSize: '14px',
          outline: 'none',
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? 'not-allowed' : 'text',
          boxSizing: 'border-box',
        }}
      />

      {/* Recent Searches Dropdown */}
      {showDropdown && recentSearches.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: cardBg,
            border: `1px solid ${border}`,
            borderRadius: '12px',
            marginTop: '8px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <RecentSearches
            searches={recentSearches}
            isDarkTheme={isDarkTheme}
            onSearchClick={(location) => handleSearch(location)}
          />
        </div>
      )}
    </div>
  );
}
