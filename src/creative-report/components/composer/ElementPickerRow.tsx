/**
 * ElementPickerRow — the per-element "use this" chips rendered inside a
 * CompareColumn (creatives mode only — see CompareColumn's doc-comment).
 * Presentational: every click just calls back up to Compare.tsx's
 * useElementComposer instance, which owns the actual cross-column state.
 *
 * A chip is "active" (lime-filled) when THIS creative currently supplies
 * that slot — picking the same element from another column flips the OTHER
 * column's chip active and this one back to idle, which is how "picking a
 * second hook replaces the first" stays visible without extra UI.
 */
import { Lock, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtMultiple } from "@/creative-report/lib/format";
import { TEXT_ELEMENT_META } from "./elementMeta";
import { ELEMENT_LABELS, type ColumnComposerProps } from "./types";
import type { Creative } from "@/data/model";

function Chip({
  label,
  active,
  disabled,
  /** Distinct from `disabled` — still clickable (kicks off analysis), but
   *  visually reads as "not yet unlocked" rather than a normal unpicked
   *  chip, so it's never confused with "framework unavailable". */
  locked,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  locked?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary-text"
          : disabled
            ? "cursor-not-allowed border-border/70 text-muted-foreground/60"
            : locked
              ? "border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function ElementPickerRow({
  creative,
  metrics,
  composer,
}: {
  creative: Creative;
  metrics: { roas: number; spend: number };
  composer: ColumnComposerProps;
}) {
  const {
    picks,
    frameworkStatus,
    canRunAnalysis,
    onPickText,
    onPickMedia,
    onPickFramework,
    onPickWholeAd,
    onRunAnalysis,
  } = composer;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Use from this creative
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TEXT_ELEMENT_META.map((meta) => (
          <Chip
            key={meta.key}
            label={meta.label}
            active={picks[meta.key]?.creativeId === creative.id}
            onClick={() => onPickText(meta.key, meta.prefill(creative))}
          />
        ))}
        <Chip
          label={ELEMENT_LABELS.media}
          active={picks.media?.creativeId === creative.id}
          onClick={onPickMedia}
        />
        {frameworkStatus === "analysed" ? (
          <Chip
            label={ELEMENT_LABELS.framework}
            active={picks.framework?.creativeId === creative.id}
            onClick={onPickFramework}
          />
        ) : frameworkStatus === "analysing" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Chip
                  label="Analysing…"
                  active={false}
                  disabled
                  onClick={() => {}}
                  icon={<Loader2 className="h-3 w-3 animate-spin" />}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">Analysis in progress</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Chip
                  label={ELEMENT_LABELS.framework}
                  active={false}
                  locked
                  onClick={onRunAnalysis}
                  icon={<Lock className="h-3 w-3" />}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {canRunAnalysis
                ? "Run analysis to use"
                : "Run analysis to use — not enough credits"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <button
        type="button"
        onClick={() => onPickWholeAd()}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary-text"
      >
        <Sparkles className="h-3 w-3" />
        Use whole ad
      </button>
      {/* Real folded metric for context, never invented — same number the
          card already shows above. */}
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        This creative: {fmtMultiple(metrics.roas)} ROAS
      </p>
    </div>
  );
}
