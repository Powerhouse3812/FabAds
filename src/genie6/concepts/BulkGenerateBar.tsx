import { AlertTriangle, Coins, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeBreakdown,
  CREDITS_LIMIT,
  CREDITS_REMAINING,
  exceedsBalance,
  formatCredits,
} from "@/genie6/lib/credits";
import { INITIAL_STATE, buildCreditLines } from "@/genie6/studio-v4/state/useWizard";

/**
 * BulkGenerateBar — §12 "Concepts → Generate Ads: multi-select produces ONE
 * batch." Sticky bar that appears once 1+ concepts are selected.
 *
 * §12: "the outcome must be stated in words before the user commits" — a
 * user looking at a multi-select reasonably assumes N separate runs, so
 * the bar leads with "N concepts → N ads in one batch" in plain words,
 * not just a number on a button.
 *
 * §15 + §21.2: cost is shown on the action, as a multiplier breakdown
 * (not just a total), and the balance is visible on the same screen.
 *
 * Product Shoot is structurally excluded from this path (see
 * ConceptsLibrary's handoff comment) — the note here just says so on
 * screen per the task brief, since the exclusion itself isn't visible
 * from this bar alone.
 */

export interface BulkGenerateBarProps {
  count: number;
  /** True when the selection spans both Image and Video concepts — Studio
   *  runs one format per batch, so this blocks Generate until resolved. */
  mixedFormat: boolean;
  onClear: () => void;
  onKeepFormat: (format: "image" | "video") => void;
  imageCount: number;
  videoCount: number;
  onGenerate: () => void;
}

export function BulkGenerateBar({
  count,
  mixedFormat,
  onClear,
  onKeepFormat,
  imageCount,
  videoCount,
  onGenerate,
}: BulkGenerateBarProps) {
  if (count === 0) return null;

  // Price EXACTLY what Configure will show on arrival — the wizard's own
  // formula over its defaults (4 outputs · Genie 1.0 · 1080p) with N
  // concepts. The old literal chain (1 × N) read "3 credits" for 3 concepts
  // while Configure then read 12 — a 4× understatement at the point of
  // commitment. (Only `.length` of selectedConceptIds is priced.)
  const breakdown = computeBreakdown(
    buildCreditLines({
      ...INITIAL_STATE,
      format: videoCount > 0 && imageCount === 0 ? "video" : "image",
      selectedConceptIds: Array.from({ length: count }, (_, i) => `selected-${i}`),
    }),
  );
  const exceeds = exceedsBalance(breakdown.total);
  const canGenerate = !mixedFormat && !exceeds;

  return (
    <div
      role="region"
      aria-label="Bulk generate"
      className="sticky bottom-4 z-20 mx-auto flex w-full max-w-2xl flex-col gap-2.5 rounded-2xl border border-border bg-card/95 p-3.5 shadow-lg backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-bold text-foreground">
            {count} concept{count === 1 ? "" : "s"} selected → {count} ad{count === 1 ? "" : "s"} in one
            batch
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            One Batch ID covers all {count} · Product Shoot isn't available from this path
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {mixedFormat && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning-text/30 bg-warning-text/10 px-2.5 py-2 text-[11px] text-warning-text">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            Mixed formats selected — Studio generates one format per batch.
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onKeepFormat("image")}
              className="rounded-full border border-warning-text/30 bg-background px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide hover:bg-warning-text/10"
            >
              Keep {imageCount} image
            </button>
            <button
              type="button"
              onClick={() => onKeepFormat("video")}
              className="rounded-full border border-warning-text/30 bg-background px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide hover:bg-warning-text/10"
            >
              Keep {videoCount} video
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Credit breakdown — multipliers, not just a total (§21.2). */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] text-muted-foreground">
          {breakdown.lines.map((l, i) => (
            <span key={l.label} className="inline-flex items-center gap-1">
              {i > 0 && <span aria-hidden>×</span>}
              <span title={l.label}>{l.factor}</span>
            </span>
          ))}
          <span aria-hidden>=</span>
          <span className="font-semibold text-foreground">{formatCredits(breakdown.total)} credits</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Balance — §15: the balance shows on the page. */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1">
            <Coins className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
              {formatCredits(CREDITS_REMAINING)}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              / {formatCredits(CREDITS_LIMIT)}
            </span>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            title={
              mixedFormat
                ? "Resolve the mixed formats above to continue"
                : exceeds
                  ? "This would exceed your remaining credits"
                  : undefined
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-transform",
              canGenerate
                ? "bg-primary text-primary-foreground hover:scale-[1.02]"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Continue in Studio · {formatCredits(breakdown.total)} credits
          </button>
        </div>
      </div>
      {exceeds && !mixedFormat && (
        <p className="font-mono text-[10px] text-destructive">
          This batch would exceed your remaining {formatCredits(CREDITS_REMAINING)} credits.
        </p>
      )}
    </div>
  );
}
