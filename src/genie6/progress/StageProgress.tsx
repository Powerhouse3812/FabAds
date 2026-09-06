import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PulsingRingLoader } from "../components/PulsingRingLoader";

/**
 * StageProgress — the shared stage-wise progress primitive (§18).
 *
 * "A fixed estimate becomes a promise to the user, and a missed promise costs
 * more than no estimate." So this renders three things, never a countdown:
 *  1. A done / now / waiting stage list (recognition over recall — the user
 *     always knows what's left, not just a percentage).
 *  2. A plain progress bar (the actual number, for the users who want it).
 *  3. The current stage named in words (`aria-live="polite"`) plus a SOFT,
 *     coarse ETA ("About 4 min left") that only ever appears when the caller
 *     supplies `etaSeconds` and is rounded to the minute — never a ticking
 *     "0:47" countdown, never the old fixed "Estimated 1-2 min remaining"
 *     string this pattern replaces (§8, §21.2).
 *
 * The "now" stage uses PulsingRingLoader (the house loading motif) instead of
 * a circular spinner or bouncing dots — both banned anti-patterns (§7).
 */

function formatEta(seconds?: number): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 60) return "Less than a minute left";
  const mins = Math.round(seconds / 60);
  return mins <= 1 ? "About a minute left" : `About ${mins} min left`;
}

export function StageProgress({
  stages,
  stageIndex,
  progress,
  etaSeconds,
  className,
}: {
  stages: string[];
  stageIndex: number;
  progress: number;
  etaSeconds?: number;
  className?: string;
}) {
  // Guard against an empty stage list (shouldn't happen, but a batch/item
  // mid-migration or malformed seed must still render something sane).
  const safeStages = stages.length > 0 ? stages : ["Working"];
  const clampedIndex = Math.min(Math.max(stageIndex, 0), safeStages.length - 1);
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const currentLabel = safeStages[clampedIndex];
  const eta = formatEta(etaSeconds);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Stage list — done / now / waiting. Horizontally scrollable so 8
          stages (or one 60+ char stage name) never break the layout. */}
      <ol className="flex items-center gap-0 overflow-x-auto pb-0.5">
        {safeStages.map((label, i) => {
          const state = i < clampedIndex ? "done" : i === clampedIndex ? "now" : "waiting";
          return (
            <li key={`${label}-${i}`} className="flex shrink-0 items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1 h-px w-4 shrink-0",
                    i <= clampedIndex ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-1.5 py-0.5",
                  state === "now" && "bg-primary/10",
                )}
                title={label}
              >
                {state === "done" && (
                  <span
                    aria-hidden
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-text"
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
                {state === "now" && (
                  <PulsingRingLoader size={14} className="shrink-0" />
                )}
                {state === "waiting" && (
                  <span
                    aria-hidden
                    className="h-4 w-4 shrink-0 rounded-full border border-border"
                  />
                )}
                <span
                  className={cn(
                    "max-w-[110px] truncate font-mono text-[10px] uppercase tracking-[0.04em]",
                    state === "now" && "font-semibold text-foreground",
                    state === "done" && "text-muted-foreground",
                    state === "waiting" && "text-muted-foreground/60",
                  )}
                >
                  {label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clampedProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(clampedProgress)}% complete`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Current stage in words (screen readers hear every change) + soft ETA */}
      <div className="flex items-center justify-between gap-2">
        <p
          aria-live="polite"
          className="min-w-0 truncate text-[12px] font-medium text-foreground"
          title={currentLabel}
        >
          {currentLabel}
        </p>
        {eta && (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {eta}
          </span>
        )}
      </div>
    </div>
  );
}
