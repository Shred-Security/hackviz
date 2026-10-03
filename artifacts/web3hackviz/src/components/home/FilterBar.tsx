"use client";

import { Search } from "lucide-react";
import { typeColors } from "@/data/hacks";
import { ChainCombobox } from "@/components/home/ChainCombobox";
import { cn } from "@/lib/utils";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  types: string[];
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  chains: string[];
  selectedChain: string | null;
  onChainChange: (chain: string | null) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  types,
  selectedType,
  onTypeChange,
  chains,
  selectedChain,
  onChainChange,
}: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search exploits, chains, attack types..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-border/60 bg-muted/40 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <ChainCombobox chains={chains} value={selectedChain} onChange={onChainChange} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onTypeChange(null)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all",
            !selectedType
              ? "border-border bg-muted text-foreground"
              : "border-border/40 text-muted-foreground hover:text-foreground",
          )}
        >
          All types
        </button>
        {types.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => onTypeChange(selectedType === t ? null : t)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all",
              selectedType === t
                ? `${typeColors[t] ?? ""} opacity-100`
                : "border-border/40 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
