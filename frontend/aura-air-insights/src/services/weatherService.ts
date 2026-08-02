import { fetchApi } from "./api";

export interface WeatherResponse {
  temperature: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  visibility: number;
  uv_index: number;
  description: string;
  condition: string;
  sunrise: string;
  sunset: string;
}

export async function fetchLiveWeather(lat?: number, lon?: number): Promise<WeatherResponse> {
  const params = new URLSearchParams();
  if (lat !== undefined && lon !== undefined) {
    params.append("lat", lat.toString());
    params.append("lon", lon.toString());
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchApi<WeatherResponse>(`/weather/${query}`);
}
