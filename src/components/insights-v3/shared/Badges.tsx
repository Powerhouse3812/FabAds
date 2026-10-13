import { Clock, Copy, Flame, Trophy } from "lucide-react";
import {
  ACTIVE_WINDOW_DAYS,
  AI_SCORE_TIER_MIN,
  SAVABLE_LABEL,
  WINNER_RULE,
  type AdStatus,
  type AiScore,
  type AiScoreTier,
  type SavableType,
} from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Hint } from "./Hint";
import { fmtInt } from "./format";
import { TYPE_ICON } from "./typeMeta";

const PILL = "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4";

/** Added since the user's last visit. Filled lime so it reads at a glance. */
export function NewBadge({ className }: { className?: string }) {
  return (
    <Hint content="Added since your last visit">
      <span className={cn(PILL, "border-primary bg-primary text-primary-foreground", className)}>
        New<span className="sr-only"> — added since your last visit</span>
      </span>
    </Hint>
  );
}

export interface WinnerBadgeProps {
  /** Winner whose reported engagement is in the scope's top share. Adds a small extra mark. */
  engagementStandout?: boolean;
  className?: string;
}

/** The rule comes from WINNER_RULE; never mentions likes except on the extra mark. */
export function WinnerBadge({ engagementStandout, className }: WinnerBadgeProps) {
  const rule = `Seen live, ${WINNER_RULE.minDaysLive}+ days running, ${WINNER_RULE.minClones}+ clones`;
  return (
    <span className={cn(PILL, "border-warning-text/30 bg-warning-text/10 text-warning-text", className)}>
      <Hint content={rule}>
        <span className="inline-flex items-center gap-1">
          <Trophy className="h-3 w-3" aria-hidden="true" />
          Winner
          <span className="sr-only"> — {rule}</span>
        </span>
      </Hint>
      {engagementStandout && (
        <Hint content="Also stands out on reported engagement">
          <span className="inline-flex items-center border-l border-warning-text/30 pl-1">
            <Flame className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Also stands out on reported engagement</span>
          </span>
        </Hint>
      )}
    </span>
  );
}

const TIER_LABEL: Record<AiScoreTier, string> = { elite: "Elite", strong: "Strong", average: "Average", weak: "Weak" };
const TIER_STYLE: Record<AiScoreTier, string> = {
  elite: "border-primary bg-primary text-primary-foreground",
  strong: "border-primary/30 bg-primary/15 text-primary-text",
  average: "border-border bg-muted text-foreground",
  weak: "border-error-text/30 bg-error-text/10 text-error-text",
};

/**
 * Solid, readable-on-any-background fills for My Feeds cards (the tints above vanish on a photo).
 * `text-background` flips with the theme, so contrast holds in light and dark.
 */
const TIER_STYLE_SOLID: Record<AiScoreTier, string> = {
  elite: "border-transparent bg-primary text-primary-foreground",
  strong: "border-transparent bg-success-text text-background",
  average: "border-transparent bg-warning-text text-background",
  weak: "border-transparent bg-error-text text-background",
};

/** Total + tier, colour by token. `solid` = filled tag (My Feeds card), otherwise the tinted badge. */
export function AiScoreBadge({ score, className, solid }: { score: AiScore; className?: string; solid?: boolean }) {
  const tip = `AI score ${score.total}/100 · ${TIER_LABEL[score.tier]}. Elite ≥ ${AI_SCORE_TIER_MIN.elite}, Strong ≥ ${AI_SCORE_TIER_MIN.strong}, Average ≥ ${AI_SCORE_TIER_MIN.average}.`;
  return (
    <Hint content={tip}>
      <span aria-label={tip} className={cn(PILL, (solid ? TIER_STYLE_SOLID : TIER_STYLE)[score.tier], className)}>
        <span>AI</span>
        <span className="font-mono tabular-nums">{score.total}</span>
        <span className="opacity-80">{TIER_LABEL[score.tier]}</span>
      </span>
    </Hint>
  );
}

/** "Seen live" / "Not seen recently" — never a platform status, never "paused". */
export function StatusPill({ status, className }: { status: AdStatus; className?: string }) {
  const live = status === "active";
  const tip = live
    ? `Seen live in the last ${ACTIVE_WINDOW_DAYS} days.`
    : `Not seen live in the last ${ACTIVE_WINDOW_DAYS} days. It may have stopped, or we may have missed it.`;
  return (
    <Hint content={tip}>
      <span
        aria-label={tip}
        className={cn(
          PILL,
          live ? "border-success-text/30 bg-success-text/10 text-success-text" : "border-border bg-muted text-muted-foreground",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-success-text" : "bg-muted-foreground/60")}
        />
        {live ? "Seen live" : "Not seen recently"}
      </span>
    </Hint>
  );
}

/** Null → "Start date unknown" — never an invented number. */
export function DaysLive({ days, className }: { days: number | null; className?: string }) {
  const known = typeof days === "number";
  const tip = known
    ? "From the first date the ad ran to the last time we saw it."
    : "We don't have a start date for this ad, so we can't count days live.";
  return (
    <Hint content={tip}>
      <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground", className)}>
        <Clock className="h-3 w-3" aria-hidden="true" />
        {known ? (
          <>
            <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(days)}</span>{" "}
            {days === 1 ? "day" : "days"} live
          </>
        ) : (
          <span className="italic">Start date unknown</span>
        )}
      </span>
    </Hint>
  );
}

/** Copies of the same creative seen across advertisers. The strongest winner signal. */
export function ClonesPill({ clones, className }: { clones: number; className?: string }) {
  const tip =
    clones > 0
      ? "Copies of this creative seen across other competitors — a strong signal it works."
      : "No copies seen. This is the original only.";
  return (
    <Hint content={tip}>
      <span
        aria-label={`${clones} ${clones === 1 ? "clone" : "clones"}. ${tip}`}
        className={cn(
          PILL,
          clones > 0 ? "border-primary/30 bg-primary/10 text-primary-text" : "border-border bg-muted text-muted-foreground",
          className,
        )}
      >
        <Copy className="h-3 w-3" aria-hidden="true" />
        <span className="font-mono tabular-nums">{fmtInt(clones)}</span>
        {clones === 1 ? "clone" : "clones"}
      </span>
    </Hint>
  );
}

/** Type chip for saved items / overlay headers. */
export function TypeChip({ type, className }: { type: SavableType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return (
    <span className={cn(PILL, "border-primary/30 bg-primary/10 text-primary-text", className)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {SAVABLE_LABEL[type]}
    </span>
  );
}
