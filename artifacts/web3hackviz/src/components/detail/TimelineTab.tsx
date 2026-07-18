"use client";
import { useState, useEffect } from "react";
import { Hack } from "@/data/hacks";
import { Play, Pause, SkipBack, SkipForward, ChevronRight, Code, ExternalLink } from "lucide-react";
import { getExplorerTxUrl } from "@/lib/utils";

export function TimelineTab({ hack }: { hack: Hack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const steps = hack.timeline;

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const goTo = (i: number) => setCurrentStep(i);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= steps.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [playing, steps.length]);

  const step = steps[currentStep];

  return (
    <div className="py-6 space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-4">
        <button
          onClick={() => { setCurrentStep(0); setPlaying(false); }}
          className="p-1.5 rounded border border-border hover:border-border/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="p-1.5 rounded border border-border hover:border-border/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/20 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/30 transition-all"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={goNext}
          disabled={currentStep === steps.length - 1}
          className="p-1.5 rounded border border-border hover:border-border/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setCurrentStep(steps.length - 1); setPlaying(false); }}
          className="p-1.5 rounded border border-border hover:border-border/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} / {steps.length}
          </span>
          <button
            onClick={() => setShowCode((c) => !c)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-all
              ${showCode ? "bg-primary/15 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Code className="w-3 h-3" />
            Code
          </button>
        </div>
      </div>

      {/* Scrubber */}
      <div className="relative">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center">
              <button
                onClick={() => goTo(i)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 relative transition-all
                  ${i === currentStep
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_rgba(0,255,255,0.5)]"
                    : i < currentStep
                    ? "border-primary/60 bg-primary/20 text-primary"
                    : "border-border bg-card text-muted-foreground"
                  }`}
              >
                {i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-primary/60" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current step detail */}
      <div className="rounded-lg border border-primary/20 bg-card p-5 transition-all duration-300"
        style={{ boxShadow: "0 0 20px rgba(0,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
            {currentStep + 1}
          </span>
          <h3 className="text-base font-bold text-foreground">{step.phase}</h3>
          {step.timestamp && (
            <span className="ml-auto text-[10px] text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded">
              {step.timestamp}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

        {step.functionsCall.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Functions Called</div>
            <div className="flex flex-wrap gap-1.5">
              {step.functionsCall.map((f) => (
                <code key={f} className="text-[11px] font-mono bg-muted/60 border border-border/50 px-2 py-0.5 rounded text-cyan-300">
                  {f}
                </code>
              ))}
            </div>
          </div>
        )}

        {showCode && (
          <div className="mt-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Pseudocode</div>
            <pre className="bg-black/40 border border-border/50 rounded p-3 text-xs font-mono text-green-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {step.pseudocode}
            </pre>
          </div>
        )}

        {step.txns && step.txns.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Transactions</div>
            <div className="space-y-1.5">
              {step.txns.map((t) => {
                const explorerUrl = getExplorerTxUrl(t.hash, t.chain || hack.chain);
                return (
                  <a
                    key={t.hash}
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1.5 px-2 rounded bg-muted/40 border border-border/30 hover:border-primary/30 transition-colors group"
                  >
                    <span className="text-[11px] text-foreground font-medium">{t.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[300px]">{t.hash}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary shrink-0 ml-auto" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* All steps list */}
      <div className="space-y-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">All Steps</div>
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all
              ${i === currentStep
                ? "border-primary/30 bg-primary/10"
                : i < currentStep
                ? "border-border/30 bg-muted/20 opacity-70"
                : "border-border/20 bg-card/50 hover:border-border/50 hover:bg-card"
              }`}
          >
            <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5
              ${i === currentStep ? "bg-primary text-primary-foreground" : i < currentStep ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground">{s.phase}</div>
              <div className="text-[11px] text-muted-foreground truncate">{s.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
