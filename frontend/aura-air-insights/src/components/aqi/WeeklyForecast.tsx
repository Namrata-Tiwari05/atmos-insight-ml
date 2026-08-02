import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShieldCheck, Info } from "lucide-react";
import { SectionHeader } from "./PredictionModule";
import { getAqiInfo } from "./aqi-utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { DailyForecastStep } from "@/services/forecastService";

interface WeeklyForecastProps {
  data?: DailyForecastStep[] | null;
}

export function WeeklyForecast({ data }: WeeklyForecastProps) {
  if (!data || data.length === 0) {
    return (
      <section id="weekly" className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-slate-800" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-900/80 border border-slate-800" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const chartData = useMemo(() => {
    return data.map((d) => {
      const info = getAqiInfo(d.predicted_aqi);
      return {
        day: d.day_name.slice(0, 3),
        date: d.date,
        aqi: d.predicted_aqi,
        category: d.category || info.category,
      };
    });
  }, [data]);

  return (
    <section id="weekly" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Module 03"
        title="7-Day AQI Forecast"
        desc="A week-ahead outlook powered by our retrained XGBoost 7-day daily forecasting model."
      />

      {/* Scientific Disclaimer */}
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs text-slate-400">
        <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
        <span>
          Predictions are generated using a machine learning model trained on historical AQI and meteorological trends. Forecast uncertainty naturally increases over longer prediction horizons.
        </span>
      </div>

      {/* 7 Daily Forecast Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {data.map((step) => {
          const info = getAqiInfo(step.predicted_aqi);
          const categoryDisplay = step.category && step.category !== "-" ? step.category : info.category;

          return (
            <SpotlightCard
              key={step.date}
              className="p-4 bg-slate-900/60 border-slate-800/80 transition-all hover:-translate-y-1 hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white">
                  {step.day_name.slice(0, 3)}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {step.date.slice(5)}
                </span>
              </div>

              <div className="mt-3 text-3xl font-black text-white">
                {step.predicted_aqi}
              </div>

              <div
                className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold text-slate-950 shadow-sm"
                style={{ backgroundColor: info.hex }}
              >
                {categoryDisplay}
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Weekly AQI Line Chart & Model Confidence Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SpotlightCard className="lg:col-span-2 p-4 sm:p-6 bg-slate-900/60 border-slate-800/80">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            7-Day Trajectory Trend
          </h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="color7dSimple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 500]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const info = getAqiInfo(d.aqi);
                      return (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                          <div className="text-xs font-bold text-slate-400">{d.day} ({d.date})</div>
                          <div className="mt-1 text-base font-black text-white">AQI: {d.aqi}</div>
                          <div className="text-xs font-semibold" style={{ color: info.hex }}>{d.category}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#color7dSimple)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        {/* Model Confidence & Validation Metrics Card */}
        <SpotlightCard className="p-4 sm:p-6 bg-slate-900/60 border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              Model Confidence
            </div>
            <div className="mt-2 text-xl font-black text-white">
              Moderate Confidence
            </div>
            <div className="mt-1 text-xs font-mono text-emerald-400">
              Prediction Margin of Error: ±40.8 AQI
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Validated on 4,178 historical daily observations using 80/20 chronological time-series cross-validation.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="rounded-lg bg-slate-950/60 p-2">
              <div className="text-[10px] text-slate-400">R² Score</div>
              <div className="text-xs font-bold text-sky-400">0.43</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-2">
              <div className="text-[10px] text-slate-400">MAE</div>
              <div className="text-xs font-bold text-emerald-400">30.8</div>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-2">
              <div className="text-[10px] text-slate-400">RMSE</div>
              <div className="text-xs font-bold text-amber-400">40.8</div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}

export default React.memo(WeeklyForecast);