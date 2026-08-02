import { fetchApi } from "./api";

export interface StationLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  zone: string;
  aqi: number;
  category: string;
  dominant_pollutant: string;
}

export interface HeatmapResponse {
  city: string;
  stations: StationLocation[];
}

export async function fetchHeatmapStations(city: string = "Kanpur"): Promise<HeatmapResponse> {
  return fetchApi<HeatmapResponse>(`/locations/stations?city=${encodeURIComponent(city)}`);
}
