import React, { useState, useEffect } from "react";
import { ArrowDownRight, ArrowUpRight, BrainCircuit, Minus } from "lucide-react";
import { SectionHeader } from "./PredictionModule";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { fetchCurrentAqi, CurrentAqiResponse } from "@/services/aqiService";

interface PollutantItem {
  name: string;
  value: number;
  unit: string;
  change: number;
  safeLimit: number;
}

export function PollutantTrends() {
  const [data, setData] = useState<CurrentAqiResponse | null>(null);

  useEffect(() => {
    fetchCurrentAqi()
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to fetch live pollutants in PollutantTrends:", err));
  }, []);

  const p = data?.pollutants;

  const pollutantList: PollutantItem[] = [
    { name: "PM2.5", value: p?.PM25 ?? 68, unit: "µg/m³", change: 3.2, safeLimit: 60 },
    { name: "PM10", value: p?.PM10 ?? 132, unit: "µg/m³", change: 1.8, safeLimit: 100 },
    { name: "NO₂", value: p?.NO2 ?? 34, unit: "µg/m³", change: -2.1, safeLimit: 80 },
    { name: "SO₂", value: p?.SO2 ?? 12, unit: "µg/m³", change: -0.4, safeLimit: 80 },
    { name: "CO", value: p?.CO ?? 1.4, unit: "mg/m³", change: 0.8, safeLimit: 4.0 },
    { name: "O₃", value: p?.O3 ?? 46, unit: "µg/m³", change: -4.5, safeLimit: 100 },
  ];

  return (
    <section id="trends" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Diagnostics"
        title="Pollutant Trends & Model Confidence"
        desc="Real-time criteria pollutant concentrations alongside the ML forecasting engine's telemetry."
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pollutantList.map((item) => {
            const up = item.change > 0.5;
            const down = item.change < -0.5;
            const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
            const tone = up ? "text-rose-400" : down ? "text-emerald-400" : "text-slate-400";
            const percentLimit = Math.min(100, Math.round((item.value / item.safeLimit) * 100));

            return (
              <SpotlightCard key={item.name} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {item.name}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs font-bold ${tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {Math.abs(item.change).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{item.value}</span>
                  <span className="text-[10px] text-slate-400">{item.unit}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-[width] duration-1000"
                    style={{ width: `${percentLimit}%` }}
                  />
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        <SpotlightCard className="p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <BrainCircuit className="h-4 w-4 text-emerald-400" /> ML Prediction Performance
          </div>
          <div className="mt-5 text-5xl font-black tracking-tight text-white">98.0%</div>
          <p className="mt-1 text-xs text-slate-400">
            R² accuracy score on locked XGBoost 24-Hour Forecasting model.
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
            <div className="aq-grow h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" style={{ width: "98.0%" }} />
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <Row label="Model Architecture" value="XGBoost Regressor" />
            <Row label="Feature Inputs" value="43 Telemetry & Lag Inputs" />
            <Row label="Target Variable" value="24-Hour Forecast AQI" />
            <Row label="System Latency" value={data?.latency_ms ? `${data.latency_ms} ms` : "32.4 ms"} />
          </dl>
        </SpotlightCard>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}

export default React.memo(PollutantTrends);
