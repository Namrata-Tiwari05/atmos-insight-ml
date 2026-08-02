import React, { useEffect, useRef } from "react";

export function AnimatedBackground({
  condition = "cloudy",
  aqi = 92,
  isNight = false,
}: {
  condition?: string;
  aqi?: number;
  isNight?: boolean;
}) {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Smooth & Slow Mouse Parallax
  useEffect(() => {
    let animId: number;
    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      targetX = normX * 14;
      targetY = normY * 14;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const loop = () => {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      }
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // 2. 60 FPS Canvas: Moving Left-to-Right Clouds + Wind Flow Streams + Air Streaks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // ☁️ 4 Parallax Cloud Layers (Left to Right Motion with +10% Lighter Cloud Visibility)
    const clouds = [
      { x: -150, y: height * 0.06, baseY: height * 0.06, speed: 0.45, scale: 0.60, maxAlpha: 0.25, driftFreq: 0.003 },
      { x: -450, y: height * 0.18, baseY: height * 0.18, speed: 0.60, scale: 0.70, maxAlpha: 0.24, driftFreq: 0.004 },
      { x: -280, y: height * 0.32, baseY: height * 0.32, speed: 0.75, scale: 0.85, maxAlpha: 0.27, driftFreq: 0.003 },
      { x: -620, y: height * 0.45, baseY: height * 0.45, speed: 0.65, scale: 0.75, maxAlpha: 0.26, driftFreq: 0.002 },
      { x: -380, y: height * 0.58, baseY: height * 0.58, speed: 0.90, scale: 0.90, maxAlpha: 0.28, driftFreq: 0.004 },
      { x: -750, y: height * 0.25, baseY: height * 0.25, speed: 0.80, scale: 0.80, maxAlpha: 0.26, driftFreq: 0.003 },
    ];

    // 💨 Wind Flow Streams (Curved Translucent Vectors moving Left to Right)
    const windStreams = Array.from({ length: 6 }, (_, i) => ({
      x: -350 - i * 200,
      y: Math.random() * height * 0.8 + 40,
      length: Math.random() * 450 + 300,
      speed: Math.random() * 1.2 + 0.8,
      amplitude: Math.random() * 20 + 10,
      alpha: Math.random() * 0.08 + 0.04,
    }));

    // 🍃 Horizontal Wind Streaks (Left to Right)
    const windParticles = Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 50 + 20,
      vx: Math.random() * 2.0 + 1.2,
      alpha: Math.random() * 0.18 + 0.08,
    }));

    let time = 0;

    // Draw soft cloud shape
    const drawSoftCloud = (x: number, y: number, scale: number, alpha: number) => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.shadowBlur = 25 * scale;
      ctx.shadowColor = "rgba(255, 255, 255, 0.25)";

      ctx.beginPath();
      const r = 22 * scale;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.arc(x + r * 0.7, y - r * 0.3, r * 0.7, 0, Math.PI * 2);
      ctx.arc(x + r * 1.4, y - r * 0.08, r * 0.8, 0, Math.PI * 2);
      ctx.arc(x + r * 2.0, y + r * 0.08, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.01;

      // 1. Move & Draw Soft Clouds (Left to Right)
      clouds.forEach((c) => {
        c.x += c.speed;
        c.y = c.baseY + Math.sin(time + c.x * c.driftFreq) * 5;

        let currentAlpha = c.maxAlpha;
        const margin = 200;
        if (c.x < margin) {
          currentAlpha = c.maxAlpha * Math.max(0, (c.x + 100) / (margin + 100));
        } else if (c.x > width - margin) {
          currentAlpha = c.maxAlpha * Math.max(0, (width + 100 - c.x) / (margin + 100));
        }

        if (c.x > width + 250) {
          c.x = -250;
          c.baseY = Math.random() * (height * 0.65) + 40;
        }

        if (currentAlpha > 0.005) {
          drawSoftCloud(c.x, c.y, c.scale, currentAlpha);
        }
      });

      // 2. Move & Draw Translucent Wind Flow Streams (Left to Right)
      ctx.lineWidth = 1.2;
      windStreams.forEach((stream) => {
        stream.x += stream.speed;
        if (stream.x > width + 350) {
          stream.x = -400;
          stream.y = Math.random() * height * 0.8 + 40;
        }

        ctx.beginPath();
        const startX = stream.x;
        const startY = stream.y + Math.sin(time + stream.x * 0.002) * stream.amplitude;
        const cp1x = startX + stream.length * 0.33;
        const cp1y = startY + Math.cos(time * 1.1) * 14;
        const cp2x = startX + stream.length * 0.66;
        const cp2y = startY - Math.sin(time * 1.1) * 14;
        const endX = startX + stream.length;
        const endY = startY + Math.sin(time * 1.4) * 10;

        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, "rgba(224, 242, 254, 0)");
        grad.addColorStop(0.5, `rgba(224, 242, 254, ${stream.alpha})`);
        grad.addColorStop(1, "rgba(224, 242, 254, 0)");

        ctx.strokeStyle = grad;
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();
      });

      // 3. Move & Draw Horizontal Wind Particles (Left to Right)
      windParticles.forEach((wp) => {
        wp.x += wp.vx;
        if (wp.x > width + 100) {
          wp.x = -100;
          wp.y = Math.random() * height;
        }

        const streakGrad = ctx.createLinearGradient(wp.x, wp.y, wp.x + wp.length, wp.y);
        streakGrad.addColorStop(0, "rgba(224, 242, 254, 0)");
        streakGrad.addColorStop(0.5, `rgba(224, 242, 254, ${wp.alpha})`);
        streakGrad.addColorStop(1, "rgba(224, 242, 254, 0)");

        ctx.beginPath();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = streakGrad;
        ctx.moveTo(wp.x, wp.y);
        ctx.lineTo(wp.x + wp.length, wp.y);
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const [skyCycle, setSkyCycle] = React.useState<"light" | "dark">("light");

  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setSkyCycle((prev) => (prev === "light" ? "dark" : "light"));
    }, 25000);
    return () => clearInterval(cycleTimer);
  }, []);

  const getGradientTheme = () => {
    if (isNight) return "from-[#091224] via-[#0F172A] to-[#020617]";
    if (aqi > 300) return "from-[#4C1D95] via-[#31103F] to-[#11061C]";
    if (aqi > 200) return "from-[#7C2D12] via-[#451A03] to-[#0C0A09]";
    if (aqi > 100) return "from-[#1E3A5F] via-[#11243B] to-[#061224]";
    if (condition === "rainy") return "from-[#334155] via-[#1E293B] to-[#0F172A]";
    
    return skyCycle === "light"
      ? "from-[#1E3A5F] via-[#0F1D38] to-[#060E1E]"
      : "from-[#091224] via-[#0D162B] to-[#040812]";
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none transform-gpu">
      {/* 1. Lighter Sky Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${getGradientTheme()} transition-colors duration-[2500ms] ease-in-out`}
      />

      {/* 2. Soft Hero Sunlight Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-gradient-to-b from-sky-200/20 via-cyan-400/10 to-transparent blur-[120px]" />

      {/* 3. Ambient Aurora Blobs */}
      <div className="absolute -top-20 -left-20 h-[550px] w-[550px] rounded-full bg-sky-400/15 blur-[140px] animate-pulse" />
      <div className="absolute top-1/3 -right-20 h-[600px] w-[600px] rounded-full bg-blue-500/15 blur-[150px] animate-pulse [animation-delay:3s]" />

      {/* 4. Mouse Parallax Background Wrapper */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 transition-transform duration-100 ease-out"
      >
        <div className="absolute top-12 left-5 h-72 w-[750px] rounded-full bg-white/10 blur-[90px] animate-pulse" />
      </div>

      {/* 5. 60 FPS Canvas (Moving Left-to-Right Clouds + Wind Flow Streams + Air Streaks) */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* 6. Subtle Noise Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export default React.memo(AnimatedBackground);
