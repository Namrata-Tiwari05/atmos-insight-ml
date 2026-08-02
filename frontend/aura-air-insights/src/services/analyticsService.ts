import { fetchApi } from "./api";

export interface PollutantItem {
  name: string;
  value: number;
  unit: string;
}

export interface SeasonalAqiItem {
  season: string;
  average_aqi: number;
}

export interface TopFeatureItem {
  feature: string;
  importance_score: number;
  description: string;
}

export interface ShapExplainability {
  summary_plot_url: string;
  feature_importance_plot_url?: string;
  explanation: string;
  top_features?: TopFeatureItem[];
}

export type CorrelationMatrix = Record<string, Record<string, number>>;

export interface AnalyticsResponse {
  live_pollutants: PollutantItem[];
  seasonal_aqi: SeasonalAqiItem[];
  correlation_matrix: CorrelationMatrix;
  shap_explainability?: ShapExplainability | null;
  latency_ms?: number;
}

export async function fetchAnalyticsData(): Promise<AnalyticsResponse> {
  return fetchApi<AnalyticsResponse>("/analytics/");
}
