import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Navbar } from "@/components/aqi/Navbar";
import { Hero } from "@/components/aqi/Hero";
import { Overview } from "@/components/aqi/Overview";
import { PredictionModule } from "@/components/aqi/PredictionModule";
import { HourlyForecast } from "@/components/aqi/HourlyForecast";
import { WeeklyForecast } from "@/components/aqi/WeeklyForecast";
import { WeatherPanel } from "@/components/aqi/WeatherPanel";
import type { WeatherCondition } from "@/components/aqi/weather-data";
import { AnimatedBackground } from "@/components/background/AnimatedBackground";
import { InitialLoader } from "@/components/ui/InitialLoader";
import { SectionSkeleton } from "@/components/ui/SectionSkeleton";

// Lazy loaded heavy visualization & analytics modules with named export handling
const KanpurHeatmap = lazy(() => import("@/components/aqi/KanpurHeatmap").then(m => ({ default: m.KanpurHeatmap })));
const PollutantTrends = lazy(() => import("@/components/aqi/PollutantTrends").then(m => ({ default: m.PollutantTrends })));
const Analytics = lazy(() => import("@/components/aqi/Analytics").then(m => ({ default: m.Analytics })));
const HealthAdvisory = lazy(() => import("@/components/aqi/HealthAdvisory").then(m => ({ default: m.HealthAdvisory })));
const Workflow = lazy(() => import("@/components/aqi/Workflow").then(m => ({ default: m.Workflow })));
const About = lazy(() => import("@/components/aqi/About").then(m => ({ default: m.About })));
const Footer = lazy(() => import("@/components/aqi/Footer").then(m => ({ default: m.Footer })));
const AqiTimeline = lazy(() => import("@/components/aqi/AqiTimeline").then(m => ({ default: m.AqiTimeline })));

import { fetchCurrentAqi, CurrentAqiResponse } from "@/services/aqiService";
import { fetch24HourForecast, fetch7DayForecast, HourlyForecastStep, DailyForecastStep } from "@/services/forecastService";

export function Index() {
  const [current, setCurrent] = useState<{ aqi: number; dominant: string }>({
    aqi: 92,
    dominant: "PM2.5",
  });
  const [liveData, setLiveData] = useState<CurrentAqiResponse | null>(null);
  const [forecast24h, setForecast24h] = useState<HourlyForecastStep[] | null>(null);
  const [forecast7d, setForecast7d] = useState<DailyForecastStep[] | null>(null);
  const [condition, setCondition] = useState<WeatherCondition>("cloudy");
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  useEffect(() => {
    // Single source of truth: Fetch live Current AQI, 24-Hour Forecast & 7-Day Forecast on page load
    Promise.all([
      fetchCurrentAqi().catch((err) => {
        console.error("Failed to fetch live Current AQI:", err);
        return null;
      }),
      fetch24HourForecast().catch((err) => {
        console.error("Failed to fetch 24-hour forecast:", err);
        return null;
      }),
      fetch7DayForecast().catch((err) => {
        console.error("Failed to fetch 7-day forecast:", err);
        return null;
      }),
    ])
      .then(([aqiRes, forecast24Res, forecast7Res]) => {
        if (aqiRes?.current_aqi) {
          setLiveData(aqiRes);
          setCurrent({ aqi: aqiRes.current_aqi, dominant: aqiRes.dominant_pollutant });
        }
        if (forecast24Res?.forecast) {
          setForecast24h(forecast24Res.forecast);
        }
        if (forecast7Res?.forecast) {
          setForecast7d(forecast7Res.forecast);
        }
      })
      .finally(() => setIsAppLoaded(true));
  }, []);

  const handlePredictionResult = useCallback((aqi: number, dominant: string) => {
    setCurrent({ aqi, dominant });
  }, []);

  const handleConditionChange = useCallback((newCond: WeatherCondition) => {
    setCondition(newCond);
  }, []);

  return (
    <div className="relative z-10 min-h-screen text-foreground transform-gpu">
      {/* Non-blocking initial loader */}
      <InitialLoader isLoaded={isAppLoaded} />
      
      {/* Smooth 60 FPS GPU-accelerated background */}
      <AnimatedBackground condition={condition} aqi={current.aqi} />
      
      {/* Instant Navbar */}
      <Navbar />
      
      <main className="space-y-20 pb-20 sm:space-y-24">
        {/* Above-the-fold Hero & Weather Panel load instantly */}
        <Hero />
        
        <WeatherPanel
          aqi={current.aqi}
          dominant={current.dominant}
          condition={condition}
          weatherData={liveData?.weather}
          onConditionChange={handleConditionChange}
        />
        
        <Overview aqi={current.aqi} dominant={current.dominant} />
        
        <PredictionModule initialData={liveData} onResult={handlePredictionResult} />
        
        <Suspense fallback={<SectionSkeleton height="h-36" title="Loading Timeline..." />}>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <AqiTimeline forecastData={forecast24h} />
          </section>
        </Suspense>
        
        <HourlyForecast forecastData={forecast24h} />
        
        <WeeklyForecast data={forecast7d} />
        
        <Suspense fallback={<SectionSkeleton height="h-[500px]" title="Loading Interactive Map..." />}>
          <KanpurHeatmap aqi={current.aqi} />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-[450px]" title="Loading Pollutant Trends..." />}>
          <PollutantTrends />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-[550px]" title="Loading Advanced Analytics..." />}>
          <Analytics />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-[350px]" title="Loading Health Advisory..." />}>
          <HealthAdvisory aqi={current.aqi} />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-[400px]" title="Loading System Architecture..." />}>
          <Workflow />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-[350px]" title="Loading Project Overview..." />}>
          <About />
        </Suspense>
      </main>
      
      <Suspense fallback={<div className="h-20 bg-slate-950/80" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default React.memo(Index);
