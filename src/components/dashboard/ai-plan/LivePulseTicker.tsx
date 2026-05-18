import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Video, Telescope, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePulseTickerProps {
  className?: string;
}

type Mode = "GENIE" | "SAGE" | "INSIGHTS" | "CATALOGUE";

interface TickerEvent {
  id: number;
  mode: Mode;
  copy: string;
  /** Minutes ago at component load. Used to compute display age live. */
  minutesAgo: number;
}

const MODE_ICON: Record<Mode, LucideIcon> = {
  GENIE: Wand2,
  SAGE: Video,
  INSIGHTS: Telescope,
  CATALOGUE: Building2,
};

const MODE_TINT: Record<Mode, string> = {
  GENIE: "text-primary",
  SAGE: "text-foreground/70",
  INSIGHTS: "text-foreground/70",
  CATALOGUE: "text-foreground/70",
};

/* ── Source events ──
   minutesAgo is what makes "live" credible — we compute the display
   string from it each render so refreshes never show 2m forever. */
const EVENTS: TickerEvent[] = [
  { id: 1, mode: "GENIE",     copy: "Boat · 4 UGC scripts generated",                       minutesAgo: 2 },
  { id: 2, mode: "INSIGHTS",  copy: "New competitor ad surfaced · Sleepyhead",               minutesAgo: 8 },
  { id: 3, mode: "SAGE",      copy: "Mamaearth hook analyzed · 23% completion lift",         minutesAgo: 17 },
  { id: 4, mode: "CATALOGUE", copy: "Brand voice updated · Boat",                             minutesAgo: 32 },
  { id: 5, mode: "GENIE",     copy: "Forged 10 variants · Mamaearth hero ad",                 minutesAgo: 60 },
  { id: 6, mode: "INSIGHTS",  copy: "Pinned competitor hook · Sleepyhead lifestyle 0.7s",    minutesAgo: 120 },
  { id: 7, mode: "GENIE",     copy: "Used generation · UGC Video v3 for Mamaearth",          minutesAgo: 180 },
  { id: 8, mode: "SAGE",      copy: "Saved insight · Hook lands at 0.7s",                     minutesAgo: 240 },
];

const ROTATE_MS = 4500;

function ageLabel(minutesAgo: number, sessionStart: number): string {
  const elapsed = Math.floor((Date.now() - sessionStart) / 60000);
  const m = minutesAgo + elapsed;
  if (m < 1) return "just now";
  if (m === 1) return "1 min ago";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h === 1) return "1 hour ago";
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

/**
 * LivePulseTicker — calmer iter (post ui-ux-pro-max critique).
 *
 * Prior version auto-scrolled horizontally — unreadable (items
 * passed faster than the eye could parse). Pause-on-hover was a
 * recovery, not a feature.
 *
 * This iter: a STATIONARY single-event display that crossfades to
 * the next event every ~4.5s. One event visible at a time, fully
 * readable. Pause on hover still respected (operator can land on
 * an event without it disappearing). Ages computed dynamically from
 * session-start offset so they slide forward as the user dwells on
 * the dashboard.
 *
 * Reference: Apple Stock ticker on macOS (stationary swap), Linear's
 * bottom-status-bar live indicator (anchored pulse + readable text).
 */
export function LivePulseTicker({ className }: LivePulseTickerProps) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const sessionStart = useMemo(() => Date.now(), []);

  /* Auto-advance unless paused */
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % EVENTS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const event = EVENTS[idx];
  const Icon = MODE_ICON[event.mode];

  return (
    <div
      className={cn(
        "group relative h-[68px] w-full overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 flex items-center px-5 gap-4">
        {/* LIVE indicator — pulse-ring anchor */}
        <div className="shrink-0 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-primary" />
            <motion.span
              aria-hidden
              className="absolute inline-flex h-2 w-2 rounded-full border-2 border-primary"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Live
          </span>
          <span className="h-4 w-px bg-border" />
        </div>

        {/* Rotating event slot */}
        <div className="relative flex-1 min-h-[40px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 flex items-center gap-3"
            >
              {/* Mode chip */}
              <span
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5",
                  "font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("h-3 w-3", MODE_TINT[event.mode])}
                  strokeWidth={2.2}
                />
                {event.mode}
              </span>

              {/* Copy */}
              <p className="flex-1 truncate text-[12.5px] text-foreground">
                {event.copy}
              </p>

              {/* Age */}
              <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground tabular-nums">
                {ageLabel(event.minutesAgo, sessionStart)}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Position dots — operator's way of seeing N-of-M without reading */}
        <div className="shrink-0 flex items-center gap-1">
          {EVENTS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Jump to event ${i + 1} of ${EVENTS.length}`}
              className={cn(
                "h-1 rounded-full transition-all",
                i === idx ? "w-4 bg-primary" : "w-1 bg-border hover:bg-foreground/30",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
