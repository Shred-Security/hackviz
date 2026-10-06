"use client";

import { useEffect, useRef } from "react";

export function DarkForestBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    type Planet = { x: number; y: number; r: number; hue: number; ring: boolean; phase: number };
    const planets: Planet[] = [];

    const seed = () => {
      planets.length = 0;
      const n = Math.floor((w * h) / 90000);
      for (let i = 0; i < n; i++) {
        planets.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 2 + Math.random() * 9,
          hue: Math.random() < 0.7 ? 185 + Math.random() * 40 : 140 + Math.random() * 30,
          ring: Math.random() < 0.3,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const drawHex = (s: number, view: number) => {
      ctx.strokeStyle = "rgba(0, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const hw = s * Math.sqrt(3);
      const hh = s * 1.5;
      let row = 0;
      for (let y = -s + (view % hh); y < h + s; y += hh, row++) {
        const off = row % 2 ? hw / 2 : 0;
        for (let x = -hw + off; x < w + hw; x += hw) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i + Math.PI / 6;
            const px = x + s * Math.cos(a);
            const py = y + s * Math.sin(a);
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#04070d";
      ctx.fillRect(0, 0, w, h);

      const drift = reduced ? 0 : t * 0.15;
      ctx.save();
      ctx.translate(-((t * 4) % (60 * Math.sqrt(3))), -(drift % 45));
      drawHex(30, drift);
      ctx.restore();

      for (const p of planets) {
        const pulse = reduced ? 0.7 : 0.55 + 0.45 * Math.sin(t * 0.6 + p.phase);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${0.25 * pulse})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${0.5 + 0.4 * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.ring) {
          ctx.strokeStyle = `hsla(${p.hue}, 90%, 70%, ${0.25 * pulse})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 1.9, p.r * 0.7, -0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const fog = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
      fog.addColorStop(0, "rgba(4,7,13,0)");
      fog.addColorStop(1, "rgba(4,7,13,0.75)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      // single static frame
      drawHex(30, 0);
      for (const p of planets) {
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, 0.7)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      const fog = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
      fog.addColorStop(0, "rgba(4,7,13,0)");
      fog.addColorStop(1, "rgba(4,7,13,0.75)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
