'use client';

import { useState, useEffect, useRef } from 'react';
import { WeatherData, ForecastData, ForecastItem } from './types';
import SearchBar from './components/SearchBar';
import CityWeather from './components/CityWeather';


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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme colors
  const theme = isDarkTheme ? {
    bg: '#0a0f1f',
    bgSecondary: '#0f1419',
    cardBg: '#1a2540',
    cardBgLight: '#a8c9e8',
    textPrimary: '#ffffff',
    textSecondary: '#a0aec0',
    textDark: '#0a0f1f',
    border: '#2d3748',
    accent: '#4a90e2',
  } : {
    bg: '#f5f7fa',
    bgSecondary: '#e8ecf1',
    cardBg: '#ffffff',
    cardBgLight: '#e8f0fd',
    textPrimary: '#1a202c',
    textSecondary: '#4a5568',
    textDark: '#1a202c',
    border: '#cbd5e0',
    accent: '#2563eb',
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      setIsDarkTheme(JSON.parse(savedTheme));
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(isDarkTheme));
  }, [isDarkTheme]);

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

  // Clear cache every hour (weather remains constant for ~1 hour)
  useEffect(() => {
    const clearCacheInterval = setInterval(() => {
      console.log('Clearing weather cache...');
      
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        try {
          const searches = JSON.parse(stored) as string[];
          searches.forEach((location) => {
            localStorage.removeItem(location);
            console.log(`Deleted cache for: ${location}`);
          });
          localStorage.removeItem('recentSearches');
          setRecentSearches([]);
          console.log('All weather cache cleared!');
        } catch (err) {
          console.error('Error clearing cache:', err);
        }
      }
    }, 3600000); // 1 hour = 3600000 ms

    return () => {
      clearInterval(clearCacheInterval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showSearchDropdown && !target.closest('[data-search-container]')) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchDropdown]);

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getWeatherEmoji = (iconCode: string): string => {
    const code = iconCode.substring(0, 2);
    const isDay = iconCode.endsWith('d');
    switch (code) {
      case '01': return isDay ? '☀️' : '🌙';
      case '02': return isDay ? '🌤️' : '🌤️';
      case '03': return '⛅';
      case '04': return '☁️';
      case '09': return '🌧️';
      case '10': return isDay ? '🌦️' : '🌧️';
      case '11': return '⛈️';
      case '13': return '❄️';
      case '50': return '🌫️';
      default: return '🌡️';
    }
  };

  const getDailyForecast = (forecast: ForecastData | null) => {
    if (!forecast) return [];

    const dailyForecasts: Record<string, ForecastItem> = {};

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
  const formatSunriseSetTime = (unixTimestamp: number) => {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  const convertTemperature = (celsius: number): number => {
    if (tempUnit === 1) {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  };

  const getTempUnit = (): string => {
    return tempUnit === 0 ? 'C' : 'F';
  };

  // Add search to history (max 3) with API response
  const addToSearchHistory = (location: string, weatherData: WeatherData, forecastData: ForecastData) => {
    setRecentSearches((prevSearches) => {
      let updated = [...prevSearches];
      
      // Remove if already exists (to avoid duplicates)
      updated = updated.filter((search) => search !== location);
      
      // Add new search at the beginning
      updated.unshift(location);
      
      // Keep only last 3
      let removedLocation: string | null = null;
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

  const handleSearch = async (city: string) => {
    if (!city.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchInput('');

    try {
      const trimmedCity = city.trim();
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

      if (!apiKey) {
        throw new Error('API key not configured');
      }

      // Check if location is in recent searches — load from localStorage cache
      if (recentSearches.includes(trimmedCity)) {
        const cachedData = localStorage.getItem(trimmedCity);
        if (cachedData) {
          const { weather, forecast } = JSON.parse(cachedData);
          setDisplayedWeather(weather);
          setDisplayedForecast(forecast);
          setExpandedGeoCard(false);
          setSearchLoading(false);
          return;
        }
      }

      // Not in cache — make API request
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${trimmedCity}&appid=${apiKey}&units=metric`
      );
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${trimmedCity}&appid=${apiKey}&units=metric`
      );

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error(`City "${trimmedCity}" not found. Please check the spelling and try again.`);
      }

      const weather = await weatherRes.json();
      const forecast = await forecastRes.json();

      addToSearchHistory(weather.name, weather, forecast);
      setDisplayedWeather(weather);
      setDisplayedForecast(forecast);
      setExpandedGeoCard(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSearchError(message);
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
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', color: theme.textPrimary, fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top Navigation Bar */}
      <div className="navbar" style={{ backgroundColor: theme.bgSecondary, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Notification Icon */}
          <button style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '16px', cursor: 'pointer' }}>●</button>
          {/* Location - Current Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textPrimary }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={{ fontSize: '14px' }}>{geoWeatherData?.name || 'Select Location'}</span>
          </div>
        </div>

        {/* Search Bar with Dropdown */}
        <div
          data-search-container
          className="search-container"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchInput);
                setSearchInput('');
                setShowSearchDropdown(false);
                searchInputRef.current?.blur();
              }
            }}
            disabled={searchLoading}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '20px',
              color: theme.textSecondary,
              fontSize: '14px',
              opacity: searchLoading ? 0.6 : 1,
              cursor: searchLoading ? 'not-allowed' : 'text',
            }}
          />
          
          {/* Recent Searches Dropdown */}
          {showSearchDropdown && recentSearches.length > 0 && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                marginTop: '8px',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '8px 16px', fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>
                  Recent Searches
                </div>
                {recentSearches.map((location, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked recent search:', location);
                      handleSearch(location);
                      setSearchInput('');
                      setShowSearchDropdown(false);
                      searchInputRef.current?.blur();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#a0aec0',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderBottom: index < recentSearches.length - 1 ? '1px solid #2d3748' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#263149';
                      (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#a0aec0';
                    }}
                  >
                    <span>🕐</span>
                    <span>{location}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Temperature Unit Toggle */}
          <button
            onClick={() => setTempUnit(tempUnit === 0 ? 1 : 0)}
            title="Toggle Celsius / Fahrenheit"
            style={{
              background: 'none',
              border: `1px solid ${theme.border}`,
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0',
              padding: '4px 6px',
              height: '32px',
            }}
          >
            <span style={{
              fontSize: '13px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '14px',
              backgroundColor: tempUnit === 0 ? theme.accent : 'transparent',
              color: tempUnit === 0 ? '#ffffff' : theme.textSecondary,
              transition: 'all 0.2s ease',
            }}>°C</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '14px',
              backgroundColor: tempUnit === 1 ? theme.accent : 'transparent',
              color: tempUnit === 1 ? '#ffffff' : theme.textSecondary,
              transition: 'all 0.2s ease',
            }}>°F</span>
          </button>

          {/* Dark/Light Theme Toggle */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
            }}
            title="Toggle theme"
          >
            {isDarkTheme ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffd700' }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffa500' }}>
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          {/* Profile */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#c48a62', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer' }}>👤</div>
        </div>
      </div>

      {/* Error Banner */}
      {searchError && (
        <div style={{
          margin: '0 32px',
          padding: '12px 20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>{searchError}</span>
          </div>
          <button
            onClick={() => setSearchError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#991b1b', lineHeight: 1 }}
            aria-label="Dismiss error"
          >×</button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-layout">
        {/* Left Side - Main Weather Card */}
        <div className="left-col">
          {/* Main Weather Card — rendered via CityWeather component */}
          {displayedWeather && (expandedGeoCard || displayedWeather.name !== geoWeatherData?.name) && (
            <CityWeather
              weatherData={displayedWeather}
              forecastData={displayedForecast}
              tempUnit={tempUnit}
              theme={theme}
              convertTemperature={convertTemperature}
              getTempUnit={getTempUnit}
              getWeatherEmoji={getWeatherEmoji}
              formatSunriseSetTime={formatSunriseSetTime}
            />
          )}
        </div>

        {/* Right Side - Forecast and Rain Chart */}
        <div className="right-col">
          {/* Forecast Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end' }}>
            <button style={{ backgroundColor: theme.cardBgLight, color: theme.textDark, border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              Forecast
            </button>
          </div>

          {/* Loading Skeleton */}
          {searchLoading && (
            <div>
              <div className="skeleton" style={{ backgroundColor: theme.cardBg, borderRadius: '12px', height: '110px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ backgroundColor: theme.cardBg, borderRadius: '16px', height: '280px' }} />
            </div>
          )}

          {/* Empty State */}
          {!displayedForecast && !searchLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '72px', lineHeight: '1' }}>🌍</span>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.textPrimary }}>Search for a city</div>
              <div style={{ fontSize: '14px', color: theme.textSecondary, maxWidth: '280px', lineHeight: '1.6' }}>
                Enter a city name in the search bar above to see current weather and a 5-day forecast.
              </div>
            </div>
          )}

          {/* 7-Day Forecast Grid (8 columns) */}
          {displayedForecast && !searchLoading && (
            <div className="forecast-grid">
              {getDailyForecast(displayedForecast).map((day, index) => {
                const date = new Date(day.dt_txt);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center',
                      border: index === 0 ? `2px solid ${theme.cardBgLight}` : `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                      {dayName}
                    </div>
                    <div style={{ fontSize: '22px', lineHeight: '1', marginBottom: '4px' }}>
                      {getWeatherEmoji(day.weather[0].icon)}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {convertTemperature(day.main.temp).toFixed(0)}°{getTempUnit()}
                    </div>
                  </div>
                );
              }).slice(0, 8)}
            </div>
          )}

          {/* Chance of Rain Chart */}
          {displayedForecast && (
            <div style={{ marginTop: '32px', backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '24px', color: theme.textPrimary }}>Hourly precipitation</div>
              
              {/* Professional Line Chart */}
              <div style={{ position: 'relative', height: '200px', marginBottom: '24px' }}>
                {/* Grid Lines */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {[0, 1, 2, 3, 4].map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        borderTop: '1px solid rgba(160, 174, 192, 0.1)',
                        fontSize: '10px',
                        color: '#718096',
                        paddingRight: '8px',
                        textAlign: 'right',
                      }}
                    >
                      {(100 - idx * 25)}%
                    </div>
                  ))}
                </div>

                {/* SVG Chart */}
                <svg
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  viewBox="0 0 800 200"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4a90e2" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4a90e2" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Area Chart */}
                  {displayedForecast.list.slice(0, 8).length > 0 && (
                    <>
                      {(() => {
                        const data = displayedForecast.list.slice(0, 8).map((item) => {
                          const cloudCover = item.clouds.all;
                          const isRainy = item.weather.some(w => ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.main));
                          return isRainy ? Math.min(100, cloudCover + 30) : cloudCover;
                        });

                        const xStep = 800 / (data.length - 1 || 1);
                        const yScale = 200 / 100;

                        const points = data.map((val, idx) => ({
                          x: idx * xStep,
                          y: 200 - val * yScale,
                        }));

                        const pathData = points
                          .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ');

                        const areaPath = `${pathData} L ${points[points.length - 1].x} 200 L 0 200 Z`;

                        return (
                          <>
                            {/* Area */}
                            <path d={areaPath} fill="url(#chartGradient)" />

                            {/* Line */}
                            <path d={pathData} stroke="#4a90e2" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Data Points */}
                            {points.map((p, idx) => (
                              <circle
                                key={idx}
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill="#ffffff"
                                stroke="#4a90e2"
                                strokeWidth="2"
                              />
                            ))}
                          </>
                        );
                      })()}
                    </>
                  )}
                </svg>

                {/* Time Labels */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#718096',
                  }}
                >
                  {displayedForecast.list.slice(0, 8).map((item, idx) => {
                    const time = new Date(item.dt_txt);
                    return (
                      <div key={idx} style={{ textAlign: 'center' }}>
                        {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Value Legend */}
              <div style={{ marginTop: '40px', display: 'flex', gap: '16px', fontSize: '12px', color: '#a0aec0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#4a90e2', borderRadius: '2px' }}></div>
                  <span>Precipitation chance</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Your Location Card - Bottom */}
      {geoWeatherData && !geoLoading && (
        <div style={{ padding: '0 32px 32px' }}>
          <div
            onClick={handleGeoCardClick}
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              border: expandedGeoCard ? `2px solid ${theme.cardBgLight}` : `1px solid ${theme.border}`,
              transition: 'all 0.3s ease',
              maxWidth: '300px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: theme.textSecondary }}>
              Your Location
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: theme.textPrimary }}>
              {geoWeatherData.name}, {geoWeatherData.sys.country}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px', lineHeight: '1' }}>{getWeatherEmoji(geoWeatherData.weather[0].icon)}</span>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: theme.accent }}>
                {convertTemperature(geoWeatherData.main.temp).toFixed(0)}°{getTempUnit()}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: theme.textSecondary }}>
              {expandedGeoCard ? 'Click to collapse' : 'Click to expand'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
