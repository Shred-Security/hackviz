"use client";
import { useState } from "react";
import { Hack } from "@/data/hacks";
import { formatHackChains, getHackChains } from "@/lib/hack-chains";
import { ExternalLink, Code, FileText, ArrowRightLeft } from "lucide-react";
import { getExplorerTxUrl } from "@/lib/utils";

export function OverviewTab({ hack }: { hack: Hack }) {
  const [technical, setTechnical] = useState(false);

  return (
    <div className="py-6 space-y-6">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTechnical(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all
            ${!technical ? "bg-primary/15 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          <FileText className="w-3.5 h-3.5" />
          Plain English
        </button>
        <button
          onClick={() => setTechnical(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all
            ${technical ? "bg-primary/15 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          <Code className="w-3.5 h-3.5" />
          Technical
        </button>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {technical ? "Technical Analysis" : "What Happened?"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {technical ? hack.technicalDesc : hack.longDesc}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard label="Impact" value={hack.impact} highlight />
        <InfoCard label="Year" value={String(hack.year)} />
        <InfoCard
          label="Chain"
          value={formatHackChains(hack)}
          detail={getHackChains(hack).length > 1 ? getHackChains(hack).join(", ") : undefined}
        />
        <InfoCard label="Attack Types" value={hack.type.join(", ")} />
      </div>

      {/* Contracts */}
      {hack.contracts.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Relevant Contracts</h2>
          <div className="space-y-2">
            {hack.contracts.map((c) => (
              <div key={c.address} className="flex items-center justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                <div>
                  <div className="text-xs font-medium text-foreground">{c.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[240px]">
                    {c.address}
                  </div>
                </div>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0"
                >
                  View <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {hack.transactions && hack.transactions.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-foreground">Attack Transactions</h2>
          </div>
          <div className="space-y-2">
            {hack.transactions.map((t) => {
              const explorerUrl = getExplorerTxUrl(t.hash, t.chain || hack.chain);
              return (
                <div key={t.hash} className="flex items-center justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                  <div>
                    <div className="text-xs font-medium text-foreground">{t.label}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[360px]">
                      {t.hash}
                    </div>
                  </div>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0"
                  >
                    Explorer <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  detail,
  highlight,
}: {
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? "text-red-400" : "text-foreground"}`}>{value}</div>
      {detail && <div className="text-[10px] text-muted-foreground mt-1">{detail}</div>}
    </div>
  );
}
