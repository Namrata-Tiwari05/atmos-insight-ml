import { fetchApi } from "./api";

export interface CurrentAqiResponse {
  timestamp: string;
  location: string;
  current_aqi: number;
  category: string;
  dominant_pollutant: string;
  health_advisory: {
    general_recommendation: string;
    sensitive_groups: string;
    mask_required: boolean;
    outdoor_activity: string;
  };
  model_used: string;
  weather: {
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
  };
  pollutants: {
    PM25: number;
    PM10: number;
    NO2: number;
    SO2: number;
    CO: number;
    O3: number;
  };
  latency_ms: number;
}

export async function fetchCurrentAqi(lat?: number, lon?: number, city?: string): Promise<CurrentAqiResponse> {
  const params = new URLSearchParams();
  if (lat !== undefined && lon !== undefined) {
    params.append("lat", lat.toString());
    params.append("lon", lon.toString());
  }
  if (city) params.append("city", city);

  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchApi<CurrentAqiResponse>(`/current-aqi/${query}`);
}
