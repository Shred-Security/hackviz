"use client";
import { useState, useMemo } from "react";
import { hacks, typeColors, availableYears } from "@/data/hacks";
import { getHackSortDate } from "@/lib/hack-dates";
import {
  formatHackChains,
  getAvailableChains,
  hackMatchesChain,
  hackMatchesChainSearch,
} from "@/lib/hack-chains";
import { HackCard } from "@/components/HackCard";
import {
  Search,
  Filter,
  AlertTriangle,
  Zap,
  DollarSign,
  Calendar,
  ArrowDownUp,
} from "lucide-react";

const ALL_TYPES = [
  "Reentrancy",
  "Flash Loan",
  "Bridge",
  "Governance",
  "Access Control",
  "Oracle Manipulation",
  "Math Bug",
  "Integer Overflow",
  "Supply Chain",
];

function formatBig(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest" | "default">("newest");

  const availableChains = useMemo(() => getAvailableChains(hacks), []);

  const filtered = useMemo(() => {
    let result = hacks.filter((h) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        h.title.toLowerCase().includes(q) ||
        formatHackChains(h).toLowerCase().includes(q) ||
        hackMatchesChainSearch(h, q) ||
        h.type.some((t) => t.toLowerCase().includes(q)) ||
        h.shortDesc.toLowerCase().includes(q);
      const matchYear = !selectedYear || h.year === selectedYear;
      const matchType = !selectedType || h.type.includes(selectedType);
      const matchChain = hackMatchesChain(h, selectedChain);
      return matchSearch && matchYear && matchType && matchChain;
    });

    // Apply sorting
    if (sortOrder === "newest") {
      result = [...result].sort(
        (a, b) => getHackSortDate(b) - getHackSortDate(a) || b.impactUSD - a.impactUSD,
      );
    } else if (sortOrder === "oldest") {
      result = [...result].sort(
        (a, b) => getHackSortDate(a) - getHackSortDate(b) || a.impactUSD - b.impactUSD,
      );
    } else if (sortOrder === "highest") {
      result = [...result].sort((a, b) => b.impactUSD - a.impactUSD);
    } else if (sortOrder === "lowest") {
      result = [...result].sort((a, b) => a.impactUSD - b.impactUSD);
    }

    return result;
  }, [search, selectedYear, selectedType, selectedChain, sortOrder]);

  const yearHacks = useMemo(
    () => (selectedYear ? hacks.filter((h) => h.year === selectedYear) : hacks),
    [selectedYear],
  );
  const totalImpact = yearHacks.reduce((s, h) => s + h.impactUSD, 0);
  const biggestHack = yearHacks.length
    ? yearHacks.reduce((a, b) => (a.impactUSD > b.impactUSD ? a : b))
    : null;

  // Calculate actual year range from data
  const yearRange = useMemo(() => {
    const years = hacks.map((h) => h.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return `${minYear}–${maxYear}`;
  }, []);

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Defensive Learning Platform
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-1">
          <span className="glow-cyan">Hack</span>
          <span className="text-foreground/80">Viz</span>
        </h1>
        <p className="text-xs text-muted-foreground/60 font-mono mb-3">
          A{" "}
          <a href="https://shredsec.xyz" target="_blank" rel="noopener noreferrer" className="text-red-400/80 hover:text-red-300 transition-colors">
            Shred Security
          </a>{" "}
          product, built for the community
        </p>
        <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
          Simulate and learn every exploit. Visualize smart contract
          drains, bridge hacks, flash loans, oracle manipulations, and
          governance attacks. Learn how to hunt and secure the blockchain.
        </p>

        {/* Year selector above stats */}
        <div className="flex items-center gap-2 mt-6 mb-3">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Stats for:</span>
          <div className="flex gap-1.5">
            {([null, ...availableYears] as (number | null)[]).map((y) => (
              <button
                key={y ?? "all"}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 rounded text-xs font-semibold border transition-all
                  ${selectedYear === y
                    ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_8px_rgba(0,255,255,0.2)]"
                    : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                {y ?? "All Years"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards — reactive to selected year */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            label="Total Exploits"
            value={`${yearHacks.length}`}
            sub={selectedYear ? `in ${selectedYear}` : yearRange}
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4 text-red-400" />}
            label="Total Drained"
            value={formatBig(totalImpact)}
            sub={selectedYear ? `in ${selectedYear}` : yearRange}
            highlight
          />
          <StatCard
            icon={<Zap className="w-4 h-4 text-yellow-400" />}
            label="Biggest Hack"
            value={biggestHack ? biggestHack.title : "—"}
            sub={biggestHack ? biggestHack.impact : undefined}
          />
          <StatCard
            icon={<Calendar className="w-4 h-4 text-cyan-400" />}
            label="Coverage"
            value={selectedYear ? String(selectedYear) : yearRange}
            sub={selectedYear ? "selected year" : "all exploits"}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search exploits, chains, attack types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>

      </div>

      {/* Chain filter */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setSelectedChain(null)}
          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all
            ${!selectedChain ? "bg-muted border-border text-foreground" : "border-border/50 text-muted-foreground hover:text-foreground"}`}
        >
          All Chains
        </button>
        {availableChains.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedChain(selectedChain === c ? null : c)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all
              ${
                selectedChain === c
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "border-border/40 text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100"
              }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all
            ${!selectedType ? "bg-muted border-border text-foreground" : "border-border/50 text-muted-foreground hover:text-foreground"}`}
        >
          All Types
        </button>
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(selectedType === t ? null : t)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all
              ${
                selectedType === t
                  ? typeColors[t] + " opacity-100"
                  : "border-border/40 text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Sort filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "default" : "newest")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all
              ${
                sortOrder === "newest"
                  ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_8px_rgba(0,255,255,0.2)]"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
          >
            <ArrowDownUp className="w-3 h-3" />
            Newest
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === "oldest" ? "default" : "oldest")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all
              ${
                sortOrder === "oldest"
                  ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_8px_rgba(0,255,255,0.2)]"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
          >
            <ArrowDownUp className="w-3 h-3 rotate-180" />
            Oldest
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === "highest" ? "default" : "highest")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all
              ${
                sortOrder === "highest"
                  ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
          >
            <DollarSign className="w-3 h-3" />
            Most Drained
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === "lowest" ? "default" : "lowest")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all
              ${
                sortOrder === "lowest"
                  ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.2)]"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
          >
            <DollarSign className="w-3 h-3 rotate-180" />
            Least Drained
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="text-foreground font-medium">{filtered.length}</span>{" "}
          of {hacks.length} exploits
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No exploits match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((hack) => (
            <HackCard key={hack.id} hack={hack} />
          ))}
        </div>
      )}

      {/* Similar exploits suggestion */}
      {filtered.length < hacks.length && filtered.length > 0 && (
        <div className="mt-8 p-4 rounded-lg border border-border/50 bg-muted/20">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Similar exploits you might want to review:
          </p>
          <div className="flex flex-wrap gap-2">
            {hacks
              .filter((h) => !filtered.includes(h))
              .slice(0, 4)
              .map((h) => (
                <a
                  key={h.slug}
                  href={`/hack/${h.slug}`}
                  className="text-xs text-primary hover:underline"
                >
                  {h.title} ({h.year})
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          HackViz — Defensive learning only. All data sourced from public
          post-mortems and block explorers. This platform does not encourage or
          facilitate any malicious activity, developed by <a href="https://shredsec.xyz" target="_blank" rel="noopener noreferrer" className="text-red-400 font-semibold hover:text-red-300 transition-colors">Shred Security</a>.
        </p>
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 bg-card ${highlight ? "border-red-500/30" : "border-border/50"}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div
        className={`text-lg font-bold font-mono ${highlight ? "text-red-400" : "text-foreground"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
