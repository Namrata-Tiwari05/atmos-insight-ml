import { Brain, LineChart, Wind, Code2 } from "lucide-react";
import { SectionHeader } from "./PredictionModule";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const stack = ["React 19", "Vite", "Tailwind CSS", "FastAPI", "Python 3.11", "Scikit-learn", "XGBoost", "Recharts", "Lucide Icons"];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader eyebrow="Overview & Tech Stack" title="About The Project" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Feature
          icon={<Brain className="h-5 w-5 text-emerald-400" />}
          title="Machine Learning"
          desc="An XGBoost regressor is trained on multi-year CPCB station data to learn seasonal and pollutant interactions."
        />
        <Feature
          icon={<Wind className="h-5 w-5 text-sky-400" />}
          title="Air Quality Index"
          desc="AQI is derived using the CPCB sub-index formula across PM2.5, PM10, NO₂, SO₂, CO and O₃."
        />
        <Feature
          icon={<LineChart className="h-5 w-5 text-teal-400" />}
          title="Forecasting Engine"
          desc="Time-series feature engineering delivers hourly and 7-day forecasts with high confidence precision."
        />
      </div>

      <div className="mt-6">
        <SpotlightCard className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
            <Code2 className="h-4 w-4" /> Built With Modern Tech Stack
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {stack.map((s) => (
              <span
                key={s}
                className="rounded-full border border-slate-700/80 bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-slate-200 shadow-sm transition-colors hover:border-emerald-500/40 hover:text-white"
              >
                {s}
              </span>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <SpotlightCard className="p-6 sm:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-700/60 bg-[#0A182E]/90 shadow-md backdrop-blur">
        {icon}
      </span>
      <h3 className="mt-5 text-xl font-bold text-white tracking-tight">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">{desc}</p>
    </SpotlightCard>
  );
}