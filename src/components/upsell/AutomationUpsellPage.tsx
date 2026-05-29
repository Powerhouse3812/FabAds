import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Feed data ────────────────────────────────────────────────────────────────

type ActionType = "PAUSED" | `SCALED ${string}` | "ROTATED";

interface FeedEntry {
  dotColor: string;
  time: string;
  action: ActionType;
  description: string;
}

const FEED_ENTRIES: FeedEntry[] = [
  {
    dotColor: "bg-amber-500",
    time: "14:32:01",
    action: "PAUSED",
    description: "Boat TWS — ROAS 0.8 · below floor",
  },
  {
    dotColor: "bg-emerald-500",
    time: "14:28:44",
    action: "SCALED +20%",
    description: "Vitamin C Serum — CTR 4.1%",
  },
  {
    dotColor: "bg-blue-400",
    time: "14:15:22",
    action: "ROTATED",
    description: "Mamaearth Q2 — 3rd show, fatigue",
  },
  {
    dotColor: "bg-amber-500",
    time: "14:09:17",
    action: "PAUSED",
    description: "Noise ColorFit — ROAS 0.6 · below floor",
  },
  {
    dotColor: "bg-emerald-500",
    time: "13:58:30",
    action: "SCALED +15%",
    description: "Sleepyhead Sleep — CTR 3.8%",
  },
  {
    dotColor: "bg-amber-500",
    time: "13:41:12",
    action: "PAUSED",
    description: "Mensa Gifting — ROAS 0.9 · below floor",
  },
  {
    dotColor: "bg-blue-400",
    time: "13:22:05",
    action: "ROTATED",
    description: "Boat TWS v2 — 4th show, fatigue",
  },
];

// ─── FeedRow ──────────────────────────────────────────────────────────────────

function FeedRow({ entry }: { entry: FeedEntry }) {
  const { dotColor, time, action, description } = entry;

  const actionColor =
    action === "PAUSED"
      ? "text-amber-600 dark:text-amber-400"
      : action.startsWith("SCALED")
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-blue-500";

  return (
    <div className="flex items-start gap-3 px-5 py-2.5 border-b border-border/20 last:border-0">
      <span
        className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", dotColor)}
        aria-hidden
      />
      <span className="font-mono text-[9.5px] text-muted-foreground/50 tabular-nums shrink-0 w-16">
        {time}
      </span>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "font-mono text-[9px] uppercase tracking-[0.1em] font-semibold mr-1.5",
            actionColor,
          )}
        >
          {action}
        </span>
        <span className="text-[11.5px] text-foreground/60 leading-snug">
          {description}
        </span>
      </div>
    </div>
  );
}

// ─── FeedHeader ───────────────────────────────────────────────────────────────

function FeedHeader() {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
      {/* Left — pulsing dot + label */}
      <div className="flex items-center gap-2.5">
        <span className="relative inline-flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-muted-foreground/30 animate-ping"
            aria-hidden
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground/40"
            aria-hidden
          />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Automation · Event feed
        </span>
      </div>

      {/* Right — user's zero-event badge */}
      <span className="inline-flex items-center gap-1.5 rounded bg-destructive/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-destructive/70">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive/60" aria-hidden />
        Your feed · 0 events
      </span>
    </div>
  );
}

// ─── SampleFeedCol ────────────────────────────────────────────────────────────

function SampleFeedCol() {
  return (
    <div className="lg:col-span-3 border-r border-border/30 overflow-hidden flex flex-col">
      <div className="px-5 py-2.5 bg-muted/20 border-b border-border/30">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50">
          Sample · 12,000+ growth accounts
        </span>
      </div>
      {FEED_ENTRIES.map((entry) => (
        <FeedRow key={`${entry.time}-${entry.action}`} entry={entry} />
      ))}
    </div>
  );
}

// ─── EmptyFeedCol ─────────────────────────────────────────────────────────────

function EmptyFeedCol() {
  return (
    <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4 px-6 py-10 bg-muted/[0.04]">
      {/* Ghost rows */}
      <div className="flex flex-col items-center gap-1.5 opacity-30">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
            <span
              className="h-1.5 rounded bg-foreground/10"
              style={{ width: `${40 + i * 15}px` }}
            />
          </div>
        ))}
      </div>

      {/* Zero count */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
          Your feed
        </span>
        <span className="font-mono text-[28px] font-bold leading-none text-foreground/20 tabular-nums">
          0
        </span>
        <span className="text-[11.5px] text-muted-foreground/50">
          events this month
        </span>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <Link
          to="/plans-v2?tier=growth&view=trial"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[12px] font-bold text-foreground transition-colors hover:bg-primary/90"
        >
          Activate automation
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/40">
          14-day Growth trial · cancel any time
        </span>
      </div>
    </div>
  );
}

// ─── FeedBody ─────────────────────────────────────────────────────────────────

function FeedBody() {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-5">
      <SampleFeedCol />
      <EmptyFeedCol />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AutomationUpsellPage() {
  return (
    <div className="flex flex-col h-full min-h-[480px]">
      <FeedHeader />
      <FeedBody />
    </div>
  );
}
