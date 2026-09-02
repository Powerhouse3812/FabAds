/**
 * DailyBrief — the week, as marks instead of prose.
 *
 * This used to be a 6-line synthesis paragraph plus a "show the numbers
 * behind this" reveal. Maalik's read: "the hero banner itself is a huge text
 * block, that nobody will read. Instead we can visualise it in numbers or
 * graph." The paragraph is gone. `facts` — the exact structured set the
 * paragraph used to be assembled from — was already the scannable version of
 * it, so it is now the ONLY thing this component renders: a row of compact
 * stat chips, value prominent, label a mono-caps micro-label underneath.
 *
 * It is still never labelled "AI" — not in a heading, not in a badge, not as
 * a sparkle icon standing in for the word. Attribution comes from
 * `generatedLabel` ("Built from 34 changes observed this week"), which names
 * what the chips were built from instead of who/what wrote them. That line
 * is the one piece of prose this block keeps: in `error` it is the thing
 * that names the window we could actually scan, and losing it would be a bad
 * trade for a few extra pixels.
 *
 * Provenance rides along quietly rather than as a chip per number: a fact
 * whose value reads as a before → after move (e.g. a domain's live-ad count)
 * renders as an arrow + a signed percentage, direction carried by icon shape
 * and sign — never colour alone. A fact on the `estimated` tier gets the
 * same compact `≈` mark the rest of the dashboard uses; `observed` and
 * `derived` facts don't need one because `generatedLabel` already says what
 * this was built from.
 *
 * ── `embedded` ────────────────────────────────────────────────────────────
 * This used to be rendered with `embedded` inside `ChangeFeed`'s card. Maalik's
 * read on that: "^ new what ????" — the chip row read as an unlabeled mystery
 * bolted onto a change feed that had nothing to do with it. `ChangeFeed` no
 * longer mounts this component at all; it now only ever renders changes. This
 * file is otherwise unchanged and still works standalone (`embedded` false,
 * the default) for whichever page wants to mount it next — own card shell,
 * own header, attribution inline. The `embedded` prop stays for that future
 * consumer rather than being ripped out along with its one caller.
 *
 * ── States ───────────────────────────────────────────────────────────────
 * `isLoading` is checked FIRST, before `available`. In `loading` the brief is
 * `available: false` exactly as it is in `zero` — identical on the surface,
 * opposite in meaning. Printing `unavailableReason` there would tell the user
 * we have nothing to say when we simply have not finished asking, so loading
 * renders a chip-row-shaped skeleton instead.
 *
 * Thin and zero then share the same `available: false` branch — the honest
 * reason differs (`unavailableReason`), the treatment doesn't. No filler
 * prose, no empty chip row, ever.
 *
 * ── No repeating the KPI row ──────────────────────────────────────────────
 * Maalik: "What changed me KPI are too many, 7 in a row, keep max 5." The KPI
 * row above this block prints five bare counts; three of this block's facts
 * used to restate those exact numbers ~80px lower. Rather than hardcode which
 * KPI labels might collide — the KPI row itself is being rebuilt in parallel
 * — this reads `useKpis().primary` (the five tiles the row actually renders,
 * NOT `tiles`, which also carries the 7 `secondary` tiles nothing on screen
 * shows — deduping against those cut real facts like "Live ads 20,515" as
 * false "duplicates" of a KPI the row doesn't display) and drops any brief
 * fact whose value is a bare number (no domain name, no arrow, no
 * percent-of-something sentence) that already appears as one of those five
 * tiles' values. Composite facts ("shopease.com · 12 → 18 live ads") are
 * never bare numbers, so they're untouched — only true restatements get cut.
 * That reliably lands the row at 3-4 chips, under the 5-chip ceiling, without
 * this file needing to know the KPI row's exact label set.
 */
import { ArrowDownRight, ArrowUpRight, EqualApproximately, NotebookPen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROVENANCE_META } from "@/insights-dashboard/components/Provenance";
import { useBrief, useKpis, type DailyBriefFact } from "@/insights-dashboard/lib/selectors";

/** Max chips this block will ever render, per Maalik: "keep max 5." */
const MAX_FACT_CHIPS = 5;

/** A fact value that is nothing but a number — the shape a KPI tile's value
 * also takes. Only these are candidates for the KPI-overlap cut; anything
 * with a name, an arrow, or a unit attached is real brief-only content. */
function isBareNumber(value: string): boolean {
  return /^[\d,]+$/.test(value.trim());
}

export interface DailyBriefProps {
  className?: string;
  /**
   * Render inside a host card (the change feed) instead of as a block of its
   * own: no card shell, no section header. Defaults to the standalone card.
   */
  embedded?: boolean;
}

const MICRO_LABEL =
  "font-mono text-[9px] font-medium uppercase leading-none tracking-[0.14em] text-foreground/70";

