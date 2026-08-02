import { useEffect, useState } from "react";
import { Moon, Sun, Wind, Menu, X } from "lucide-react";

const links = [
  { href: "#home", label: "Home" },
  { href: "#current", label: "Current AQI" },
  { href: "#hourly", label: "24 Hour" },
  { href: "#weekly", label: "7 Day" },
  { href: "#analytics", label: "Analytics" },
  { href: "#about", label: "About" },
];

export function Navbar() {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 backdrop-blur-xl bg-[#0A1628]/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#home" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Wind className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">
            AQI Forecast <span className="text-emerald-400">AI</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:text-white hover:border-slate-700"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-800/80 bg-[#0A1628]/95 px-4 py-3 lg:hidden">
          <div className="grid gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}