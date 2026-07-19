"use client";
import { useMemo } from "react";
import { Hack } from "@/data/hacks";
import { formatHackChains, getHackChains } from "@/lib/hack-chains";
import { ExternalLink, ArrowRightLeft } from "lucide-react";
import { getExplorerTxUrl } from "@/lib/utils";

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (```)
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      nodes.push(
        <pre key={key++} className="bg-black/40 border border-border/50 rounded p-3 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap leading-relaxed my-3">
          {codeLines.join("\n")}
        </pre>
      );
      continue;
    }

    // Heading (##)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      nodes.push(
        <h3 key={key++} className={`font-bold text-foreground ${level === 2 ? "text-base mt-6 mb-2" : "text-sm mt-4 mb-1.5"}`}>
          {text}
        </h3>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].trimStart().startsWith("```") && !lines[i].match(/^#{1,3}\s/)) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} className="text-sm text-muted-foreground leading-relaxed my-2">
          {renderInline(paraLines.join(" "))}
        </p>
      );
    }
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold (**text**)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code (`code`)
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    let nextMatch: { index: number; length: number; type: "bold" | "code" | "link"; content: string; url?: string } | null = null;

    if (boldMatch && boldMatch.index !== undefined) {
      nextMatch = { index: boldMatch.index, length: boldMatch[0].length, type: "bold", content: boldMatch[1] };
    }
    if (codeMatch && codeMatch.index !== undefined) {
      if (!nextMatch || codeMatch.index < nextMatch.index) {
        nextMatch = { index: codeMatch.index, length: codeMatch[0].length, type: "code", content: codeMatch[1] };
      }
    }
    if (linkMatch && linkMatch.index !== undefined) {
      if (!nextMatch || linkMatch.index < nextMatch.index) {
        nextMatch = { index: linkMatch.index, length: linkMatch[0].length, type: "link", content: linkMatch[1], url: linkMatch[2] };
      }
    }

    if (!nextMatch) {
      parts.push(remaining);
      break;
    }

    if (nextMatch.index > 0) {
      parts.push(remaining.slice(0, nextMatch.index));
    }

    if (nextMatch.type === "bold") {
      parts.push(<strong key={key++} className="font-semibold text-foreground">{nextMatch.content}</strong>);
    } else if (nextMatch.type === "link") {
      parts.push(
        <a key={key++} href={nextMatch.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {nextMatch.content}
        </a>
      );
    } else {
      parts.push(
        <code key={key++} className="text-[11px] font-mono bg-muted/60 border border-border/50 px-1.5 py-0.5 rounded text-cyan-300">
          {nextMatch.content}
        </code>
      );
    }

    remaining = remaining.slice(nextMatch.index + nextMatch.length);
  }

  return parts;
}

export function OverviewTab({ hack }: { hack: Hack }) {
  const techNodes = useMemo(() => renderMarkdown(hack.technicalDesc), [hack.technicalDesc]);

  return (
    <div className="py-6 space-y-6">
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

      {/* What Happened */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">What Happened?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {hack.longDesc}
        </p>
      </div>

      {/* Technical Analysis */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Technical Analysis</h2>
        <div>{techNodes}</div>
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
