"use client";

import { X } from "lucide-react";

interface Chip {
  key: string;
  label: string;
  onClear: () => void;
}

interface Props {
  year: number | null;
  chain: string | null;
  type: string | null;
  search: string;
  onClearYear: () => void;
  onClearChain: () => void;
  onClearType: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  year,
  chain,
  type,
  search,
  onClearYear,
  onClearChain,
  onClearType,
  onClearSearch,
  onClearAll,
}: Props) {
  const chips: Chip[] = [];

  if (year !== null) {
    chips.push({ key: "year", label: String(year), onClear: onClearYear });
  }
  if (chain) {
    chips.push({ key: "chain", label: chain, onClear: onClearChain });
  }
  if (type) {
    chips.push({ key: "type", label: type, onClear: onClearType });
  }
  if (search.trim()) {
    chips.push({
      key: "search",
      label: `“${search.trim()}”`,
      onClear: onClearSearch,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
        Active
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary transition-colors hover:border-primary/50 hover:bg-primary/15"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-70" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
