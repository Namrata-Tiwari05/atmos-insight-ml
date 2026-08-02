import { fetchApi } from "./api";

export interface PredictPayload {
  PM25: number;
  PM10: number;
  NO2: number;
  SO2: number;
  CO: number;
  O3: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
}

export interface PredictionResult {
  predicted_aqi: number;
  category: string;
  dominant_pollutant: string;
  health_advisory: {
    general_recommendation: string;
    sensitive_groups: string;
    mask_required: boolean;
    outdoor_activity: string;
  };
  model_used: string;
}

export async function runAqiPrediction(payload: PredictPayload): Promise<PredictionResult> {
  return fetchApi<PredictionResult>("/predict-aqi", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
