import { useState, useEffect } from "react";
import { Sparkles, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAqiInfo } from "./aqi-utils";
import { AqiGauge } from "./AqiGauge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { runAqiPrediction, PredictionResult } from "@/services/predictionService";
import { fetchCurrentAqi, CurrentAqiResponse } from "@/services/aqiService";

interface FormFields {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

const fields: { key: keyof FormFields; label: string; unit: string; hint: string }[] = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", hint: "Fine particulates" },
  { key: "pm10", label: "PM10", unit: "µg/m³", hint: "Coarse particulates" },
  { key: "no2", label: "NO₂", unit: "µg/m³", hint: "Nitrogen dioxide" },
  { key: "so2", label: "SO₂", unit: "µg/m³", hint: "Sulfur dioxide" },
  { key: "co", label: "CO", unit: "mg/m³", hint: "Carbon monoxide" },
  { key: "o3", label: "O₃", unit: "µg/m³", hint: "Ozone" },
];

export function PredictionModule({
  initialData,
  onResult,
}: {
  initialData?: CurrentAqiResponse | null;
  onResult?: (aqi: number, dominant: string) => void;
}) {
  const [values, setValues] = useState<FormFields>({
    pm25: 0,
    pm10: 0,
    no2: 0,
    so2: 0,
    co: 0,
    o3: 0,
  });

  const [loading, setLoading] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Auto-fill live pollutant telemetry from backend on load
  useEffect(() => {
    if (initialData) {
      setValues({
        pm25: initialData.pollutants.PM25,
        pm10: initialData.pollutants.PM10,
        no2: initialData.pollutants.NO2,
        so2: initialData.pollutants.SO2,
        co: initialData.pollutants.CO,
        o3: initialData.pollutants.O3,
      });

      setPrediction({
        predicted_aqi: initialData.current_aqi,
        category: initialData.category,
        dominant_pollutant: initialData.dominant_pollutant,
        health_advisory: initialData.health_advisory,
        model_used: initialData.model_used,
      });
    } else {
      setFetchingLive(true);
      fetchCurrentAqi()
        .then((res) => {
          if (res?.pollutants) {
            setValues({
              pm25: res.pollutants.PM25,
              pm10: res.pollutants.PM10,
              no2: res.pollutants.NO2,
              so2: res.pollutants.SO2,
              co: res.pollutants.CO,
              o3: res.pollutants.O3,
            });

            setPrediction({
              predicted_aqi: res.current_aqi,
              category: res.category,
              dominant_pollutant: res.dominant_pollutant,
              health_advisory: res.health_advisory,
              model_used: res.model_used,
            });
          }
        })
        .catch((err) => setError("Failed to auto-fill live telemetry from backend."))
        .finally(() => setFetchingLive(false));
    }
  }, [initialData]);

  const predict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runAqiPrediction({
        PM25: values.pm25,
        PM10: values.pm10,
        NO2: values.no2,
        SO2: values.so2,
        CO: values.co,
        O3: values.o3,
      });
      setPrediction(res);
      onResult?.(res.predicted_aqi, res.dominant_pollutant);
    } catch (err: any) {
      setError(err?.message || "Failed to connect to backend prediction model.");
    } finally {
      setLoading(false);
    }
  };

  const aqiVal = prediction?.predicted_aqi ?? initialData?.current_aqi ?? 0;
  const info = getAqiInfo(aqiVal);

  return (
    <section id="current" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Module 01"
        title="Current AQI Prediction"
        desc="Live editable prediction form auto-filled with real-time telemetry from FastAPI & Random Forest ML model."
      />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Input Form Card */}
        <SpotlightCard className="p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Live Pollutant Telemetry Inputs
            </div>
            <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              {fetchingLive ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                  Auto-Filling Live...
                </>
              ) : (
                "Single Source of Truth"
              )}
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className="group block">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-white">{f.label}</span>
                  <span className="text-[11px] text-slate-400">{f.unit}</span>
                </div>
                <div className="mt-1.5 flex items-center rounded-xl border border-slate-800 bg-[#060E1A] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={values[f.key] === 0 ? "" : values[f.key]}
                    onChange={(e) =>
                      setValues({ ...values, [f.key]: e.target.value === "" ? 0 : Number(e.target.value) })
                    }
                    placeholder="0.0"
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm font-semibold text-white outline-none"
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-400">{f.hint}</div>
              </label>
            ))}
          </div>

          <Button
            onClick={predict}
            disabled={loading}
            size="lg"
            className="mt-6 w-full rounded-xl bg-[#00E599] font-bold text-slate-950 hover:bg-[#00C885] transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running ML Model...
              </>
            ) : (
              <>
                <Zap className="mr-1 h-4 w-4 fill-current" /> Predict AQI (Backend ML Model)
              </>
            )}
          </Button>
        </SpotlightCard>

        {/* Output Result Card */}
        <SpotlightCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Predicted AQI (FastAPI Response)</span>
            {(prediction || initialData) && (
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {prediction?.model_used || initialData?.model_used}
              </span>
            )}
          </div>
          <div className="mt-4">
            <AqiGauge value={aqiVal} />
          </div>

          <div className="mt-4 grid gap-3 text-sm">
            <Row label="Dominant Pollutant" value={prediction?.dominant_pollutant ?? initialData?.dominant_pollutant ?? "PM2.5"} />
            <Row label="CPCB Category" value={prediction?.category ?? initialData?.category ?? info.category} />
            <Row label="Sensitive Groups" value={prediction?.health_advisory?.sensitive_groups ?? initialData?.health_advisory?.sensitive_groups ?? (aqiVal > 100 ? "At risk" : "Safe")} />
            
            <div className="inner-pill rounded-2xl p-4 border border-slate-800/80 bg-slate-950/60">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Health Recommendation
              </div>
              <div className="mt-1 text-sm text-white font-medium leading-relaxed">
                {prediction?.health_advisory?.general_recommendation ?? initialData?.health_advisory?.general_recommendation ?? info.advice}
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="inner-pill flex items-center justify-between rounded-xl px-4 py-2.5 text-sm border border-slate-800/80 bg-slate-950/60">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-start gap-2.5">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-[#091322]/90 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-md shadow-lg">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {eyebrow}
      </span>
      <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-lg sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {desc && (
        <p className="max-w-2xl text-sm font-medium text-slate-200 drop-shadow-md sm:text-base">{desc}</p>
      )}
    </div>
  );
}