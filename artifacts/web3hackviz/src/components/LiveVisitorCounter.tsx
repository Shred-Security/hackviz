"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hackviz-visitor-id";
const POLL_MS = 30_000;

function getVisitorId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : `v${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `ephemeral-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function formatCount(n: number) {
  return n.toLocaleString("en-US");
}

/** Quiet footer footnote — total unique visitors. */
export function LiveVisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = getVisitorId();
    let registered = false;

    async function refresh() {
      try {
        if (!registered) {
          const res = await fetch("/api/visitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
            cache: "no-store",
          });
          if (!res.ok) return;
          const data = (await res.json()) as { count?: number };
          if (!cancelled && typeof data.count === "number") {
            setCount(data.count);
            registered = true;
          }
          return;
        }

        const res = await fetch("/api/visitors", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled && typeof data.count === "number") {
          setCount(data.count);
        }
      } catch {
        // API unavailable offline / misconfigured deploy.
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (count === null) return null;

  return (
    <span className="tabular-nums" aria-label={`${formatCount(count)} visitors`}>
      {formatCount(count)} visitors
    </span>
  );
}
