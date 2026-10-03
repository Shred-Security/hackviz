"use client";
import { Link } from "wouter";
import { Hack, typeColors } from "@/data/hacks";
import { formatHackChains } from "@/lib/hack-chains";
import { getProgress } from "@/lib/progress";
import { useState, useEffect } from "react";
import { Play, Trophy, BookOpen, ExternalLink, TrendingDown } from "lucide-react";

interface Props {
  hack: Hack;
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
    <div className="card-glow group flex h-full flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_8px_28px_rgba(0,255,255,0.06)]">
      {/* Header bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, rgba(0,255,255,0.8), rgba(0,255,128,0.4))" }} />

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-foreground">{hack.title}</h3>
              {progress === "mastered" && <Trophy className="h-3.5 w-3.5 shrink-0 text-yellow-400" />}
              {progress === "audited" && <BookOpen className="h-3.5 w-3.5 shrink-0 text-cyan-400" />}
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{hack.subtitle}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-base font-bold text-red-400 glow-text sm:text-lg">
              {formatImpact(hack.impactUSD)}
            </div>
            <div className="max-w-[7.5rem] truncate text-[10px] text-muted-foreground sm:max-w-[9rem]">
              {hack.year} · {formatHackChains(hack)}
            </div>
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
          <span className="max-w-[40%] shrink-0 truncate text-[10px] text-muted-foreground">
            {hack.impact}
          </span>
        </div>

        {/* CTA */}
        <Link
          href={`/hack/${hack.slug}`}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded border border-primary/30 bg-primary/10 py-2.5 text-xs font-semibold text-primary transition-all hover:border-primary/50 hover:bg-primary/20 group-hover:shadow-[0_0_12px_rgba(0,255,255,0.15)] sm:py-2"
        >
          <Play className="w-3 h-3" />
          Replay Exploit
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
      </div>
    </div>
  );
}
