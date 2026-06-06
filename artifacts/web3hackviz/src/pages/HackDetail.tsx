"use client";
import { useParams, Link } from "wouter";
import { hacksBySlug, typeColors } from "@/data/hacks";
import { formatHackChains } from "@/lib/hack-chains";
import { getProgress, setProgress } from "@/lib/progress";
import { useState, useEffect } from "react";
import { OverviewTab } from "@/components/detail/OverviewTab";
import { TimelineTab } from "@/components/detail/TimelineTab";
import { AttackFlowTab } from "@/components/detail/AttackFlowTab";
import { TokenFlowTab } from "@/components/detail/TokenFlowTab";
import { LessonsTab } from "@/components/detail/LessonsTab";
import { QuizTab } from "@/components/detail/QuizTab";
import {
  ArrowLeft, BookOpen, Trophy, Share2, ExternalLink,
  AlertTriangle, LayoutGrid, GitBranch, Activity, Shield, HelpCircle, Clock,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "attackflow", label: "Attack Flow", icon: GitBranch },
  { id: "tokenflow", label: "Token Flow", icon: Activity },
  { id: "lessons", label: "Lessons", icon: Shield },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
];

export default function HackDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const hack = hacksBySlug[slug];
  const [tab, setTab] = useState("overview");
  const [progress, setProgressState] = useState<string | null>(null);

  useEffect(() => {
    setProgressState(getProgress(slug));
  }, [slug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        setTab((t) => {
          const idx = TABS.findIndex((x) => x.id === t);
          return TABS[(idx + 1) % TABS.length].id;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!hack) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Hack not found: <code className="text-primary">{slug}</code></p>
          <Link href="/" className="text-primary hover:underline">← Back to all exploits</Link>
        </div>
      </div>
    );
  }

  const handleMarkAudited = () => {
    const next = progress === "audited" ? null : "audited";
    setProgress(slug, next);
    setProgressState(next);
  };

  const handleMarkMastered = () => {
    const next = progress === "mastered" ? null : "mastered";
    setProgress(slug, next);
    setProgressState(next);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  return (
    <div className="min-h-screen">
      {/* Back bar */}
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Exploits
          </Link>
          <span className="text-border">·</span>
          <span className="text-xs text-foreground font-medium">{hack.title}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden md:block">Space = next tab</span>
            <button
              onClick={handleMarkAudited}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all
                ${progress === "audited" || progress === "mastered"
                  ? "bg-cyan-400/20 border-cyan-400/40 text-cyan-400"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
                }`}
            >
              <BookOpen className="w-3 h-3" />
              Audited
            </button>
            <button
              onClick={handleMarkMastered}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all
                ${progress === "mastered"
                  ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-400"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
                }`}
            >
              <Trophy className="w-3 h-3" />
              Mastered
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border/50 text-muted-foreground hover:text-foreground transition-all"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {hack.type.map((t) => (
                <span
                  key={t}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeColors[t] ?? "text-gray-400 border-gray-400/30 bg-gray-400/10"}`}
                >
                  {t}
                </span>
              ))}
              <span className="text-[10px] text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded">
                {hack.year} · {formatHackChains(hack)}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {hack.title}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{hack.subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-red-400" style={{ textShadow: "0 0 20px rgba(255,60,60,0.4)" }}>
              {hack.impact}
            </div>
            <div className="text-xs text-muted-foreground">Total Drained</div>
            {hack.contracts.length > 0 && (
              <a
                href={hack.contracts[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
              >
                View on Explorer
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border/50 overflow-x-auto pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap
                ${tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {tab === "overview" && <OverviewTab hack={hack} />}
        {tab === "timeline" && <TimelineTab hack={hack} />}
        {tab === "attackflow" && <AttackFlowTab hack={hack} />}
        {tab === "tokenflow" && <TokenFlowTab hack={hack} />}
        {tab === "lessons" && <LessonsTab hack={hack} />}
        {tab === "quiz" && <QuizTab hack={hack} onMastered={() => { setProgress(slug, "mastered"); setProgressState("mastered"); }} />}
      </div>
    </div>
  );
}
