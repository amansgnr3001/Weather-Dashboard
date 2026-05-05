# 🌤️ Weather Dashboard

A responsive weather forecasting dashboard built with **Next.js 16**, **React 19**, and **TypeScript**. Search any city to get real-time weather data and a 5-day forecast powered by the OpenWeatherMap API.

🌍 **Live Demo:** [View on Vercel](https://weather-forcasting-pmrjlcrch-amansgnr3001s-projects.vercel.app/)

---

## ✨ Features

- 🔍 **City Search** — Search any city with instant results and friendly error messages
- 🌡️ **Current Weather** — Temperature, feels like, wind, pressure, humidity, sunrise & sunset
- 📅 **5-Day Forecast** — Daily forecast cards with weather emoji icons
- 📊 **Hourly Precipitation Chart** — SVG line chart for the next 8 hours
- 📍 **Geolocation** — Auto-detects and displays your current location's weather on load
- 🕐 **Search History** — Saves your last 3 searches in localStorage for quick access
- 🌡️ **°C / °F Toggle** — Switch temperature units globally with one click
- 🌙 **Dark / Light Theme** — Persistent theme preference saved to localStorage
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop

---

## 🛠️ Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [OpenWeatherMap API](https://openweathermap.org/api)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later — [Download here](https://nodejs.org/)
- A free **OpenWeatherMap API key** — [Get one here](https://home.openweathermap.org/api_keys) (free tier, no credit card required)

---

### 1. Clone the Repository

```bash
git clone https://github.com/amansgnr3001/Weather-Dashboard.git
cd Weather-Dashboard
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Set Up Environment Variables

Create a file named `.env.local` in the root of the project:

```bash
# Windows (PowerShell)
New-Item .env.local

# macOS / Linux
touch .env.local
```

Open `.env.local` and add your API key:

```env
NEXT_PUBLIC_WEATHER_API_KEY=your_api_key_here
```

> **How to get an API key:**
> 1. Go to [openweathermap.org](https://openweathermap.org/) and create a free account
> 2. Navigate to **My API Keys** in your account dashboard
> 3. Copy your default key (or generate a new one)
> 4. Paste it in place of `your_api_key_here`
>
> ⚠️ New keys can take up to 10 minutes to activate after creation.

---

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Weather-Dashboard/
├── app/
│   ├── components/
│   │   ├── CityWeather.tsx     # Pure display component for weather card
│   │   ├── SearchBar.tsx       # Search input with API logic & dropdown
│   │   └── RecentSearches.tsx  # Recent search history list
│   ├── globals.css             # Global styles + responsive layout
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main page — state management & orchestration
│   └── types.ts                # Shared TypeScript interfaces
├── public/                     # Static assets
├── .env.local                  # API key (not committed to git)
├── next.config.ts
└── package.json
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server at `localhost:3000` |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server (requires `build` first) |
| `npm run lint` | Run ESLint to check code quality |

---

## 🌐 API Reference

This project uses the [OpenWeatherMap API](https://openweathermap.org/api) (free tier):

| Endpoint | Used For |
|----------|----------|
| `/data/2.5/weather` | Current weather by city name or coordinates |
| `/data/2.5/forecast` | 5-day / 3-hour forecast |

The free tier allows **1,000 API calls/day**, which is more than enough for development and personal use.

---

## 🔒 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WEATHER_API_KEY` | ✅ Yes | Your OpenWeatherMap API key |

> `.env.local` is listed in `.gitignore` and will **never** be committed to version control.

---

## 📄 License

MIT — feel free to use and modify this project.
