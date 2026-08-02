import React, { useEffect, useState } from "react";
import { Cloud, Wind, Sparkles, Sun } from "lucide-react";

const messages = [
  "Initializing Atmospheric Engine...",
  "Connecting Weather Intelligence...",
  "Loading AI Models...",
  "Preparing Forecast Engine...",
  "Ready.",
];

export function InitialLoader({ isLoaded = false }: { isLoaded?: boolean }) {
  const [progress, setProgress] = useState(20);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) return prev + Math.floor(Math.random() * 20 + 15);
        return prev;
      });
    }, 40);

    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
    }, 70);

    return () => {
      clearInterval(progressTimer);
      clearInterval(msgTimer);
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setProgress(100);
      setFadeOut(true);
      const timer = setTimeout(() => {
        setHidden(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl transition-opacity duration-500 ease-out select-none overflow-hidden ${
        fadeOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* ☁️ Atmospheric Moving Background Cloud Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 h-64 w-[600px] rounded-full bg-sky-400/15 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 h-72 w-[650px] rounded-full bg-cyan-300/15 blur-[120px] animate-pulse [animation-delay:2s]" />
        
        {/* Floating Background Cloud Mist Orbs */}
        <div className="absolute top-1/3 left-1/4 h-32 w-80 rounded-full bg-white/10 blur-3xl animate-bounce [animation-duration:6s]" />
        <div className="absolute bottom-1/3 right-1/4 h-36 w-96 rounded-full bg-sky-200/10 blur-3xl animate-bounce [animation-duration:8s] [animation-delay:3s]" />
      </div>

      {/* 🌥️ Glassmorphic Cloud Loader Centerpiece Card */}
      <div className="relative z-10 flex flex-col items-center p-8 rounded-3xl border border-sky-500/20 bg-slate-900/70 shadow-2xl backdrop-blur-xl max-w-sm w-full mx-4">
        
        {/* Soft Radial Sunbeam Aura */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-gradient-to-b from-sky-400/30 via-cyan-400/20 to-transparent blur-3xl animate-pulse" />

        {/* ☁️ Interactive Atmospheric Cloud Icon Module */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-sky-400/30 bg-slate-950/80 shadow-2xl">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-sky-500/20 via-cyan-400/20 to-transparent animate-pulse" />
          
          {/* Layered Cloud Animations */}
          <div className="relative flex items-center justify-center text-sky-300">
            {/* Background Sun Rays Glow */}
            <Sun className="absolute h-12 w-12 text-amber-300/40 animate-spin [animation-duration:12s] -top-2 -right-2" />
            
            {/* Outer Cloud Silhouette */}
            <Cloud className="h-12 w-12 text-sky-400 opacity-60 animate-pulse" />
            
            {/* Inner Puffy Cloud Center */}
            <Cloud className="absolute h-9 w-9 text-white drop-shadow-[0_2px_10px_rgba(56,189,248,0.6)] animate-bounce [animation-duration:3s]" />
            
            {/* Horizontal Wind Stream Currents */}
            <Wind className="absolute -bottom-1 -left-2 h-5 w-5 text-cyan-300 animate-pulse" />
          </div>
        </div>

        {/* Branding */}
        <div className="mt-6 flex items-center gap-2 text-2xl font-black tracking-tight text-white drop-shadow-md">
          <span>ATMOS</span>
          <span className="text-sky-400">INSIGHT</span>
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>

        {/* Dynamic Status Message */}
        <div className="mt-3 h-5 text-xs font-semibold text-slate-300 transition-all duration-150 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-ping" />
          {messages[msgIndex]}
        </div>

        {/* Sleek Cloud Progress Bar */}
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="mt-2 text-[11px] font-mono font-bold tracking-widest text-slate-400">
          {progress}%
        </div>
      </div>
    </div>
  );
}

export default React.memo(InitialLoader);
