import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const CAMPAIGNS = [
  {
    initial: "M",
    from: "#FFE4D6",
    to: "#F5C9B8",
    ink: "#5A3320",
    name: "Mamaearth Vitamin C — Q2",
    ads: 12,
    platform: "Meta",
  },
  {
    initial: "N",
    from: "#FFE9F0",
    to: "#F7C8DC",
    ink: "#5A1F36",
    name: "Noise ColorFit — Wearables",
    ads: 8,
    platform: "TikTok",
  },
  {
    initial: "B",
    from: "#1F2937",
    to: "#374151",
    ink: "#F9FAFB",
    name: "Boat TWS Series — Monsoon",
    ads: 15,
    platform: "Meta",
  },
  {
    initial: "S",
    from: "#E5F0FF",
    to: "#C9DDF7",
    ink: "#1F3A66",
    name: "Sleepyhead — Sleep Better",
    ads: 6,
    platform: "NB",
  },
  {
    initial: "M",
    from: "#EAF7D8",
    to: "#D2EAB1",
    ink: "#3A4A1F",
    name: "Mensa Brands — Gifting",
    ads: 6,
    platform: "Meta",
  },
] as const;

// ─── Left panel ───────────────────────────────────────────────────────────────

function LeftQueuePanel() {
  return (
    <div className="flex-1 overflow-hidden border-r border-border/40 flex flex-col">
      {/* Table header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-muted/30">
        <span className="w-5" />
        <span className="flex-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Campaign
        </span>
        <span className="w-20 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 text-right">
          Ads
        </span>
        <span className="w-24 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 text-right">
          Status
        </span>
        <span className="w-20 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 text-right">
          Platform
        </span>
      </div>

      {/* Campaign rows */}
      {CAMPAIGNS.map((c, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-3 border-b border-border/30 last:border-0"
        >
          {/* Checkbox placeholder */}
          <span
            className="h-3.5 w-3.5 shrink-0 rounded border border-border/60 bg-card"
            aria-hidden
          />

          {/* Brand avatar + name */}
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold"
              style={{
                background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
                color: c.ink,
              }}
              aria-hidden
            >
              {c.initial}
            </span>
            <span className="text-[12.5px] font-medium text-foreground truncate">
              {c.name}
            </span>
          </div>

          {/* Ads count */}
          <span className="w-20 font-mono text-[11.5px] tabular-nums text-foreground text-right">
            {c.ads}
          </span>

          {/* Status badge */}
          <div className="w-24 flex justify-end">
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/12 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Queued
            </span>
          </div>

          {/* Platform */}
          <span className="w-20 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 text-right">
            {c.platform}
          </span>
        </div>
      ))}

      {/* Bottom strip */}
      <div className="px-5 py-2.5 bg-muted/20 border-t border-border/30 mt-auto">
        <span className="font-mono text-[10px] text-muted-foreground/60">
          + 42 more campaigns queued · dispatch blocked on AI plan
        </span>
      </div>
    </div>
  );
}

// ─── Right rail ───────────────────────────────────────────────────────────────

function RightActionRail() {
  return (
    <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-5 px-6 py-8 bg-card">
      {/* Eyebrow */}
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
        Upgrade · Launch
      </p>

      {/* Stat */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[36px] font-bold leading-none tabular-nums text-foreground">
          47
        </span>
        <span className="text-[12px] text-muted-foreground leading-snug">
          ads queued.
          <br />
          None dispatched.
        </span>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Link
          to="/plans-v2?tier=growth&view=trial"
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-primary/90"
        >
          Start 14-day Growth trial
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 text-center">
          No card required · cancel any time
        </span>
      </div>

      {/* Platform availability */}
      <div className="mt-auto flex flex-col gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50">
          3 platforms ready
        </p>
        <div className="flex items-center gap-2">
          {["Meta", "TikTok", "NewsBreak"].map((p) => (
            <span
              key={p}
              className="rounded-md bg-muted/40 px-2 py-1 font-mono text-[10px] text-foreground/60"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LaunchUpsellPage() {
  return (
    <div className="flex h-full min-h-[420px] flex-col lg:flex-row">
      <LeftQueuePanel />
      <RightActionRail />
    </div>
  );
}
