const bands = [
  { label: "Good", range: "0–50", hex: "#22c55e" },
  { label: "Satisfactory", range: "51–100", hex: "#84cc16" },
  { label: "Moderate", range: "101–200", hex: "#eab308" },
  { label: "Poor", range: "201–300", hex: "#f97316" },
  { label: "Very Poor", range: "301–400", hex: "#ef4444" },
  { label: "Severe", range: "401–500", hex: "#a855f7" },
];

export function AqiLegend() {
  return (
    <div className="inner-pill flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-2xl px-5 py-3.5 shadow-lg">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        AQI Scale
      </span>
      {bands.map((b) => (
        <span key={b.label} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: b.hex }} />
          <span className="font-semibold text-white">{b.label}</span>
          <span className="text-slate-400 text-[11px]">{b.range}</span>
        </span>
      ))}
    </div>
  );
}
