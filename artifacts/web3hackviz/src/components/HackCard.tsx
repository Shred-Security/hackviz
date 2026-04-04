"use client";
import { Link } from "wouter";
import { Web3Hack, typeColors } from "@/data/hacks";
import { getProgress } from "@/lib/progress";
import { useState, useEffect } from "react";
import { Play, Trophy, BookOpen, ExternalLink, TrendingDown } from "lucide-react";

interface Props {
  hack: Web3Hack;
}

function formatImpact(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`;
  return `$${(usd / 1_000).toFixed(0)}K`;
}

export function HackCard({ hack }: Props) {
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    setProgress(getProgress(hack.slug));
  }, [hack.slug]);

  return (
    <div className="card-glow rounded-lg border border-border/50 bg-card flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group">
      {/* Header bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, rgba(0,255,255,0.8), rgba(0,255,128,0.4))" }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-foreground">{hack.title}</h3>
              {progress === "mastered" && <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
              {progress === "audited" && <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground">{hack.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-mono font-bold text-red-400 glow-text">
              {formatImpact(hack.impactUSD)}
            </div>
            <div className="text-[10px] text-muted-foreground">{hack.year} · {hack.chain}</div>
          </div>
        </div>

        {/* Type tags */}
        <div className="flex flex-wrap gap-1.5">
          {hack.type.map((t) => (
            <span
              key={t}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeColors[t] ?? "text-gray-400 border-gray-400/30 bg-gray-400/10"}`}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-3">
          {hack.shortDesc}
        </p>

        {/* Impact bar */}
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (hack.impactUSD / 1_500_000_000) * 100)}%`,
                background: "linear-gradient(90deg, rgba(255,60,60,0.8), rgba(255,60,60,0.3))",
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{hack.impact} drained</span>
        </div>

        {/* CTA */}
        <Link
          href={`/hack/${hack.slug}`}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2 rounded border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 hover:border-primary/50 transition-all group-hover:shadow-[0_0_12px_rgba(0,255,255,0.15)]"
        >
          <Play className="w-3 h-3" />
          Replay Exploit
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
      </div>
    </div>
  );
}
