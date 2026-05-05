'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    setSearchInput('');
    
    try {
      const trimmedCity = city.trim();
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Check if location is in recent searches - load from localStorage cache
      if (recentSearches.includes(trimmedCity)) {
        console.log('Found in recent searches, loading from localStorage:', trimmedCity);
        
        const cachedData = localStorage.getItem(trimmedCity);
        if (cachedData) {
          const { weather, forecast } = JSON.parse(cachedData);
          setDisplayedWeather(weather);
          setDisplayedForecast(forecast);
          setExpandedGeoCard(false);
          console.log('Loaded from cache');
          setSearchLoading(false);
          return;
        }
      }

      // Not in cache, make API request
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${trimmedCity}&appid=${apiKey}&units=metric`
      );
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${trimmedCity}&appid=${apiKey}&units=metric`
      );

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error('Location not found');
      }

      const weather = await weatherRes.json();
      const forecast = await forecastRes.json();

      // Add to search history and cache
      addToSearchHistory(weather.name, weather, forecast);
      
      setDisplayedWeather(weather);
      setDisplayedForecast(forecast);
      setExpandedGeoCard(false);
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
    <div style={{ backgroundColor: '#0a0f1f', minHeight: '100vh', color: '#ffffff', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top Navigation Bar */}
      <div style={{ backgroundColor: '#0f1419', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1a2540' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Notification Icon */}
          <button style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '16px', cursor: 'pointer' }}>●</button>
          {/* Location - Current Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
            <span>📍</span>
            <span style={{ fontSize: '14px' }}>{geoWeatherData?.name || 'Select Location'}</span>
          </div>
        </div>

        {/* Search Bar with Dropdown */}
        <div 
          data-search-container
          style={{ flex: 0.3, position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => {
              console.log('Search input focused');
              setShowSearchDropdown(true);
            }}
            onBlur={() => {
              console.log('Search input blurred');
              setTimeout(() => setShowSearchDropdown(false), 150);
            }}
            onKeyPress={(e) => {
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
              backgroundColor: '#1a2540',
              border: 'none',
              borderRadius: '20px',
              color: '#a0aec0',
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
                backgroundColor: '#1a2540',
                border: '1px solid #2d3748',
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
          {/* Theme Toggle */}
          <button
            onClick={() => setTempUnit(tempUnit === 0 ? 1 : 0)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
            }}
          >
            ☀️
          </button>
          {/* Profile */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#c48a62', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer' }}>👤</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '32px', display: 'flex', gap: '48px' }}>
        {/* Left Side - Main Weather Card */}
        <div style={{ flex: '0 0 320px' }}>
          {/* Main Weather Card with Light Background */}
          {displayedWeather && (expandedGeoCard || displayedWeather.name !== geoWeatherData?.name) && (
            <div style={{ backgroundColor: '#a8c9e8', borderRadius: '20px', padding: '24px', marginBottom: '24px', color: '#0a0f1f' }}>
              {/* Location and Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0a0f1f' }}>
                    {displayedWeather?.name || 'Location'}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#0a0f1f' }}>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Large Temperature and Icon */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '64px', fontWeight: 'bold', lineHeight: '1', color: '#0a0f1f' }}>
                  {convertTemperature(displayedWeather.main.temp).toFixed(0)}°{getTempUnit()}
                </div>
                <img
                  src={getWeatherIcon(displayedWeather.weather[0].icon)}
                  alt={displayedWeather.weather[0].description}
                  style={{ width: '100px', height: '100px' }}
                />
              </div>

              {/* Weather Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#0a0f1f', fontSize: '11px', marginBottom: '4px' }}>Real Feel</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0a0f1f' }}>
                    {convertTemperature(displayedWeather.main.feels_like).toFixed(0)}°{getTempUnit()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#0a0f1f', fontSize: '11px', marginBottom: '4px' }}>Wind</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0a0f1f' }}>
                    {displayedWeather.wind.speed} m/s
                  </div>
                </div>
                <div>
                  <div style={{ color: '#0a0f1f', fontSize: '11px', marginBottom: '4px' }}>Pressure</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0a0f1f' }}>
                    {displayedWeather.main.pressure}MB
                  </div>
                </div>
                <div>
                  <div style={{ color: '#0a0f1f', fontSize: '11px', marginBottom: '4px' }}>Humidity</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0a0f1f' }}>
                    {displayedWeather.main.humidity}%
                  </div>
                </div>
              </div>

              {/* Sunrise/Sunset */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', fontSize: '12px' }}>
                <div>
                  <div style={{ color: '#0a0f1f', marginBottom: '4px' }}>Sunrise</div>
                  <div style={{ fontWeight: 'bold', color: '#0a0f1f' }}>{formatSunriseSetTime(displayedWeather.sys.sunrise)}</div>
                </div>
                <div>
                  <div style={{ color: '#0a0f1f', marginBottom: '4px' }}>Sunset</div>
                  <div style={{ fontWeight: 'bold', color: '#0a0f1f' }}>{formatSunriseSetTime(displayedWeather.sys.sunset)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Forecast and Rain Chart */}
        <div style={{ flex: 1 }}>
          {/* Forecast Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end' }}>
            <button style={{ backgroundColor: '#a8c9e8', color: '#0a0f1f', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              Forecast
            </button>
          </div>

          {/* 7-Day Forecast Grid (8 columns) */}
          {displayedForecast && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px' }}>
              {getDailyForecast(displayedForecast).map((day, index) => {
                const date = new Date(day.dt_txt);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#1a2540',
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center',
                      border: index === 0 ? '2px solid #a8c9e8' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '6px', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                      {dayName}
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
            <div style={{ marginTop: '32px', backgroundColor: '#1a2540', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', color: '#ffffff' }}>Hourly precipitation</div>
              
              {/* Bar Chart - Real Data */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '140px', gap: '6px', marginBottom: '16px' }}>
                {displayedForecast.list.slice(0, 8).map((item, idx) => {
                  const cloudCover = item.clouds.all;
                  const isRainy = item.weather.some(w => ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.main));
                  const rainChance = isRainy ? Math.min(100, cloudCover + 30) : cloudCover;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: rainChance > 70 ? '#6ba3ff' : '#4a90e2',
                        borderRadius: '4px',
                        flex: 1,
                        height: `${Math.max(10, rainChance)}%`,
                        minHeight: '10px',
                        transition: 'all 0.3s ease',
                      }}
                      title={`${rainChance}% chance`}
                    />
                  );
                })}
              </div>

              {/* Time Labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', fontSize: '9px', color: '#718096', textAlign: 'center' }}>
                {displayedForecast.list.slice(0, 8).map((item, idx) => {
                  const time = new Date(item.dt_txt);
                  return (
                    <div key={idx}>
                      {time.getHours().toString().padStart(2, '0')}:00
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '12px', color: '#a0aec0' }}>
                <div>💧 Based on cloud cover & weather</div>
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
              backgroundColor: '#1a2540',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              border: expandedGeoCard ? '2px solid #a8c9e8' : '1px solid #1a2540',
              transition: 'all 0.3s ease',
              maxWidth: '300px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#a0aec0' }}>
              Your Location
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#ffffff' }}>
              {geoWeatherData.name}, {geoWeatherData.sys.country}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#a8c9e8', marginBottom: '8px' }}>
              {convertTemperature(geoWeatherData.main.temp).toFixed(0)}°{getTempUnit()}
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
