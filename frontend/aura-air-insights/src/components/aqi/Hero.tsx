import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero({ currentAQI }: { currentAQI?: any }) {
  return (
    <section id="home" className="relative overflow-hidden bg-transparent text-white pt-8 pb-12">
      {/* Hero Small Floating Ambient Clouds */}
      <div className="pointer-events-none absolute top-4 left-10 h-16 w-36 rounded-full bg-white/10 blur-xl animate-pulse" />
      <div className="pointer-events-none absolute top-12 right-20 h-20 w-44 rounded-full bg-sky-300/10 blur-2xl animate-pulse [animation-delay:2s]" />
      <div className="pointer-events-none absolute bottom-6 left-1/3 h-14 w-40 rounded-full bg-cyan-200/10 blur-xl animate-pulse [animation-delay:4s]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Tag Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-950/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400 backdrop-blur shadow-lg">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          REAL-TIME AIR QUALITY MONITORING • ML FORECASTING
        </div>

        {/* Hero Grid Section */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Big Bold Uppercase Typography */}
          <div className="lg:col-span-7">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05] drop-shadow-md">
              REAL-TIME AIR<br />
              QUALITY<br />
              <span className="text-[#00E599] drop-shadow-[0_2px_10px_rgba(0,229,153,0.3)]">MONITORING &amp;</span><br />
              <span className="text-[#00E599] drop-shadow-[0_2px_10px_rgba(0,229,153,0.3)]">FORECASTING.</span>
            </h1>
          </div>

          {/* Right Column: Description & CTAs */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <p className="text-base leading-relaxed text-slate-200 sm:text-lg font-medium drop-shadow-sm">
              Monitor live air quality conditions and explore predictive trends on a clean, unified dashboard.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#00E599] font-bold text-slate-950 hover:bg-[#00C885] transition-transform hover:scale-105 px-6 py-6 text-base"
              >
                <a href="#overview">
                  Explore Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-slate-800 bg-slate-900/80 font-medium text-slate-200 hover:bg-slate-800 hover:text-white px-6 py-6 text-base"
              >
                <a href="#hourly">
                  <Play className="mr-2 h-4 w-4 fill-current text-slate-400" /> View Forecasts
                </a>
              </Button>
            </div>
          </div>

        </div>

        {/* Reduced Size & Minimalistic Monitoring Station Card */}
        <div className="mt-12 relative mx-auto max-w-4xl">
          <div className="absolute -top-3.5 right-4 z-10 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/90 px-3.5 py-1 text-xs font-medium text-emerald-400 shadow-lg backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Station <span className="text-slate-400 font-normal">Online</span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between pb-2.5 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-2 text-slate-300">
                KANPUR MONITORING STATION
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>

            {/* Reduced Height Minimalistic Station Graphic */}
            <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-[#0A1017] border border-slate-800/80">
              <MinimalistSkylineSVG />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function MinimalistSkylineSVG() {
  return (
    <svg viewBox="0 0 800 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="minBldg1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="minBldg2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Sun / Moon Minimal Dot */}
      <circle cx="650" cy="45" r="28" fill="#FDE047" opacity="0.85" />
      <circle cx="650" cy="45" r="42" fill="#FDE047" opacity="0.15" />

      {/* Soft Clouds */}
      <g fill="#334155" opacity="0.4">
        <ellipse cx="220" cy="35" rx="50" ry="10" />
        <ellipse cx="460" cy="25" rx="40" ry="8" />
      </g>

      {/* Minimal Skyline Buildings */}
      <rect x="160" y="85" width="65" height="75" rx="4" fill="url(#minBldg2)" />
      <rect x="250" y="50" width="80" height="110" rx="6" fill="url(#minBldg1)" />
      <rect x="350" y="100" width="55" height="60" rx="4" fill="url(#minBldg2)" />
      <rect x="420" y="70" width="85" height="90" rx="6" fill="url(#minBldg1)" />
      <rect x="525" y="80" width="70" height="80" rx="6" fill="url(#minBldg2)" />
      <rect x="615" y="95" width="50" height="65" rx="4" fill="url(#minBldg1)" />

      {/* Building Windows Grid */}
      <g fill="#E2E8F0" opacity="0.6">
        {/* Building 1 windows */}
        <rect x="270" y="65" width="10" height="8" rx="1" />
        <rect x="290" y="65" width="10" height="8" rx="1" />
        <rect x="310" y="65" width="10" height="8" rx="1" />
        <rect x="270" y="82" width="10" height="8" rx="1" />
        <rect x="290" y="82" width="10" height="8" rx="1" />
        <rect x="310" y="82" width="10" height="8" rx="1" />
        
        {/* Building 2 windows */}
        <rect x="440" y="85" width="12" height="8" rx="1" />
        <rect x="460" y="85" width="12" height="8" rx="1" />
        <rect x="480" y="85" width="12" height="8" rx="1" />
        <rect x="440" y="102" width="12" height="8" rx="1" />
        <rect x="460" y="102" width="12" height="8" rx="1" />
        <rect x="480" y="102" width="12" height="8" rx="1" />
      </g>

      {/* Sensor Tower Spire */}
      <rect x="288" y="20" width="4" height="30" fill="#10B981" />
      <circle cx="290" cy="18" r="5" fill="#10B981" />
      <circle cx="290" cy="18" r="12" fill="#10B981" opacity="0.25" />

      {/* Ground border */}
      <line x1="0" y1="159" x2="800" y2="159" stroke="#1E293B" strokeWidth="2" />
    </svg>
  );
}