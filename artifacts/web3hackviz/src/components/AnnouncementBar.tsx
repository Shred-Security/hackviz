const FUNDING_URL =
  "https://initiatives.thedao.fund/initiative/hackviz-interactive-real-world-ethereum-exploit-learning-san";

function Message({ decorative = false }: { decorative?: boolean }) {
  return (
    <span aria-hidden={decorative || undefined} className="flex shrink-0 items-center gap-3 px-6">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,255,255,0.8)]" />
      <span>
        We&apos;re raising funds through the{" "}
        <span className="font-semibold text-foreground">TheDAO Security Fund</span> to improve
        HackViz with interactive learning from real-world Ethereum exploits free and open for everyone.
      </span>
      <a
        href={FUNDING_URL}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={decorative ? -1 : undefined}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        Donate →
      </a>
    </span>
  );
}

export function AnnouncementBar() {
  return (
    <div
      role="region"
      aria-label="Fundraising announcement"
      className="announcement-bar group relative overflow-hidden border-b border-primary/20 bg-primary/10 py-2 text-xs text-muted-foreground"
    >
      <div className="announcement-track flex w-max group-hover:[animation-play-state:paused]">
        <Message />
        <Message decorative />
        <Message decorative />
        <Message decorative />
      </div>
    </div>
  );
}
