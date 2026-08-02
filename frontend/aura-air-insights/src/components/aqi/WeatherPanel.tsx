import React, { useState, useEffect } from "react";
import {
  CloudFog,
  CloudLightning,
  CloudRain,
  Cloudy,
  Droplets,
  Eye,
  Gauge,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import { SectionHeader } from "./PredictionModule";
import { AqiGauge } from "./AqiGauge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { windDirection, type WeatherCondition } from "./weather-data";
import { fetchLiveWeather, WeatherResponse } from "@/services/weatherService";

const icons: Record<WeatherCondition, React.ElementType> = {
  sunny: Sun,
  cloudy: Cloudy,
  rainy: CloudRain,
  foggy: CloudFog,
  stormy: CloudLightning,
};

export function WeatherPanel({
  aqi,
  dominant,
  condition,
  weatherData,
  onConditionChange,
}: {
  aqi: number;
  dominant: string;
  condition: WeatherCondition;
  weatherData?: any;
  onConditionChange?: (c: WeatherCondition) => void;
}) {
  const [liveWeather, setLiveWeather] = useState<any>(null);

  useEffect(() => {
    if (weatherData) {
      setLiveWeather(weatherData);
    } else {
      fetchLiveWeather()
        .then((res) => setLiveWeather(res))
        .catch((err) => console.error("Failed to fetch live weather telemetry:", err));
    }
  }, [weatherData]);

  const w = liveWeather || {
    temperature: 34.2,
    feels_like: 36.5,
    humidity: 51,
    wind_speed: 5.4,
    wind_direction: 111,
    pressure: 998,
    uv_index: 5.2,
    visibility: 10.0,
    sunrise: "05:28",
    sunset: "19:04",
    description: "Scattered Clouds",
    condition: "cloudy",
  };

  const currentCondition: WeatherCondition = (w.condition as WeatherCondition) || condition || "cloudy";
  const Icon = icons[currentCondition] || Cloudy;

  const stats = [
    { icon: Thermometer, label: "Feels like", value: `${w.feels_like ?? w.temperature}°C` },
    { icon: Droplets, label: "Humidity", value: `${w.humidity}%` },
    { icon: Wind, label: "Wind", value: `${w.wind_speed} km/h ${windDirection(w.wind_direction ?? 120)}` },
    { icon: Gauge, label: "Pressure", value: `${w.pressure} hPa` },
    { icon: Sun, label: "UV Index", value: `${w.uv_index ?? 4}` },
    { icon: Eye, label: "Visibility", value: `${w.visibility} km` },
    { icon: Sunrise, label: "Sunrise", value: w.sunrise ?? "05:28" },
    { icon: Sunset, label: "Sunset", value: w.sunset ?? "19:04" },
  ];

  return (
    <section id="live" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Live · Kanpur"
        title="Current Conditions"
        desc="Real-time live air quality telemetry and meteorological observations directly from OpenWeatherMap."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SpotlightCard className="p-6 sm:p-8">
          <AqiGauge value={aqi} />
          <div className="mt-6 grid gap-2 text-sm">
            <div className="inner-pill flex items-center justify-between rounded-xl px-4 py-2.5 border border-slate-800/80 bg-slate-950/60">
              <span className="text-slate-400">Dominant pollutant</span>
              <span className="font-semibold text-white">{dominant}</span>
            </div>
            <div className="inner-pill flex items-center justify-between rounded-xl px-4 py-2.5 border border-slate-800/80 bg-slate-950/60">
              <span className="text-slate-400">Monitoring Station</span>
              <span className="font-semibold text-white">IIT Kanpur / Nehru Nagar</span>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Icon className="h-9 w-9" strokeWidth={1.8} />
              </span>
              <div>
                <div className="text-4xl font-black tracking-tight text-white">{w.temperature}°C</div>
                <div className="text-sm text-slate-400 capitalize">{w.description || "Scattered Clouds"}</div>
              </div>
            </div>
            <WindCompass deg={w.wind_direction ?? 120} speed={w.wind_speed} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="inner-pill rounded-2xl px-3 py-3 border border-slate-800/80 bg-slate-950/60"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <s.icon className="h-3.5 w-3.5 text-sky-400" /> {s.label}
                </div>
                <div className="mt-1 text-sm font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}

function WindCompass({ deg = 0, speed = 0 }: { deg?: number; speed?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-2.5">
      <div className="relative grid h-12 w-12 place-items-center rounded-full border border-slate-700 bg-slate-900/90 text-[10px] font-bold text-slate-400">
        <span className="absolute top-1 text-[9px]">N</span>
        <span className="absolute right-1 text-[9px]">E</span>
        <span className="absolute bottom-1 text-[9px]">S</span>
        <span className="absolute left-1 text-[9px]">W</span>
        <div
          className="h-6 w-0.5 rounded-full bg-gradient-to-t from-transparent via-emerald-400 to-emerald-300 transition-transform duration-500"
          style={{ transform: `rotate(${deg}deg)` }}
        />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live Wind Speed</div>
        <div className="text-sm font-bold text-white">
          {speed} km/h <span className="text-xs text-emerald-400 font-mono">{windDirection(deg)}</span>
        </div>
      </div>
    </div>
  );
}
