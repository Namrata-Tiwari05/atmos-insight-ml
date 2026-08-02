import { Globe, Share2, Wind, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-800/90 bg-[#071120]/95 backdrop-blur-2xl py-10 shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 text-slate-950 shadow-md">
            <Wind className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-base font-bold text-white tracking-tight">
              Atmos Insight <span className="text-emerald-400">AI</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} Real-Time Air Quality &amp; Machine Learning Forecasting
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> System Operational
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-700"
          >
            <Globe className="h-4 w-4 text-sky-400 transition-transform group-hover:-translate-y-0.5" />
            GitHub
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-700"
          >
            <Share2 className="h-4 w-4 text-sky-400 transition-transform group-hover:-translate-y-0.5" />
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}