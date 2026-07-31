/**
 * BucketTabs — the Overview's hero. Merges the old BucketRow (5 count cards)
 * and FatiguingNowList (a separate, always-visible list) into one switching
 * surface: the bucket COUNT is the tab label itself, and a single detail
 * panel below shows that bucket's creatives. This kills a real
 * double-encoding bug — the old layout showed a count up top AND repeated
 * the same creatives in a second list underneath, for Fatiguing only, while
 * the other four buckets showed a count with nothing behind it at all.
 *
 * Styling note (read before touching): this renders on the Creative Report,
 * which is NOT inside Genie's `.g6-root` and has no `data-theme` attribute on
 * <html> (that's only mirrored in by Genie6Bridge on /iq/genie6/* routes).
 * `.g6-glass` / `.g6-halo` / `.g6-eyebrow` all read CSS custom properties
 * (--g6-glass-bg, --g6-color-text-tertiary, --g6-shadow-lg, …) that are only
 * DEFINED under `[data-theme="light"]` / `[data-theme="dark"]` selectors —
 * outside a Genie route those vars are unset, so the classes would resolve
 * to invalid/no-op declarations (transparent bg, no blur, inherited text
 * color instead of a muted tone). So this component reaches the same visual
 * result with standard shadcn tokens instead: `bg-card/70 backdrop-blur-xl`
 * for the glass surface, an absolutely-positioned `bg-primary/10 blur-3xl`
 * div for the halo glow, and `hover:-translate-y-0.5` for the lift. Geist
 * Mono + tabular-nums are still used on every number, matching the g6
 * numeral treatment.
 */
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pause, Sparkles, Eye, RotateCw, Copy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildPreservedSearch } from "@/creative-report/components/PreserveParamsLink";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { ThresholdSettings } from "@/creative-report/components/ThresholdSettings";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useReportBasePath } from "@/creative-report/state/ReportBasePathContext";
import { fmtCompactCurrency, fmtMultiple, truncate, NAME_MAX } from "@/creative-report/lib/format";
import { bucketCreatives, bucketRuleText, type CreativeRollup } from "@/creative-report/lib/selectors";
import { BUCKETS, BUCKET_LABELS, type BucketKey } from "@/creative-report/lib/paramSchema";
import { useBucketThresholds } from "@/creative-report/lib/thresholds";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";

/** Sensible, bucket-specific empty copy — never "No data", never a
 *  fabricated reassurance for buckets where zero is just... zero. */
const EMPTY_COPY: Record<BucketKey, string> = {
  winners: "No creatives clear the winner threshold in this range.",
  scaling: "No creatives are trending into the scaling bar right now.",
  fatiguing: "Nothing fatiguing right now — every active creative is holding steady.",
  new: "No creatives launched in this window.",
  losers: "No creatives falling below the loser bar in this range.",
};

/** Act-today bias: Fatiguing wins the default tab if it has anything to
 *  show, otherwise the first bucket with a non-zero count, otherwise
 *  Winners (the calmest place to land on an all-zero portfolio). */
function defaultActiveBucket(buckets: Record<BucketKey, number>): BucketKey {
  if (buckets.fatiguing > 0) return "fatiguing";
  const firstNonZero = BUCKETS.find((b) => buckets[b] > 0);
  return firstNonZero ?? "winners";
}

