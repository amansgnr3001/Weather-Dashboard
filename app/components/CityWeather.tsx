'use client';

import { WeatherData, ForecastData, Theme } from '../types';

interface CityWeatherProps {
  weatherData: WeatherData;
  forecastData: ForecastData | null;
  tempUnit: number;
  theme: Theme;
  convertTemperature: (celsius: number) => number;
  getTempUnit: () => string;
  getWeatherEmoji: (iconCode: string) => string;
  formatSunriseSetTime: (unix: number) => string;
}

export default function CityWeather({
  weatherData,
  forecastData,
  tempUnit,
  theme,
  convertTemperature,
  getTempUnit,
  getWeatherEmoji,
  formatSunriseSetTime,
}: CityWeatherProps) {
  const getDailyForecast = () => {
    if (!forecastData) return [];
    const daily: Record<string, typeof forecastData.list[0]> = {};
    forecastData.list.forEach((item) => {
      const date = new Date(item.dt_txt).toLocaleDateString();
      if (!daily[date]) daily[date] = item;
    });
    return Object.values(daily).slice(0, 5);
  };

  return (
    <div
      style={{
        backgroundColor: theme.cardBgLight,
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        color: theme.textDark,
      }}
    >
      {/* Header: Location + Description + Time */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.textDark }}>
          {weatherData.name}, {weatherData.sys.country}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: theme.textDark,
              textTransform: 'capitalize',
              marginBottom: '3px',
            }}
          >
            {weatherData.weather[0].description}
          </div>
          <div style={{ fontSize: '12px', color: theme.textDark, opacity: 0.6 }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Temperature + Emoji */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '64px', fontWeight: 'bold', lineHeight: '1', color: theme.textDark }}>
          {convertTemperature(weatherData.main.temp).toFixed(0)}°{getTempUnit()}
        </div>
        <span style={{ fontSize: '80px', lineHeight: '1', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
          {getWeatherEmoji(weatherData.weather[0].icon)}
        </span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
        {[
          { label: 'Real Feel', value: `${convertTemperature(weatherData.main.feels_like).toFixed(0)}°${getTempUnit()}` },
          { label: 'Wind', value: `${weatherData.wind.speed} m/s` },
          { label: 'Pressure', value: `${weatherData.main.pressure} MB` },
          { label: 'Humidity', value: `${weatherData.main.humidity}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ color: theme.textDark, fontSize: '11px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: theme.textDark }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sunrise / Sunset */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${theme.textDark}33`,
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '12px',
        }}
      >
        {[
          { label: 'Sunrise', time: weatherData.sys.sunrise },
          { label: 'Sunset', time: weatherData.sys.sunset },
        ].map(({ label, time }) => (
          <div key={label}>
            <div style={{ color: theme.textDark, marginBottom: '4px' }}>{label}</div>
            <div style={{ fontWeight: 'bold', color: theme.textDark }}>{formatSunriseSetTime(time)}</div>
          </div>
        ))}
      </div>

      {/* Mini 5-Day Forecast */}
      {forecastData && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.textDark}33` }}>
          <div style={{ fontSize: '11px', color: theme.textDark, opacity: 0.7, marginBottom: '10px', fontWeight: 'bold' }}>
            5-DAY FORECAST
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
            {getDailyForecast().map((day, i) => (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '10px', color: theme.textDark, opacity: 0.7, marginBottom: '4px' }}>
                  {new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '18px' }}>{getWeatherEmoji(day.weather[0].icon)}</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: theme.textDark }}>
                  {convertTemperature(day.main.temp).toFixed(0)}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