/**
 * Every chip shares this shape. Width is content-sized (`w-fit`) between a
 * floor — so a one-character value like "7" doesn't collapse into a sliver
 * next to its siblings — and a ceiling that stops one unusually long value
 * (a long domain, an edge-case sentence) from blowing out the row. This
 * replaces the old fixed `w-[108px]`, which was narrow enough to cut every
 * label in this block mid-word regardless of how short the label was
 * ("Inactive brands" didn't even fit). Both lines below still `truncate` to
 * a single line each, which is what actually stops one tall chip from
 * dragging the rest of the row taller via flex's default stretch — the
 * width was never what caused that, so widening it here doesn't reopen it.
 */
const CHIP_BASE =
  "flex w-fit min-w-[92px] max-w-[168px] shrink-0 flex-col gap-px self-start rounded-md border border-border/60 bg-muted/30 px-2 py-0.5";

/**
 * A handful of fact labels arrive from the data layer wordier than a compact
 * chip can carry — "Changes past the recurrence gate" is 33 characters of
 * internal jargon ("recurrence gate" is exactly the kind of term Maalik has
 * asked us to drop in favour of plain FabAds vocabulary), and "Dominant
 * market angle" already has a shorter, established name elsewhere in this
 * module (`topAngle` / "Top angle" in the competitor table columns). This is
 * a display-only substitution: the full original label still rides in the
 * chip's `title`, and any label not in this list — which is most of them —
 * passes through unchanged, so this never needs to know about a label it
 * hasn't been told to shorten.
 */
const LABEL_OVERRIDES: Record<string, string> = {
  "Changes past the recurrence gate": "Recurring changes",
  "Dominant market angle": "Top angle",
};

function displayLabel(label: string): string {
  return LABEL_OVERRIDES[label] ?? label;
}

/** A fact whose value reads as "name · before → after unit". */
interface MovementFact {
  name: string;
  from: number;
  to: number;
  unit: string;
  deltaPct: number | null;
}

/**
 * Facts are free-text strings the selector assembles (e.g. "shopease.com ·
 * 12 → 18 live ads"). Rather than teach the selector a second, structured
 * shape just for this one chip's benefit, this reads the arrow back out of
 * the string it already produces. Anything that doesn't match this exact
 * shape falls through and renders as a plain value — never a crash.
 */
function parseMovement(value: string): MovementFact | null {
  const match = value.match(/^(.+?)\s*·\s*([\d,]+)\s*→\s*([\d,]+)\s*(.*)$/);
  if (!match) return null;
  const [, name, fromRaw, toRaw, unit] = match;
  const from = Number(fromRaw.replace(/,/g, ""));
  const to = Number(toRaw.replace(/,/g, ""));
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  const deltaPct = from > 0 ? Math.round(((to - from) / from) * 100) : null;
  return { name: name.trim(), from, to, unit: unit.trim(), deltaPct };
}

/** A fact whose value reads as "name · N% of noun-phrase" (e.g. "Benefit-led
 * · 25.3% of live creative"). Same move as `parseMovement`: read the shape
 * back out of the free-text value instead of teaching the selector a second
 * structured shape. The percentage becomes the chip's prominent value
 * (matching every other chip's number-on-top convention) and the name
 * becomes the micro-label underneath — both far shorter than the full
 * sentence, which is what was actually cutting "Benefit-led …" mid-word at
 * the old fixed width. Falls through to a plain value render for anything
 * that doesn't match this exact shape. */
interface ShareFact {
  name: string;
  pct: string;
}

function parseShareOfTotal(value: string): ShareFact | null {
  const match = value.match(/^(.+?)\s*·\s*(\d+(?:\.\d+)?%)\s+of\s+.+$/i);
  if (!match) return null;
  const [, name, pct] = match;
  return { name: name.trim(), pct };
}

