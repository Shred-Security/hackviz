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

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
