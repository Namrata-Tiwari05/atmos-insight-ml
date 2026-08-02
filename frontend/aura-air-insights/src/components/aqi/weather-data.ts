export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "foggy" | "stormy";

export interface KanpurWeather {
  condition: WeatherCondition;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  pressure: number;
  uv: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

export const KANPUR_WEATHER: Record<WeatherCondition, KanpurWeather> = {
  sunny: { condition: "sunny", temp: 34, feelsLike: 37, humidity: 38, windSpeed: 11, windDeg: 118, pressure: 1008, uv: 8, visibility: 9.4, sunrise: "05:28", sunset: "18:52" },
  cloudy: { condition: "cloudy", temp: 30, feelsLike: 32, humidity: 58, windSpeed: 14, windDeg: 205, pressure: 1010, uv: 4, visibility: 7.2, sunrise: "05:28", sunset: "18:52" },
  rainy: { condition: "rainy", temp: 27, feelsLike: 29, humidity: 82, windSpeed: 18, windDeg: 240, pressure: 1004, uv: 2, visibility: 4.6, sunrise: "05:28", sunset: "18:52" },
  foggy: { condition: "foggy", temp: 18, feelsLike: 16, humidity: 91, windSpeed: 5, windDeg: 300, pressure: 1015, uv: 1, visibility: 1.1, sunrise: "06:12", sunset: "17:40" },
  stormy: { condition: "stormy", temp: 25, feelsLike: 27, humidity: 88, windSpeed: 32, windDeg: 265, pressure: 998, uv: 1, visibility: 3.2, sunrise: "05:28", sunset: "18:52" },
};

export const CONDITION_LABEL: Record<WeatherCondition, string> = {
  sunny: "Clear & Sunny",
  cloudy: "Cloudy",
  rainy: "Light Rain",
  foggy: "Dense Fog",
  stormy: "Thunderstorm",
};

export function windDirection(deg: number) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Kanpur wards / localities with simulated pollution density
export interface Ward {
  name: string;
  x: number; // 0-100 relative position on the city plate
  y: number;
  factor: number; // multiplier of city AQI
}

export const KANPUR_WARDS: Ward[] = [
  { name: "Panki Industrial", x: 16, y: 34, factor: 1.34 },
  { name: "Kalyanpur", x: 30, y: 20, factor: 1.05 },
  { name: "Vikas Nagar", x: 44, y: 16, factor: 0.94 },
  { name: "Rawatpur", x: 40, y: 36, factor: 1.12 },
  { name: "IIT Kanpur", x: 15, y: 62, factor: 0.72 },
  { name: "Civil Lines", x: 58, y: 32, factor: 0.98 },
  { name: "Mall Road", x: 64, y: 46, factor: 1.16 },
  { name: "Kidwai Nagar", x: 52, y: 66, factor: 1.02 },
  { name: "Govind Nagar", x: 38, y: 74, factor: 1.09 },
  { name: "Jajmau Tannery", x: 84, y: 58, factor: 1.42 },
  { name: "Nawabganj", x: 26, y: 50, factor: 0.88 },
  { name: "Chakeri", x: 78, y: 78, factor: 1.21 },
];
