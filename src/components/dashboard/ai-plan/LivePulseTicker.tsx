import { motion } from "framer-motion";
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
  time: string;
}

const MODE_ICON: Record<Mode, LucideIcon> = {
  GENIE: Wand2,
  SAGE: Video,
  INSIGHTS: Telescope,
  CATALOGUE: Building2,
};

const EVENTS: TickerEvent[] = [
  { id: 1, mode: "GENIE",     copy: "Boat · 4 UGC scripts generated",                    time: "2m" },
  { id: 2, mode: "INSIGHTS",  copy: "New competitor ad surfaced · Sleepyhead",            time: "8m" },
  { id: 3, mode: "SAGE",      copy: "Mamaearth hook analyzed · 23% completion",           time: "17m" },
  { id: 4, mode: "CATALOGUE", copy: "Brand voice updated · Boat",                          time: "32m" },
  { id: 5, mode: "GENIE",     copy: "Forged 10 variants · Mamaearth hero ad",              time: "1h" },
  { id: 6, mode: "INSIGHTS",  copy: "Pinned competitor hook · Sleepyhead lifestyle 0.7s", time: "2h" },
  { id: 7, mode: "GENIE",     copy: "Used generation · UGC Video v3 for Mamaearth",       time: "3h" },
  { id: 8, mode: "SAGE",      copy: "Saved insight · Hook lands at 0.7s",                  time: "4h" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function LivePulseTicker({ className }: LivePulseTickerProps) {
  const loop = [...EVENTS, ...EVENTS];

  return (
    <div
      className={cn(
        "group relative h-[68px] w-full overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      {/* Left fixed LIVE indicator */}
      <div className="absolute inset-y-0 left-0 z-20 flex items-center gap-3 bg-card pl-4 pr-4">
        <div className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          <motion.span
            aria-hidden
            className="absolute inline-flex h-2.5 w-2.5 rounded-full border-2 border-primary"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Live
        </span>
        <span className="h-1/2 w-px bg-muted-foreground/20" />
      </div>

      {/* Gradient edge masks */}
      <div className="pointer-events-none absolute inset-y-0 left-[88px] z-10 w-12 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-card to-transparent" />

      {/* Scrolling track */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-y-0 left-[100px] right-0 flex items-center overflow-hidden"
      >
        <div className="ticker-scroll flex w-max items-center gap-6 group-hover:[animation-play-state:paused]">
          {loop.map((event, idx) => {
            const Icon = MODE_ICON[event.mode];
            const isLatest = idx % EVENTS.length === 0;
            return (
              <motion.div
                key={`${event.id}-${idx}`}
                variants={itemVariants}
                className={cn(
                  "flex h-12 w-[300px] shrink-0 items-center gap-3 rounded-xl border bg-card/50 pl-3 pr-3.5",
                  isLatest ? "border-l-2 border-l-primary border-border" : "border-border",
                )}
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-1.5 py-0.5">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      event.mode === "GENIE" ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {event.mode}
                  </span>
                </span>
                <p className="flex-1 truncate text-[12.5px] text-foreground">
                  {event.copy}
                </p>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[10px] tabular-nums",
                    isLatest ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {event.time}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Continuous scroll keyframes (scoped via style tag — CSS-only animation for perf) */}
      <style>{`
        @keyframes lp-ticker-scroll {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ticker-scroll {
          animation: lp-ticker-scroll 32s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}

export default LivePulseTicker;
