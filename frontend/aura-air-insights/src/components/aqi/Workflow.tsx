import { Brain, CalendarRange, Clock, HeartPulse, Keyboard, Sigma } from "lucide-react";
import { SectionHeader } from "./PredictionModule";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const steps = [
  { icon: <Keyboard className="h-5 w-5 text-emerald-400" />, title: "Input", desc: "User enters pollutant values" },
  { icon: <Sigma className="h-5 w-5 text-sky-400" />, title: "CPCB Formula", desc: "Current AQI calculated" },
  { icon: <Brain className="h-5 w-5 text-emerald-400" />, title: "ML Model", desc: "XGBoost forecasting engine" },
  { icon: <Clock className="h-5 w-5 text-sky-400" />, title: "24h Prediction", desc: "Hourly outlook generated" },
  { icon: <CalendarRange className="h-5 w-5 text-teal-400" />, title: "7-Day Forecast", desc: "Weekly trajectory" },
  { icon: <HeartPulse className="h-5 w-5 text-emerald-400" />, title: "Advisory", desc: "Personalised recommendation" },
];

export function Workflow() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="System Architecture"
        title="How It Works"
        desc="From raw pollutant readings to a personalised health recommendation in six steps."
      />
      <SpotlightCard className="p-6 sm:p-8">
        <div className="relative">
          <div className="hidden md:block absolute left-0 right-0 top-6 h-0.5 bg-gradient-to-r from-emerald-500/20 via-sky-500/40 to-emerald-500/20" />
          <ol className="relative grid gap-6 md:grid-cols-6">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex flex-col items-center text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-700/60 bg-[#0A182E]/90 shadow-lg backdrop-blur z-10">
                  {s.icon}
                </div>
                <div className="mt-4">
                  <div className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Step {i + 1}
                  </div>
                  <div className="mt-1.5 text-sm font-bold text-white">{s.title}</div>
                  <div className="mt-0.5 text-xs font-medium text-slate-300">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </SpotlightCard>
    </section>
  );
}