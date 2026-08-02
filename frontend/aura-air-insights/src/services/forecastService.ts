import { fetchApi } from "./api";

export interface HourlyForecastStep {
  hour: string;
  predicted_aqi: number;
  category: string;
}

export interface HourlyForecastResponse {
  timestamp: string;
  location: string;
  baseline_aqi: number;
  forecast: HourlyForecastStep[];
  model_used: string;
  latency_ms: number;
}

export interface DailyForecastStep {
  date: string;
  day_name: string;
  predicted_aqi: number;
  category: string;
  dominant_pollutant: string;
  health_recommendation: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  weather_icon: string;
}

export interface DailyForecastResponse {
  generated_at: string;
  location: string;
  current_aqi: number;
  forecast: DailyForecastStep[];
  latency_ms?: number;
}

export async function fetch24HourForecast(lat?: number, lon?: number, city?: string): Promise<HourlyForecastResponse> {
  const params = new URLSearchParams();
  if (lat !== undefined && lon !== undefined) {
    params.append("lat", lat.toString());
    params.append("lon", lon.toString());
  }
  if (city) params.append("city", city);

  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchApi<HourlyForecastResponse>(`/forecast/24-hour${query}`);
}

export async function fetch7DayForecast(lat?: number, lon?: number, city?: string): Promise<DailyForecastResponse> {
  const params = new URLSearchParams();
  if (lat !== undefined && lon !== undefined) {
    params.append("lat", lat.toString());
    params.append("lon", lon.toString());
  }
  if (city) params.append("city", city);

  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchApi<DailyForecastResponse>(`/forecast/7-day${query}`);
}
