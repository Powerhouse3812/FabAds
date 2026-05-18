import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Loader2, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusGridProps {
  className?: string;
}

/**
 * StatusGrid — V2 replacement for NowStatusStrip.
 *
 * A compact 2×2 grid of operational mini-tiles. Same operational signal
 * as the V1 horizontal chip strip, denser packaging — slots alongside
 * the TopPerformerHero in a bento layout.
 *
 * Each tile = eyebrow + big number + tail line + (optional) progress bar
 * or pulse dot. Whole tile is a click target. Hover lifts -1px.
 *
 * Reference: Mercury "what's important now" tiles, Vercel deployment
 * status cards, Cron upcoming-event tiles.
 */
export function StatusGrid({ className }: StatusGridProps) {
  const navigate = useNavigate();

  /* ── Mock values (will wire to PlanContext + Studio state later) ── */
  const data = useMemo(() => {
    const credits = 73;
    const creditsMax = 100;
    const inProgress = 3;
    const needsYou = 6;
    const setupDone = 2;
    const setupTotal = 4;

    const creditsPct = (credits / creditsMax) * 100;
    const creditsHealth: "ok" | "warn" | "low" =
      creditsPct >= 30 ? "ok" : creditsPct >= 15 ? "warn" : "low";

    const setupComplete = setupDone >= setupTotal;

    return {
      credits,
      creditsMax,
      creditsPct,
      creditsHealth,
      inProgress,
      needsYou,
      setupDone,
      setupTotal,
      setupComplete,
    };
  }, []);

  return (
    <div
      className={cn("grid grid-cols-2 gap-2", className)}
      role="group"
      aria-label="Operational status"
    >
      {/* Credits */}
      <Tile
        index={0}
        onClick={() => navigate("/plans-v2")}
        eyebrow="CREDITS · MAY"
        bigNumber={
          <>
            {data.credits}
            <span className="text-muted-foreground">/{data.creditsMax}</span>
          </>
        }
        numberTone={data.creditsHealth}
        icon={Zap}
        tail={
          <div className="mt-1 h-1 w-full rounded-full bg-foreground/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                data.creditsHealth === "ok" && "bg-primary",
                data.creditsHealth === "warn" && "bg-amber-400",
                data.creditsHealth === "low" && "bg-destructive",
              )}
              style={{ width: `${data.creditsPct}%` }}
            />
          </div>
        }
      />

      {/* In Progress */}
      <Tile
        index={1}
        onClick={() =>
          navigate("/iq/genie6/library?status=processing")
        }
        eyebrow="IN PROGRESS"
        bigNumber={
          <span className="inline-flex items-center gap-2">
            {data.inProgress > 0 && <PulseDot />}
            {data.inProgress}
          </span>
        }
        numberTone={data.inProgress > 0 ? "ok" : "muted"}
        icon={Loader2}
        tail={
          <span className="text-muted-foreground">
            {data.inProgress > 0 ? "generating now" : "nothing running"}
          </span>
        }
      />

      {/* Needs You */}
      <Tile
        index={2}
        onClick={() => navigate("/iq/genie6/library?filter=unsaved")}
        eyebrow="NEEDS YOU"
        bigNumber={<>{data.needsYou}</>}
        numberTone={data.needsYou > 0 ? "foreground" : "muted"}
        icon={MessageSquare}
        tail={
          <span className="text-muted-foreground truncate">
            5 unsaved · 1 brand setup
          </span>
        }
      />

      {/* Setup */}
      <Tile
        index={3}
        onClick={() =>
          navigate("/insights-v2/feed?onboarding=true")
        }
        eyebrow="SETUP"
        bigNumber={
          <>
            {data.setupDone}
            <span className="text-muted-foreground">/{data.setupTotal}</span>
          </>
        }
        numberTone={data.setupComplete ? "ok" : "muted"}
        icon={Compass}
        tail={
          <span className="text-muted-foreground">
            {data.setupComplete ? "all done" : "tap to finish"}
          </span>
        }
      />
    </div>
  );
}

/* ── Tile — single mini-tile in the grid ── */
type NumberTone = "ok" | "warn" | "low" | "foreground" | "muted";

interface TileProps {
  index: number;
  onClick: () => void;
  eyebrow: string;
  bigNumber: React.ReactNode;
  numberTone: NumberTone;
  icon: typeof Zap;
  tail: React.ReactNode;
}

function Tile({
  index,
  onClick,
  eyebrow,
  bigNumber,
  numberTone,
  icon: Icon,
  tail,
}: TileProps) {
  const toneClass: Record<NumberTone, string> = {
    ok: "text-primary",
    warn: "text-amber-500",
    low: "text-destructive",
    foreground: "text-foreground",
    muted: "text-muted-foreground",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 22,
        delay: index * 0.05,
      }}
      whileHover={{ y: -1 }}
      className={cn(
        "group rounded-xl border border-border bg-card p-3",
        "flex flex-col gap-1 text-left",
        "transition-colors hover:border-foreground/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground leading-none">
          {eyebrow}
        </span>
        <Icon
          className="h-3 w-3 text-muted-foreground/70 group-hover:text-foreground/60 transition-colors"
          strokeWidth={2.2}
        />
      </div>
      <div
        className={cn(
          "font-mono font-bold text-[22px] tabular-nums leading-none",
          toneClass[numberTone],
        )}
      >
        {bigNumber}
      </div>
      <div className="text-[10.5px] leading-tight">{tail}</div>
    </motion.button>
  );
}

/* ── PulseDot — lime pulse-ring for the "IN PROGRESS" tile ── */
function PulseDot() {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-2 w-2 items-center justify-center"
    >
      <motion.span
        className="absolute inline-flex h-2 w-2 rounded-full bg-primary"
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
    </span>
  );
}
