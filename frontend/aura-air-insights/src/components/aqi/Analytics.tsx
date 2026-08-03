import React, { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrainCircuit, Sparkles, AlertCircle } from "lucide-react";
import { ChartTooltip } from "./ChartTooltip";
import { SectionHeader } from "./PredictionModule";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { getAqiInfo } from "./aqi-utils";
import {
  fetchAnalyticsData,
  AnalyticsResponse,
  CorrelationMatrix,
  SeasonalAqiItem,
  ShapExplainability,
} from "@/services/analyticsService";
import { API_BASE_URL } from "@/services/api";

const BACKEND_URL = API_BASE_URL.replace("/api", "");

const pollutantColors: Record<string, string> = {
  "PM2.5": "#10b981",
  "PM10": "#0ea5e9",
  "NO2": "#f59e0b",
  "NO₂": "#f59e0b",
  "SO2": "#8b5cf6",
  "SO₂": "#8b5cf6",
  "CO": "#ef4444",
  "O3": "#14b8a6",
  "O₃": "#14b8a6",
};

const matrixLabels = ["AQI", "PM2.5", "PM10", "NO2", "SO2", "CO", "O3"];

function getHeatmapColor(r: number): string {
  if (r === 1.0) return "rgba(14, 165, 233, 0.35)";
  if (r >= 0.7) return "rgba(239, 68, 68, 0.85)";
  if (r >= 0.4) return "rgba(249, 115, 22, 0.8)";
  if (r >= 0.2) return "rgba(234, 179, 8, 0.75)";
  if (r >= 0.0) return "rgba(34, 197, 94, 0.65)";
  if (r >= -0.2) return "rgba(14, 165, 233, 0.55)";
  return "rgba(59, 130, 246, 0.75)";
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData()
      .then((res) => {
        if (res) {
          setData(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("ANALYTICS FRONTEND FETCH ERROR:", err);
        setError("Failed to load analytics data from backend API.");
        setLoading(false);
      });
  }, []);

  const pollutantChartData = data?.live_pollutants?.map((item) => {
    let displayName = item.name;
    if (item.name === "NO2") displayName = "NO₂";
    if (item.name === "SO2") displayName = "SO₂";
    if (item.name === "O3") displayName = "O₃";
    return {
      name: displayName,
      value: item.value,
    };
  }) || [];

  const correlationMatrix: CorrelationMatrix | undefined = data?.correlation_matrix;
  const seasonalAqiData: SeasonalAqiItem[] = data?.seasonal_aqi || [];
  const shapData: ShapExplainability | undefined | null = data?.shap_explainability;

  return (
    <section id="analytics" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Module 04"
        title="Analytics Dashboard"
        desc="Deep insights into criteria pollutant distribution, correlation matrices, seasonal AQI patterns, and SHAP model explainability."
      />

      {loading && (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></span>
            Loading real analytics from backend...
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-6 text-center text-sm font-semibold text-rose-400">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Row 1: Current Pollutant Concentrations & Season-wise AQI Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current Pollutant Concentrations */}
            <SpotlightCard className="p-6">
              <h3 className="text-base font-semibold text-white">Current Pollutant Concentrations</h3>
              <p className="mt-1 text-xs text-slate-400">Live criteria pollutant telemetry from FastAPI backend</p>
              <div className="mt-6 h-64 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pollutantChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip unit="" />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {pollutantChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pollutantColors[entry.name] || "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>

            {/* Season-wise AQI Distribution */}
            <SpotlightCard className="p-6">
              <h3 className="text-base font-semibold text-white">Season-wise AQI Distribution</h3>
              <p className="mt-1 text-xs text-slate-400">Average historical AQI across different seasons in Kanpur.</p>
              <div className="mt-6 h-64 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalAqiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="season" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 450]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as SeasonalAqiItem;
                          const info = getAqiInfo(item.average_aqi);
                          return (
                            <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                              <div className="text-xs font-bold text-slate-400">{item.season} Season</div>
                              <div className="mt-1 text-base font-black text-white">{item.average_aqi} AQI</div>
                              <div
                                className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold text-slate-950"
                                style={{ backgroundColor: info.hex }}
                              >
                                {info.category}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="average_aqi" radius={[6, 6, 0, 0]}>
                      {seasonalAqiData.map((entry, index) => {
                        const info = getAqiInfo(entry.average_aqi);
                        return <Cell key={`season-cell-${index}`} fill={info.hex} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          </div>

          {/* Correlation Heatmap */}
          {correlationMatrix && (
            <SpotlightCard className="mt-6 p-6">
              <h3 className="text-base font-semibold text-white">Correlation Heatmap</h3>
              <p className="mt-1 text-xs text-slate-400">
                Relationship between major pollutants and AQI based on the historical training dataset.
              </p>

              <div className="mt-6 overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Heatmap Header Row */}
                  <div className="grid grid-cols-8 gap-2 border-b border-slate-800/60 pb-2 text-center text-xs font-bold text-slate-400">
                    <div></div>
                    {matrixLabels.map((lbl) => (
                      <div key={`col-hdr-${lbl}`} className="uppercase tracking-wider">
                        {lbl}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Grid Rows */}
                  {matrixLabels.map((rowLabel) => (
                    <div key={`row-${rowLabel}`} className="grid grid-cols-8 gap-2 items-center py-1">
                      <div className="text-[11px] font-bold text-slate-300 text-right pr-2 uppercase">
                        {rowLabel}
                      </div>
                      {matrixLabels.map((colLabel) => {
                        const val = correlationMatrix[colLabel]?.[rowLabel];
                        if (val === undefined) return null;
                        const bg = getHeatmapColor(val);

                        return (
                          <div
                            key={`cell-${rowLabel}-${colLabel}`}
                            className="group relative flex h-11 items-center justify-center rounded-lg border border-slate-800/80 font-mono text-xs font-bold text-white transition-all hover:scale-105 hover:border-sky-400 hover:shadow-lg cursor-pointer"
                            style={{ backgroundColor: bg }}
                          >
                            <span>{val.toFixed(2)}</span>
                            {/* Cell Hover Tooltip */}
                            <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
                              <div className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xl backdrop-blur-md">
                                <span className="text-sky-400">{rowLabel}</span> vs <span className="text-sky-400">{colLabel}</span>: <span className="font-mono text-emerald-400">{val.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 text-[11px] font-semibold text-slate-400">
                <span className="text-slate-500">Correlation (r):</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-blue-600/80"></span> Negative (&lt;0)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-emerald-500/70"></span> Low (0.0 – 0.3)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-amber-500/80"></span> Moderate (0.3 – 0.6)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-red-500/85"></span> Strong (&gt;0.6)
                </div>
              </div>
            </SpotlightCard>
          )}

          {/* Model Explainability (SHAP) Card */}
          <SpotlightCard className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Model Explainability (SHAP)</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-3 w-3" /> 24-Hour Locked Model
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-400 max-w-3xl">
              {shapData?.explanation || "The SHAP summary plot explains how each pollutant contributes to AQI predictions. Higher SHAP values indicate a stronger influence on the model output."}
            </p>

            {shapData ? (
              <div className="mt-6 space-y-6">
                {/* Plots Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* SHAP Summary Plot */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      SHAP Summary Plot
                    </h4>
                    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60 p-2 flex items-center justify-center min-h-[220px]">
                      <img
                        src="/shap/shap_summary_plot.png"
                        alt="SHAP Summary Plot"
                        className="max-h-72 w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                        onError={(e) => {
                         (e.target as HTMLImageElement).src =
                                   `${BACKEND_URL}/static/shap/shap_summary_plot.png`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Feature Importance Bar Chart */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      Feature Importance Bar Chart
                    </h4>
                    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60 p-2 flex items-center justify-center min-h-[220px]">
                      <img
                        src="/shap/global_feature_importance.png"
                        alt="Global Feature Importance"
                        className="max-h-72 w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                                    `${BACKEND_URL}/static/shap/global_feature_importance.png`;
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Top 5 Most Important Features List */}
                {shapData.top_features && shapData.top_features.length > 0 && (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                      Top 5 Most Important Features (mean |SHAP value|)
                    </h4>
                    <div className="space-y-3">
                      {shapData.top_features.map((feat, idx) => {
                        const pct = Math.min(100, Math.round(feat.percentage));
                        return (
                          <div key={feat.feature} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-sky-400">
                                  {idx + 1}
                                </span>
                                {feat.feature}
                              </span>
                              <span className="font-mono text-slate-400">
                                {feat.description} <span className="font-bold text-emerald-400 ml-2">({feat.percentage}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400"
                                style={{ width: `${Math.max(2, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs font-semibold text-slate-400">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                SHAP artifacts not available.
              </div>
            )}
          </SpotlightCard>
        </>
      )}
    </section>
  );
}

export default React.memo(Analytics);