interface RowAction {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

/** Per-bucket action set (handoff-scoped, not every action everywhere):
 *  fatiguing → Pause / Generate variation / View
 *  losers    → Pause / View
 *  winners + scaling → Relaunch / Duplicate / View
 *  new       → View only (nothing to act on yet). */
function getRowActions(
  bucket: BucketKey,
  rollup: CreativeRollup,
  actions: ReturnType<typeof useCreativeActions>,
): RowAction[] {
  const view: RowAction = {
    key: "view",
    icon: Eye,
    label: "View",
    onClick: () => actions.view(rollup.creative.id),
  };
  const pause: RowAction = {
    key: "pause",
    icon: Pause,
    label: "Pause",
    onClick: () => actions.pause(rollup),
  };
  const generate: RowAction = {
    key: "generate",
    icon: Sparkles,
    label: "Generate variation",
    onClick: () => actions.generateVariation(rollup),
  };
  const relaunch: RowAction = {
    key: "relaunch",
    icon: RotateCw,
    label: "Relaunch",
    onClick: () => actions.launch(rollup),
  };
  const duplicate: RowAction = {
    key: "duplicate",
    icon: Copy,
    label: "Duplicate",
    onClick: () => actions.duplicate(rollup),
  };

  switch (bucket) {
    case "fatiguing":
      return [pause, generate, view];
    case "losers":
      return [pause, view];
    case "winners":
    case "scaling":
      return [relaunch, duplicate, view];
    case "new":
      return [view];
  }
}

function BucketTabRow({ rollup, bucket }: { rollup: CreativeRollup; bucket: BucketKey }) {
  const actions = useCreativeActions();
  const { text, truncated } = truncate(rollup.creative.name, NAME_MAX);

  // Per-bucket secondary line. Fatiguing gets the symptom (reason + freq) —
  // spend for it already sits in the row's right-aligned numeral, so it
  // isn't repeated here. Every other bucket gets ROAS for the same reason:
  // spend already has its one place (the right column) — restating it in
  // the meta line too would be the exact double-encoding bug this whole
  // component exists to remove.
  // `fatigue.reason` is already the human symptom string and ALREADY names
  // frequency when frequency is what tripped ("Freq 4.9") — so only append
  // the freq figure when the reason is about something else (a CTR or
  // hook-rate drop), otherwise it prints "Freq 4.9 · freq 4.9".
  const reason = rollup.fatigue.reason;
  const secondary =
    bucket === "fatiguing"
      ? [reason, reason?.toLowerCase().includes("freq") ? null : `freq ${rollup.fatigue.freq7.toFixed(1)}`]
          .filter(Boolean)
          .join(" · ")
      : `ROAS ${fmtMultiple(rollup.metrics.roas)}`;

  const rowActions = getRowActions(bucket, rollup, actions);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => actions.view(rollup.creative.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          actions.view(rollup.creative.id);
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-md border-b border-border/70 py-2.5 transition-transform last:border-0 hover:-translate-y-0.5 hover:bg-accent/5"
    >
      <CreativeThumb creative={rollup.creative} size={40} />

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-foreground"
          title={truncated ? rollup.creative.name : undefined}
        >
          {text}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{secondary}</p>
      </div>

      <span className="shrink-0 font-mono text-sm tabular-nums text-foreground">
        {fmtCompactCurrency(rollup.metrics.spend)}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        {rowActions.map((a) => (
          <Tooltip key={a.key}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={a.label}
                onClick={(e) => {
                  e.stopPropagation();
                  a.onClick();
                }}
              >
                <a.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{a.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

export function BucketTabs({
  rollups,
  buckets,
  active: activeProp,
  onActiveChange,
}: {
  rollups: CreativeRollup[];
  buckets: Record<BucketKey, number>;
  /** Optional controlled mode — pass both to let a sibling (e.g. a
   *  recommendation's "Review" button) open a specific bucket. Omit both and
   *  the tabs manage their own state. */
  active?: BucketKey;
  onActiveChange?: (bucket: BucketKey) => void;
}) {
  const thresholds = useBucketThresholds();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [uncontrolled, setUncontrolled] = useState<BucketKey>(() => defaultActiveBucket(buckets));
  const active = activeProp ?? uncontrolled;
  const setActive = (b: BucketKey) => {
    setUncontrolled(b);
    onActiveChange?.(b);
  };

  // Roving arrow keys per the tabs pattern — Tab still reaches each tab
  // natively (they're real buttons); arrows move focus AND activate.
  const onTablistKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = BUCKETS.indexOf(active);
    const next =
      e.key === "ArrowRight"
        ? BUCKETS[(i + 1) % BUCKETS.length]
        : BUCKETS[(i - 1 + BUCKETS.length) % BUCKETS.length];
    setActive(next);
    document.getElementById(`bucket-tab-${next}`)?.focus();
  };

  const basePath = useReportBasePath();
  const items = useMemo(() => bucketCreatives(rollups, active), [rollups, active]);
  const rule = bucketRuleText(active, thresholds);

  // The panel caps at bucketCreatives' limit (top-8 by spend). When the
  // bucket holds more, say so and hand over to the grid — a tab labelled
  // "23" above a silent 8-row list would be a data-honesty bug, and the
  // grid click-through is the old BucketRow affordance this keeps alive.
  const activeCount = buckets[active];
  const goGrid = () =>
    navigate(
      `${basePath}/creatives${buildPreservedSearch(searchParams, `bucket=${active}`)}`,
    );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-xl">
      {/* Halo glow behind the tab strip — standard-token equivalent of
          g6-halo (see file-level note on why the real class won't apply here). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[80%] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 px-4 pt-4">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Auto-categorised
          </span>
          <WhyDot id="overview.bucket" />
          {/* The live threshold editor — inherited from the retired BucketRow.
              Every rule string on this screen regenerates from whatever the
              buyer sets here, so the formula shown always matches the rule
              actually applied (iter-2 W2). */}
          <div className="ml-auto">
            <ThresholdSettings />
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Creative buckets"
          onKeyDown={onTablistKeyDown}
          className="mt-3 flex w-full border-b border-border px-2"
        >
          {BUCKETS.map((key) => {
            const count = buckets[key];
            const isActive = key === active;
            const isWinners = key === "winners";
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`bucket-tab-${key}`}
                aria-selected={isActive}
                aria-controls="bucket-tab-panel"
                // The visible label is a count numeral above a word, which a
                // screen reader would otherwise announce as two loose strings
                // (or nothing useful) — name the tab explicitly.
                aria-label={`${BUCKET_LABELS[key]}, ${count} ${count === 1 ? "creative" : "creatives"}`}
                onClick={() => setActive(key)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 border-b-2 px-2 py-3 transition-transform duration-200 hover:-translate-y-0.5",
                  isActive ? "border-primary" : "border-transparent hover:border-border",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-xl font-semibold tabular-nums transition-colors",
                    isActive
                      ? "text-primary-text"
                      : count === 0
                        ? "text-muted-foreground/50"
                        : isWinners
                          ? "text-primary-text/80"
                          : "text-foreground",
                  )}
                >
                  {count}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-wide transition-colors",
                    isActive ? "text-primary-text" : "text-muted-foreground",
                  )}
                >
                  {BUCKET_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div
          id="bucket-tab-panel"
          role="tabpanel"
          aria-labelledby={`bucket-tab-${active}`}
          className="px-4 py-3"
        >
          <p className="font-mono text-[10.5px] text-muted-foreground">{rule}</p>

          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{EMPTY_COPY[active]}</p>
          ) : (
            <>
              <div className="mt-2">
                {items.map((r) => (
                  <BucketTabRow key={r.creative.id} rollup={r} bucket={active} />
                ))}
              </div>
              {activeCount > items.length && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing the top {items.length} by spend.{" "}
                  <button
                    type="button"
                    onClick={goGrid}
                    className="underline underline-offset-2 transition-colors hover:text-foreground"
                  >
                    View all {activeCount} in the grid
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
