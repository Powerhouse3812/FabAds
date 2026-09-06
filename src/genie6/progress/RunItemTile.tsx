import { Ban, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCredits, creditsLabel } from "../lib/credits";
import type { RetryScope, RunItem } from "../lib/genieRunTypes";
import { PulsingRingLoader } from "../components/PulsingRingLoader";
import { StageProgress } from "./StageProgress";
import { FailureNotice } from "./FailureNotice";

/**
 * RunItemTile — one output's tile, rendered in the grid position the finished
 * output would occupy. §18: on failure the item "stays visible in the list
 * in an error state, with Retry — never a toast that disappears." So the
 * failed branch below is inline, not a portal/toast, and every branch keeps
 * the same outer footprint so a grid of tiles never reflows as items change
 * status mid-batch.
 *
 * Six RunItemStatus branches: pending (shimmer skeleton, never a spinner) ·
 * running (PulsingRingLoader + this item's own StageProgress) · done ·
 * failed (delegates to FailureNotice so failure copy/retry never forks) ·
 * cancelling (visibly in flight — a click must not look like it did nothing)
 * · cancelled (terminal, visibly distinct from failed: the user's choice,
 * not a fault).
 */

const CARD = "flex flex-col overflow-hidden rounded-[20px] border border-border bg-card";

export function RunItemTile({
  item,
  stages,
  onRetry,
  className,
  format,
}: {
  item: RunItem;
  stages: string[];
  onRetry?: (s: RetryScope) => void;
  className?: string;
  /**
   * The batch's output format ("Image" / "Video"), from `RunBatch.config`.
   *
   * Every state in this tile was hardcoded to `aspect-[4/5]`, but the real
   * OutputCard that replaces it on completion uses `aspect-[9/16]` for video
   * (OutputCard.tsx). So a video batch rendered a 4:5 placeholder and then
   * snapped to a much taller card the moment it finished — the
   * skeleton-that-doesn't-match-layout anti-pattern, and a guaranteed jump on
   * a surface the user is watching. Taken from the batch rather than the
   * joined output because an in-flight item has no output to read yet.
   */
  format?: string;
}) {
  // Matches OutputCard's own media-zone rule.
  const aspect = format?.toLowerCase() === "video" ? "aspect-[9/16]" : "aspect-[4/5]";
  switch (item.status) {
    case "pending":
      return (
        <div className={cn(CARD, className)}>
          <div className={cn(aspect, "w-full animate-pulse bg-muted")} aria-hidden />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Queued
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">#{item.index}</span>
          </div>
        </div>
      );

    case "running":
      return (
        <div className={cn(CARD, className)}>
          <div className={cn(aspect, "flex w-full flex-col items-center justify-center gap-3 bg-muted/40 px-4")}>
            <PulsingRingLoader size={40} />
            <p className="line-clamp-2 max-w-full text-center text-[12px] font-medium text-foreground">
              {item.title}
            </p>
          </div>
          <div className="border-t border-border p-3">
            <StageProgress
              stages={stages}
              stageIndex={item.stageIndex}
              progress={item.progress}
              etaSeconds={item.etaSeconds}
            />
          </div>
        </div>
      );

    case "done":
      return (
        <div className={cn(CARD, className)}>
          <div className={cn(aspect, "relative w-full overflow-hidden bg-muted")}>
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <Check className="h-8 w-8" strokeWidth={1.5} />
              </div>
            )}
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-primary-text">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
              Done
            </span>
          </div>
          <div className="flex flex-col gap-1 px-3 py-2.5">
            <p className="truncate text-[13px] font-semibold text-foreground" title={item.title}>
              {item.title}
            </p>
            {item.summary && (
              <p className="line-clamp-2 text-[11px] text-muted-foreground">{item.summary}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex min-w-0 flex-wrap gap-1">
                {item.tags?.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="truncate rounded-full border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {formatCredits(item.credits)} cr
              </span>
            </div>
          </div>
        </div>
      );

    case "failed":
      // Deliberately NOT wrapped in another bordered card — FailureNotice
      // supplies the one visible card here. Nesting cards is a banned
      // anti-pattern (§7), so the item title/index sit in a plain (no
      // border, no bg) row above it instead.
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          <div className="flex items-center justify-between gap-2 px-0.5">
            <p className="min-w-0 truncate text-[12px] font-medium text-foreground" title={item.title}>
              {item.title}
            </p>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">#{item.index}</span>
          </div>
          <FailureNotice
            reason={item.failure ?? "render-error"}
            onRetry={onRetry}
            retryCredits={{
              "this-item": item.credits,
              // A blind "different model" retry from a tile passes no
              // modelId, so genieRunStore charges the batch's current rate
              // (×1) — quoting ×1.5 here promised a different figure than
              // the one actually charged.
              "different-model": item.credits,
            }}
          />
        </div>
      );

    case "cancelling":
      return (
        <div className={cn(CARD, "opacity-75", className)}>
          <div className={cn(aspect, "flex w-full flex-col items-center justify-center gap-2 bg-muted/40 px-4")}>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted-foreground" aria-hidden />
            <p className="line-clamp-2 max-w-full text-center text-[12px] text-muted-foreground">
              {item.title}
            </p>
          </div>
          <div className="flex items-center justify-center border-t border-border px-3 py-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Cancelling…
            </span>
          </div>
        </div>
      );

    case "cancelled":
      return (
        <div className={cn(CARD, className)}>
          <div className={cn(aspect, "flex w-full flex-col items-center justify-center gap-2 bg-muted/30 px-4")}>
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
            >
              <Ban className="h-4 w-4" />
            </span>
            <p className="line-clamp-2 max-w-full text-center text-[12px] font-medium text-foreground">
              {item.title}
            </p>
            <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Cancelled
            </span>
          </div>
          {onRetry && (
            <div className="border-t border-border p-2.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRetry("this-item")}
                className="w-full rounded-full"
              >
                Retry this ad ({creditsLabel(item.credits)})
              </Button>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
