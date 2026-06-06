"use client";
import { useLocation, Link } from "wouter";
import { hacks } from "@/data/hacks";
import { formatHackChains } from "@/lib/hack-chains";
import { getProgress } from "@/lib/progress";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Home,
  ChevronRight,
  Trophy,
  BookOpen,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const [progress, setProgress] = useState<Record<string, string | null>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const p: Record<string, string | null> = {};
    hacks.forEach((h) => { p[h.slug] = getProgress(h.slug); });
    setProgress(p);
  }, [location]);

  const masteredCount = Object.values(progress).filter((v) => v === "mastered").length;
  const auditedCount = Object.values(progress).filter((v) => v === "audited").length;

  // Calculate actual year range from data
  const yearRange = (() => {
    const years = hacks.map((h) => h.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return `${minYear}–${maxYear}`;
  })();

  return (
    <aside
      className={`${collapsed ? "w-14" : "w-64"} shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 h-screen sticky top-0 overflow-hidden`}
    >
      {/* Logo */}
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex flex-col items-center justify-center gap-1.5 py-4 border-b border-sidebar-border w-full hover:bg-sidebar-accent transition-colors group"
          title="Expand sidebar"
        >
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-primary glow-cyan truncate">HackViz</div>
            <div className="text-[10px] text-muted-foreground truncate">{yearRange} Exploits</div>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            title="Collapse sidebar"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}

      {/* Stats */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-muted/50 px-2 py-1.5 text-center">
              <div className="text-xs text-muted-foreground">Audited</div>
              <div className="text-sm font-bold text-cyan-400">{auditedCount}</div>
            </div>
            <div className="rounded bg-muted/50 px-2 py-1.5 text-center">
              <div className="text-xs text-muted-foreground">Mastered</div>
              <div className="text-sm font-bold text-green-400">{masteredCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <NavItem
          href="/"
          icon={<Home className="w-4 h-4" />}
          label="All Exploits"
          active={location === "/"}
          collapsed={collapsed}
        />

        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              {yearRange} Hacks
            </span>
          </div>
        )}

        {hacks.map((hack) => {
          const prog = progress[hack.slug];
          const isActive = location === `/hack/${hack.slug}`;
          return (
            <Link
              key={hack.slug}
              href={`/hack/${hack.slug}`}
              className={`flex items-center gap-2 px-3 py-2 mx-1 rounded text-xs transition-all group
                ${isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
            >
              <span className="shrink-0">
                {prog === "mastered" ? (
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                ) : prog === "audited" ? (
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-border" />
                )}
              </span>
              {!collapsed && (
                <span className="truncate leading-tight">
                  <span className="font-medium">{hack.title}</span>
                  <span className="text-muted-foreground block text-[10px] truncate">{hack.year} · {formatHackChains(hack)}</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Disclaimer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            For defensive learning only. Data from public sources.
          </p>
        </div>
      )}
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 mx-1 rounded text-sm transition-all
        ${active
          ? "bg-primary/15 text-primary border border-primary/20"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
}
