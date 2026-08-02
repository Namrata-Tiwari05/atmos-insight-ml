import { Activity, Wind, Droplets, HeartPulse } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { getAqiInfo } from "./aqi-utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export function Overview({ aqi = 82, dominant = "PM2.5" }: { aqi?: number; dominant?: string }) {
  const info = getAqiInfo(aqi);
  const cards = [
    {
      label: "Current AQI",
      icon: <Activity className="h-5 w-5" />,
      value: aqi,
      suffix: "",
      desc: "Live index across all pollutants",
      accent: "from-emerald-500/20 to-transparent",
      tone: "text-emerald-400",
    },
    {
      label: "AQI Category",
      icon: <Wind className="h-5 w-5" />,
      value: info.category,
      desc: "Based on CPCB classification",
      accent: "from-sky-500/20 to-transparent",
      tone: info.text,
    },
    {
      label: "Dominant Pollutant",
      icon: <Droplets className="h-5 w-5" />,
      value: dominant,
      desc: "Primary contributor to AQI",
      accent: "from-teal-500/20 to-transparent",
      tone: "text-teal-400",
    },
    {
      label: "Health Status",
      icon: <HeartPulse className="h-5 w-5" />,
      value: aqi <= 100 ? "Safe" : aqi <= 200 ? "Caution" : "Risk",
      desc: info.advice.split(".")[0],
      accent: "from-indigo-500/20 to-transparent",
      tone: info.text,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <SpotlightCard
            key={c.label}
            className="p-5"
          >
            <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${c.accent} blur-2xl`} />
            <div className="relative flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {c.label}
              </span>
              <span className={`grid h-9 w-9 place-items-center rounded-xl bg-slate-900/80 border border-slate-800 ${c.tone}`}>
                {c.icon}
              </span>
            </div>
            <div className="relative mt-4 text-3xl font-black tracking-tight text-white">
              {typeof c.value === "number" ? <AnimatedNumber value={c.value} /> : c.value}
            </div>
            <div className="relative mt-1 text-xs text-slate-400">{c.desc}</div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}