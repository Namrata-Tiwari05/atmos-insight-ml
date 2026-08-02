import { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSun, Moon, Sun, Loader2 } from "lucide-react";
import { getAqiInfo } from "./aqi-utils";
import { fetch24HourForecast, HourlyForecastStep } from "@/services/forecastService";

const iconFor = (hourStr: any, aqi: number) => {
  const str = String(hourStr ?? "");
  const h = parseInt(str.split(":")[0], 10) || (typeof hourStr === "number" ? hourStr : 12);
  if (h < 6 || h >= 20) return Moon;
  if (aqi > 200) return Cloud;
  if (h % 7 === 0) return CloudRain;
  return h % 3 === 0 ? CloudSun : Sun;
};

export function AqiTimeline({
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
        .catch((err) => console.error("Failed to fetch 24-hour timeline from backend:", err))
        .finally(() => setLoading(false));
    }
  }, [forecastData]);

  if (loading && steps.length === 0) {
    return (
      <div className="glass-card mt-6 rounded-3xl p-6 text-center text-slate-400">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-400" />
        <div className="mt-2 text-xs font-semibold">Loading 24-Hour Backend Timeline...</div>
      </div>
    );
  }

  return (
    <div className="glass-card mt-6 rounded-3xl p-4 sm:p-6 border border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">24-Hour AQI & Weather Timeline</h3>
          <p className="text-[11px] text-slate-400">Single Source of Truth · FastAPI XGBoost Model</p>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          24 Records Live
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {steps.map((h, i) => {
          const aqiVal = h.predicted_aqi;
          const info = getAqiInfo(aqiVal);
          const Icon = iconFor(h.hour, aqiVal);
          const hourLabel = typeof h.hour === "number" ? `${String(h.hour).padStart(2, "0")}:00` : String(h.hour || `${i + 1}:00`);

          return (
            <div
              key={hourLabel + i}
              className="min-w-[80px] flex-1 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-3 py-3 text-center transition-all hover:-translate-y-1 hover:border-emerald-500/40"
            >
              <div className="text-[11px] font-mono font-semibold text-slate-400">
                {hourLabel}
              </div>
              <Icon className="mx-auto mt-2 h-5 w-5 text-emerald-400" strokeWidth={1.9} />
              <div className="mt-2 text-xs font-bold text-slate-300">
                {h.category}
              </div>
              <div
                className="mx-auto mt-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold text-slate-950 shadow-sm"
                style={{ backgroundColor: info.hex }}
              >
                {aqiVal}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
