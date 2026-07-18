"use client";
import { useState } from "react";
import { Hack } from "@/data/hacks";
import { ChevronDown, ChevronUp, Shield, Code2, AlertTriangle } from "lucide-react";

export function LessonsTab({ hack }: { hack: Hack }) {
  const [expandedMit, setExpandedMit] = useState<number | null>(0);
  const [whatIfEnabled, setWhatIfEnabled] = useState<Set<string>>(new Set());

  const toggleWhatIf = (id: string) => {
    setWhatIfEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allMitigationsEnabled = hack.mitigations.every((_, i) =>
    whatIfEnabled.has(String(i))
  );

  return (
    <div className="py-6 space-y-8">
      {/* Mitigations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-green-400" />
          <h2 className="text-sm font-semibold text-foreground">Mitigations for {hack.title}</h2>
        </div>
        <div className="space-y-2">
          {hack.mitigations.map((m, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/50 bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedMit(expandedMit === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
              >
                <span className="w-5 h-5 rounded bg-green-400/20 border border-green-400/30 flex items-center justify-center text-[10px] font-bold text-green-400 shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold text-foreground flex-1">{m.category}</span>
                {expandedMit === i
                  ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                }
              </button>
              {expandedMit === i && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                  {m.code && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Code2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Example Fix</span>
                      </div>
                      <pre className="bg-black/50 border border-border/50 rounded p-3 text-[11px] font-mono text-green-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {m.code}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* What-If Defender Mode */}
      <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-foreground">What-If Defender Mode</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Toggle each mitigation to simulate whether the attack would have succeeded.
        </p>
        <div className="space-y-2 mb-4">
          {hack.mitigations.map((m, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <button
                onClick={() => toggleWhatIf(String(i))}
                className={`w-8 h-4 rounded-full border transition-all relative shrink-0
                  ${whatIfEnabled.has(String(i))
                    ? "bg-green-400/30 border-green-400/50"
                    : "bg-muted/50 border-border"
                  }`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all
                  ${whatIfEnabled.has(String(i)) ? "left-4 bg-green-400" : "left-0.5 bg-muted-foreground"}`} />
              </button>
              <span className={`text-xs ${whatIfEnabled.has(String(i)) ? "text-green-400" : "text-muted-foreground"}`}>
                {m.category}
              </span>
            </label>
          ))}
        </div>
        <div className={`rounded p-3 text-xs font-medium border ${allMitigationsEnabled
          ? "bg-green-400/10 border-green-400/30 text-green-400"
          : whatIfEnabled.size > 0
          ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
          : "bg-red-400/10 border-red-400/30 text-red-400"
        }`}>
          {allMitigationsEnabled
            ? `✅ With all mitigations active, the ${hack.title} attack would very likely have been prevented.`
            : whatIfEnabled.size > 0
            ? `⚠️ Partial mitigations may reduce impact but the core attack vector remains. Enable all mitigations to fully prevent the exploit.`
            : `🔴 Without mitigations, the ${hack.title} attack proceeds as documented — ${hack.impact} drained.`
          }
        </div>
      </div>
    </div>
  );
}
