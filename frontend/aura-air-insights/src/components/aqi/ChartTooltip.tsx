import type { TooltipProps } from "recharts";

export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-xl backdrop-blur"
      style={{ boxShadow: "0 10px 30px -12px rgba(0,0,0,0.25)" }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color || "var(--foreground)" }}
            />
            {p.name && <span className="text-muted-foreground">{p.name}:</span>}
            <span>{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
