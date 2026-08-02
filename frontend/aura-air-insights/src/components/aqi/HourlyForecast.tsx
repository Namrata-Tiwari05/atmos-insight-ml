import React, { useState, useEffect, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react";
import { ChartTooltip } from "./ChartTooltip";
import { SectionHeader } from "./PredictionModule";
import { getAqiInfo } from "./aqi-utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { fetch24HourForecast, HourlyForecastStep } from "@/services/forecastService";

export function HourlyForecast({
  forecastData,
}: {
  forecastData?: HourlyForecastStep[] | null;
}) {
  const [steps, setSteps] = useState<HourlyForecastStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (forecastData && forecastData.length > 0) {
      setSteps(forecastData);
    } else {
      setLoading(true);
      fetch24HourForecast()
        .then((res) => {
          if (res?.forecast) {
            setSteps(res.forecast);
          }
        })
        .catch((err) => console.error("Failed to fetch 24-hour forecast from backend:", err))
        .finally(() => setLoading(false));
    }
  }, [forecastData]);

  const chartItems = useMemo(() => {
    return steps.map((s) => ({
      time: s.hour,
      aqi: s.predicted_aqi,
      category: s.category,
    }));
  }, [steps]);

  const high = useMemo(() => {
    return chartItems.length > 0 ? Math.max(...chartItems.map((d) => d.aqi)) : 0;
  }, [chartItems]);

  const low = useMemo(() => {
    return chartItems.length > 0 ? Math.min(...chartItems.map((d) => d.aqi)) : 0;
  }, [chartItems]);

  const avg = useMemo(() => {
    if (chartItems.length === 0) return 0;
    return Math.round(chartItems.reduce((s, d) => s + d.aqi, 0) / chartItems.length);
  }, [chartItems]);

  return (
    <section id="hourly" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Module 02"
        title="24 Hour AQI Forecast"
        desc="Hourly AQI predictions generated recursively by FastAPI XGBoost model for the next 24 hours."
      />
      <SpotlightCard className="p-4 sm:p-6 border border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        {loading && chartItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" />
            <div className="mt-3 text-sm font-semibold">Fetching Live XGBoost 24-Hour Forecast...</div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Highest AQI" value={high} icon={<TrendingUp className="h-4 w-4" />} />
              <StatCard label="Lowest AQI" value={low} icon={<TrendingDown className="h-4 w-4" />} />
              <StatCard label="Average AQI" value={avg} icon={<Activity className="h-4 w-4" />} />
            </div>
            
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartItems} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E293B" strokeOpacity={0.8} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ stroke: "#10B981", strokeOpacity: 0.5, strokeWidth: 2 }}
                    content={<ChartTooltip />}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#hourGrad)"
                    activeDot={{ r: 6, strokeWidth: 3, stroke: "#0A1628", fill: "#10B981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </SpotlightCard>
    </section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const info = getAqiInfo(value);
  return (
    <div className="inner-pill flex items-center justify-between rounded-2xl px-4 py-3 border border-slate-800/80 bg-slate-900/60">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-2xl font-black text-white">{value}</span>
          <span className="text-[11px] font-semibold" style={{ color: info.hex }}>
            {info.category}
          </span>
        </div>
      </div>
      <span
        className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm"
        style={{ backgroundColor: info.hex }}
      >
        {icon}
      </span>
    </div>
  );
}