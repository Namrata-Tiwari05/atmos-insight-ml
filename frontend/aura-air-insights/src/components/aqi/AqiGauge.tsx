import { useEffect, useState } from "react";
import { getAqiInfo } from "./aqi-utils";
import { AnimatedNumber } from "./AnimatedNumber";

export function AqiGauge({ value, size = 220 }: { value: number; size?: number }) {
  const info = getAqiInfo(value);
  const [progress, setProgress] = useState(0);
  const r = 84;
  const circumference = 2 * Math.PI * r;
  const sweep = 0.78; // 280 degrees
  const arc = circumference * sweep;

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(Math.min(1, value / 500)));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="h-full w-full rotate-[126deg]">
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={info.hex}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${arc * progress} ${circumference}`}
          style={{
            transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1), stroke 500ms ease",
            filter: `drop-shadow(0 0 10px ${info.hex}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          AQI
        </span>
        <span className="text-5xl font-black tracking-tight text-foreground tabular-nums">
          <AnimatedNumber value={value} />
        </span>
        <span
          className="mt-2 rounded-full px-3 py-1 text-[11px] font-bold text-white"
          style={{ backgroundColor: info.hex }}
        >
          {info.category}
        </span>
      </div>
    </div>
  );
}
