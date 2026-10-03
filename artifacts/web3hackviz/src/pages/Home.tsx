"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion, animate } from "framer-motion";
import { hacks, availableYears } from "@/data/hacks";
import { getHackSortDate } from "@/lib/hack-dates";
import {
  formatHackChains,
  getAvailableChains,
  hackMatchesChain,
  hackMatchesChainSearch,
} from "@/lib/hack-chains";
import { HackCard } from "@/components/HackCard";
import { FilterBar } from "@/components/home/FilterBar";
import { ActiveFilters } from "@/components/home/ActiveFilters";
import { Hero } from "@/components/home/Hero";
import {
  fadeUp,
  staggerContainer,
  cardItem,
  motionSafe,
} from "@/components/home/motion";
import {
  Filter,
  AlertTriangle,
  Zap,
  DollarSign,
  Calendar,
  ArrowDownUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  "Logic Error",
];

const PAGE_SIZE = 9;

type SortOrder = "newest" | "oldest" | "highest" | "lowest" | "default";

function formatBig(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

function useAnimatedNumber(target: number, reduced: boolean | null, format: (n: number) => string) {
  const [display, setDisplay] = useState(format(target));

  useEffect(() => {
    if (reduced) {
      setDisplay(format(target));
      return;
    }
    const controls = animate(0, target, {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [target, reduced, format]);

  return display;
}

export default function HomePage() {
  const reduced = useReducedMotion();
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedYear, selectedType, selectedChain, sortOrder]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const canCollapse = visibleCount > PAGE_SIZE;

  const yearHacks = useMemo(
    () => (selectedYear ? hacks.filter((h) => h.year === selectedYear) : hacks),
    [selectedYear],
  );
  const totalImpact = yearHacks.reduce((s, h) => s + h.impactUSD, 0);
  const biggestHack = yearHacks.length
    ? yearHacks.reduce((a, b) => (a.impactUSD > b.impactUSD ? a : b))
    : null;

  const yearRange = useMemo(() => {
    const years = hacks.map((h) => h.year);
    return `${Math.min(...years)}–${Math.max(...years)}`;
  }, []);

  const formatCount = useMemo(() => (n: number) => String(Math.round(n)), []);
  const formatImpact = useMemo(() => (n: number) => formatBig(n), []);
  const animatedCount = useAnimatedNumber(yearHacks.length, reduced, formatCount);
  const animatedImpact = useAnimatedNumber(totalImpact, reduced, formatImpact);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedYear(null);
    setSelectedType(null);
    setSelectedChain(null);
  };

  const sortOptions: {
    id: SortOrder;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      id: "newest",
      label: "Newest",
      shortLabel: "Newest",
      icon: <ArrowDownUp className="h-3 w-3" />,
      activeClass: "bg-primary/20 text-primary",
    },
    {
      id: "oldest",
      label: "Oldest",
      shortLabel: "Oldest",
      icon: <ArrowDownUp className="h-3 w-3 rotate-180" />,
      activeClass: "bg-primary/20 text-primary",
    },
    {
      id: "highest",
      label: "Most drained",
      shortLabel: "Most $",
      icon: <DollarSign className="h-3 w-3" />,
      activeClass: "bg-red-500/20 text-red-400",
    },
    {
      id: "lowest",
      label: "Least drained",
      shortLabel: "Least $",
      icon: <DollarSign className="h-3 w-3 rotate-180" />,
      activeClass: "bg-green-500/20 text-green-400",
    },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Hero />

      {/* Stats */}
      <motion.section
        className="mb-10"
        initial={reduced ? false : "hidden"}
        animate="show"
        variants={fadeUp}
        transition={motionSafe(reduced, { delay: 0.1 })}
      >
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Stats for:</span>
          </div>
          {([null, ...availableYears] as (number | null)[]).map((y) => (
            <button
              key={y ?? "all"}
              type="button"
              onClick={() => setSelectedYear(y)}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-semibold transition-all",
                selectedYear === y
                  ? "border-primary/50 bg-primary/20 text-primary shadow-[0_0_8px_rgba(0,255,255,0.2)]"
                  : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {y ?? "All years"}
            </button>
          ))}
        </div>

        <motion.div
          className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4"
          variants={staggerContainer}
          initial={reduced ? false : "hidden"}
          animate="show"
        >
          <StatCard
            icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            label="Total Exploits"
            value={animatedCount}
            sub={selectedYear ? `in ${selectedYear}` : yearRange}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4 text-red-400" />}
            label="Total Drained"
            value={animatedImpact}
            sub={selectedYear ? `in ${selectedYear}` : yearRange}
            highlight
          />
          <StatCard
            icon={<Zap className="h-4 w-4 text-yellow-400" />}
            label="Biggest Hack"
            value={biggestHack ? biggestHack.title : "—"}
            sub={biggestHack ? biggestHack.impact : undefined}
          />
          <StatCard
            icon={<Calendar className="h-4 w-4 text-cyan-400" />}
            label="Coverage"
            value={selectedYear ? String(selectedYear) : yearRange}
            sub={selectedYear ? "selected year" : "all exploits"}
          />
        </motion.div>
      </motion.section>

      {/* Filter bar */}
      <motion.div
        className="mb-4"
        initial={reduced ? false : "hidden"}
        animate="show"
        variants={fadeUp}
        transition={motionSafe(reduced, { delay: 0.15 })}
      >
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          types={ALL_TYPES}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          chains={availableChains}
          selectedChain={selectedChain}
          onChainChange={setSelectedChain}
        />
      </motion.div>

      <div className="mb-4">
        <ActiveFilters
          year={selectedYear}
          chain={selectedChain}
          type={selectedType}
          search={search}
          onClearYear={() => setSelectedYear(null)}
          onClearChain={() => setSelectedChain(null)}
          onClearType={() => setSelectedType(null)}
          onClearSearch={() => setSearch("")}
          onClearAll={clearAllFilters}
        />
      </div>

      {/* Results toolbar */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {Math.min(visibleCount, filtered.length)}
            </span>{" "}
            of {filtered.length} exploits
            {filtered.length !== hacks.length ? (
              <span className="text-muted-foreground/80"> · {hacks.length} total</span>
            ) : null}
          </span>
        </div>

        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            role="group"
            aria-label="Sort exploits"
            className="inline-flex w-max min-w-full rounded-lg border border-border/50 bg-muted/30 p-0.5 sm:min-w-0"
          >
            {sortOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortOrder(sortOrder === opt.id ? "default" : opt.id)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all sm:flex-none sm:py-1.5",
                  sortOrder === opt.id
                    ? opt.activeClass
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.icon}
                <span className="sm:hidden">{opt.shortLabel}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p>No exploits match your filters.</p>
        </div>
      ) : (
        <>
          <motion.div
            id="exploit-grid"
            className="grid scroll-mt-6 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={staggerContainer}
            initial={reduced ? false : "hidden"}
            animate="show"
            key={`${selectedYear}-${selectedChain}-${selectedType}-${search}-${sortOrder}`}
          >
            <AnimatePresence mode="popLayout">
              {visible.map((hack) => (
                <motion.div
                  key={hack.id}
                  layout={!reduced}
                  variants={cardItem}
                  initial={reduced ? false : "hidden"}
                  animate="show"
                  exit="exit"
                  transition={motionSafe(reduced)}
                >
                  <HackCard hack={hack} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {(hasMore || canCollapse) && (
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
              {hasMore && (
                <motion.button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  whileHover={reduced ? undefined : { scale: 1.02 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  className="w-full rounded-lg border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-medium text-primary transition-colors hover:border-primary/60 hover:bg-primary/20 hover:shadow-[0_0_12px_rgba(0,255,255,0.2)] sm:w-auto sm:py-2.5"
                >
                  Load more
                  <span className="ml-2 text-xs text-primary/70">
                    ({Math.min(PAGE_SIZE, filtered.length - visibleCount)} more)
                  </span>
                </motion.button>
              )}
              {canCollapse && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setVisibleCount(PAGE_SIZE);
                    document
                      .getElementById("exploit-grid")
                      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                  }}
                  whileHover={reduced ? undefined : { scale: 1.02 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  className="w-full rounded-lg border border-border/60 bg-muted/40 px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground sm:w-auto sm:py-2.5"
                >
                  Collapse
                </motion.button>
              )}
            </div>
          )}
        </>
      )}

      {filtered.length < hacks.length && filtered.length > 0 && (
        <div className="mt-8 rounded-lg border border-border/50 bg-muted/20 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
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

      <footer className="mt-16 border-t border-border/50 pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          HackViz — Defensive learning only. All data sourced from public post-mortems and block
          explorers. This platform does not encourage or facilitate any malicious activity,
          developed by{" "}
          <a
            href="https://shredsecurity.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-red-400 transition-colors hover:text-red-300"
          >
            Shred Security
          </a>
          .
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={fadeUp}
      whileHover={reduced ? undefined : { y: -2 }}
      className={cn(
        "rounded-lg border bg-card p-2.5 transition-shadow sm:p-3",
        highlight ? "border-red-500/30" : "border-border/50",
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "truncate font-mono text-base font-bold sm:text-lg",
          highlight ? "text-red-400" : "text-foreground",
        )}
        title={value}
      >
        {value}
      </div>
      {sub && (
        <div className="truncate text-[10px] text-muted-foreground" title={sub}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}
