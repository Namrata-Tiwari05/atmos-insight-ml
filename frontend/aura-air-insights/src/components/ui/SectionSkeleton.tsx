import React from "react";

export function SectionSkeleton({ height = "h-80", title = "Loading Section..." }: { height?: string; title?: string }) {
  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 w-full ${height} my-8`}>
      <div className="h-full w-full rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md animate-pulse flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-6 w-48 rounded bg-slate-800/60" />
          <div className="h-4 w-72 rounded bg-slate-800/40" />
        </div>
        <div className="flex-1 my-6 rounded-xl bg-slate-800/30 flex items-center justify-center">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-24 rounded bg-slate-800/40" />
          <div className="h-4 w-32 rounded bg-slate-800/40" />
        </div>
      </div>
    </div>
  );
}

export const MemoizedSectionSkeleton = React.memo(SectionSkeleton);
