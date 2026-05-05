export interface WeatherData {
  coord: { lon: number; lat: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: { speed: number; deg: number };
  clouds: { all: number };
  sys: { country: string; sunrise: number; sunset: number };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  wind: { speed: number; deg: number };
  clouds: { all: number };
  dt_txt: string;
}

export interface ForecastData {
  list: ForecastItem[];
  city: { name: string; country: string };
}

export interface Theme {
  bg: string;
  bgSecondary: string;
  cardBg: string;
  cardBgLight: string;
  textPrimary: string;
  textSecondary: string;
  textDark: string;
  border: string;
  accent: string;
}
