"use client";

import { NeuroNoise } from "@paper-design/shaders-react";
import { useReducedMotion } from "framer-motion";

/**
 * Product-relevant atmosphere: Paper Shaders NeuroNoise —
 * a glowing web of fluid lines (attack-graph / exploit-map energy).
 * https://shaders.paper.design — @paper-design/shaders-react
 */
export function HeroAtmosphere() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <NeuroNoise
        colorFront="#67e8f9"
        colorMid="#06b6d4"
        colorBack="#05080f"
        brightness={0.14}
        contrast={0.28}
        scale={1.15}
        speed={reduced ? 0 : 0.35}
        fit="cover"
        style={{ width: "100%", height: "100%" }}
        minPixelRatio={1}
        maxPixelCount={1600 * 900}
      />
      {/* Keep copy readable over the shader */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05080f]/25 via-[#05080f]/45 to-[#05080f]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,15,0.55)_100%)]" />
    </div>
  );
}
