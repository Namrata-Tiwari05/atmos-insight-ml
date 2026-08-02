import { useEffect, useRef } from "react";
import type { WeatherCondition } from "./weather-data";

/**
 * 5-LAYER LIVING ATMOSPHERIC BACKGROUND SYSTEM
 * Apple + Linear + Stripe + Weather App Glassmorphism Aesthetic.
 */
export function WeatherBackground({
  condition,
  aqi,
}: {
  condition: WeatherCondition;
  aqi: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // LAYER 4: 300 Atmospheric particles (dust / tiny stars)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particleCount = Math.min(320, Math.floor((width * height) / 4000));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.5 + 0.15,
      alphaTarget: Math.random() * 0.5 + 0.15,
      speedY: -(Math.random() * 0.22 + 0.05),
      speedX: (Math.random() - 0.5) * 0.12,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
    }));

    let isTabActive = true;
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (isTabActive) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.y += p.speedY;
          p.x += p.speedX;

          if (p.y < 0) p.y = height;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          // Smooth twinkling opacity
          if (Math.abs(p.alpha - p.alphaTarget) < 0.02) {
            p.alphaTarget = Math.random() * 0.55 + 0.15;
          }
          p.alpha += (p.alphaTarget - p.alpha) * p.twinkleSpeed;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${p.alpha})`;
          ctx.shadowBlur = p.radius * 3;
          ctx.shadowColor = "#64B5F6";
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      
      {/* LAYER 1: Animated Multi-Stop Gradient Background (#071A35, #0A5FD9, #1E88E5, #64B5F6, #A5D8FF) */}
      <div className="atmos-layer1-bg absolute inset-0 opacity-90 transition-opacity duration-1000" />

      {/* LAYER 2: 6 Large Blurred Glowing Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="atmos-blob-1 absolute -top-[10%] left-[5%] h-[500px] w-[500px] rounded-full bg-[#0A5FD9] opacity-25 blur-[160px] transform-gpu" />
        <div className="atmos-blob-2 absolute top-[18%] right-[2%] h-[600px] w-[600px] rounded-full bg-[#1E88E5] opacity-20 blur-[180px] transform-gpu" />
        <div className="atmos-blob-3 absolute top-[48%] left-[12%] h-[550px] w-[550px] rounded-full bg-[#071A35] opacity-30 blur-[200px] transform-gpu" />
        <div className="atmos-blob-4 absolute bottom-[10%] right-[12%] h-[500px] w-[500px] rounded-full bg-[#64B5F6] opacity-20 blur-[170px] transform-gpu" />
        <div className="atmos-blob-5 absolute top-[32%] left-[45%] h-[450px] w-[450px] rounded-full bg-[#A5D8FF] opacity-15 blur-[190px] transform-gpu" />
        <div className="atmos-blob-6 absolute bottom-[5%] left-[2%] h-[520px] w-[520px] rounded-full bg-[#0A5FD9] opacity-22 blur-[160px] transform-gpu" />
      </div>

      {/* LAYER 3: Soft Floating Clouds */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="atmos-cloud-a absolute top-[10%] h-48 w-[420px] rounded-full bg-sky-100/10 blur-3xl transform-gpu" />
        <div className="atmos-cloud-b absolute top-[28%] h-36 w-[350px] rounded-full bg-blue-200/12 blur-3xl transform-gpu" />
        <div className="atmos-cloud-c absolute top-[55%] h-44 w-[400px] rounded-full bg-indigo-100/10 blur-3xl transform-gpu" />
        <div className="atmos-cloud-d absolute top-[75%] h-32 w-[320px] rounded-full bg-sky-200/10 blur-3xl transform-gpu" />
      </div>

      {/* LAYER 4: Tiny Glowing Particles (Atmospheric Dust / Tiny Stars) */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-85" />

      {/* LAYER 5: Soft Radial Light Behind Hero Card */}
      <div className="atmos-hero-glow absolute top-[10%] left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-r from-[#1E88E5]/20 via-[#64B5F6]/25 to-[#A5D8FF]/15 blur-[140px] transform-gpu" />

    </div>
  );
}