function EstimatedMark(): JSX.Element {
  const meta = PROVENANCE_META.estimated;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`${meta.label} · ${meta.source}`}
          className="inline-flex shrink-0 cursor-help text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <EqualApproximately className="h-3 w-3" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <p className="text-xs font-medium text-foreground">{meta.label} · {meta.source}</p>
        <p className="mt-0.5 text-xs leading-snug text-foreground/70">{meta.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function FactChip({ fact }: { fact: DailyBriefFact }): JSX.Element {
  const movement = parseMovement(fact.value);
  const share = movement ? null : parseShareOfTotal(fact.value);

  // Both lines here still truncate with a `title` carrying the full text —
  // that's the safety net for whatever this block's parsers don't recognize
  // (a 60-char domain, an unanticipated value shape), not the primary fix.
  // The primary fix is `CHIP_BASE`'s content-sized width plus, for the two
  // shapes below, showing a shorter substring in the first place.
  if (movement) {
    const up = movement.deltaPct !== null && movement.deltaPct >= 0;
    const ArrowIcon = movement.deltaPct === null ? null : up ? ArrowUpRight : ArrowDownRight;
    // Two lines: the arrow + signed number on top, the domain name
    // underneath. `fact.label` ("Fastest-growing domain") is real context,
    // not filler, so it isn't dropped — it moves to the chip's `title`,
    // alongside the domain, rather than costing this one chip a third line.
    return (
      <div className={CHIP_BASE} title={`${fact.label}: ${fact.value}`}>
        <span className="flex min-w-0 items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
          {ArrowIcon && <ArrowIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">
            {movement.deltaPct === null
              ? `${movement.from} → ${movement.to}`
              : `${up ? "+" : ""}${movement.deltaPct}%`}
          </span>
        </span>
        <span className={cn(MICRO_LABEL, "block truncate")}>{movement.name}</span>
      </div>
    );
  }

  if (share) {
    // Same move as the movement chip: the percentage is the prominent
    // number, the name it belongs to is the micro-label underneath, and the
    // descriptive label ("Dominant market angle") moves to `title` instead
    // of costing this chip its own line. That's what keeps "Benefit-led ·
    // 25.3% of live creative" from being the one chip that needs a much
    // wider box than every other fact in this row.
    return (
      <div className={CHIP_BASE} title={`${fact.label}: ${fact.value}`}>
        <span className="flex min-w-0 items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
          {fact.provenance === "estimated" && <EstimatedMark />}
          <span className="truncate">{share.pct}</span>
        </span>
        <span className={cn(MICRO_LABEL, "block truncate")}>{share.name}</span>
      </div>
    );
  }

  return (
    <div className={CHIP_BASE} title={`${fact.label}: ${fact.value}`}>
      <span className="flex min-w-0 items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
        {fact.provenance === "estimated" && <EstimatedMark />}
        <span className="min-w-0 truncate">{fact.value}</span>
      </span>
      <span className={cn(MICRO_LABEL, "block truncate")}>{displayLabel(fact.label)}</span>
    </div>
  );
}

/** Chip-shaped placeholder: same box heights the real row lands in, so the
 * card underneath does not jump when the facts arrive. */
function BriefSkeleton(): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-11 w-[108px] shrink-0 rounded-md" />
      ))}
    </div>
  );
}

export function DailyBrief({ className, embedded = false }: DailyBriefProps): JSX.Element {
  const { available, facts, generatedLabel, unavailableReason, isLoading } = useBrief();
  // `primary` — the five tiles the KPI row actually renders — NOT `tiles`,
  // which also carries the 7 `secondary` tiles nothing on screen shows. Only
  // a number genuinely visible up there counts as a restatement.
  const { primary: kpiPrimaryTiles } = useKpis();

  // Values already sitting in the KPI row above, as bare numbers, so a brief
  // fact printing that same bare number is a restatement, not new content.
  const kpiNumericValues = new Set(
    kpiPrimaryTiles
      .map((t) => t.value)
      .filter((v): v is string => v !== null && isBareNumber(v))
      .map((v) => v.replace(/,/g, "")),
  );

  const qualifyingFacts = facts.filter((fact) => {
    if (!isBareNumber(fact.value)) return true;
    return !kpiNumericValues.has(fact.value.replace(/,/g, ""));
  });

  // Deduping against `primary` only (5 tiles, not all 12) reliably lets more
  // facts through than the old `tiles`-wide check did. When that pushes past
  // the 5-chip ceiling, don't just take the first 5 in fixture order — a
  // movement or derived fact ("shopease.com · 12 → 18 live ads", "2 of 12
  // inactive brands") is new information; a raw count ("Live ads 20,515")
  // duplicates what a sentence would have said anyway. Informative facts win
  // the remaining slots; raw counts fill in behind them.
  const visibleFacts =
    qualifyingFacts.length <= MAX_FACT_CHIPS
      ? qualifyingFacts
      : [
          ...qualifyingFacts.filter((fact) => !isBareNumber(fact.value)),
          ...qualifyingFacts.filter((fact) => isBareNumber(fact.value)),
        ].slice(0, MAX_FACT_CHIPS);

  const attribution =
    available && generatedLabel ? (
      <span className={cn(MICRO_LABEL, "leading-relaxed")}>{generatedLabel}</span>
    ) : null;

  // ORDER MATTERS: loading before available. See the header comment.
  const body = isLoading ? (
    <BriefSkeleton />
  ) : available ? (
    visibleFacts.length > 0 ? (
      <div>
        <div className="flex flex-wrap gap-2">
          {visibleFacts.map((fact) => (
            <FactChip key={fact.label} fact={fact} />
          ))}
        </div>
        {embedded && attribution && <div className="mt-1.5">{attribution}</div>}
      </div>
    ) : (
      <p className="text-xs leading-snug text-foreground/70">Nothing scored yet this week.</p>
    )
  ) : (
    <div className="flex items-start gap-2 py-0.5">
      <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-xs leading-snug text-foreground/70">{unavailableReason}</p>
    </div>
  );

  if (embedded) {
    return <div className={className}>{body}</div>;
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-foreground">This week, in your industries</h2>
        {!isLoading && attribution}
      </header>
      {body}
    </section>
  );
}
