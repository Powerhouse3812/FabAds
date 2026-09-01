/**
 * DailyBrief — the written summary of the week.
 *
 * Two things separate this from every "AI summary" card in the category:
 *
 *  1. It shows its working. `facts` is exactly the structured set the
 *     paragraph was assembled from, each carrying its own `provenance`. A
 *     reveal under the paragraph lists them, chip and all — a summary you
 *     can audit is worth ten you can't.
 *  2. It is never labelled "AI" — not in a heading, not in a badge, not as
 *     a sparkle icon standing in for the word. Attribution comes from
 *     `generatedLabel` ("Built from 34 changes observed this week"), which
 *     names what it was built from instead of who/what wrote it.
 *
 * Typography carries the block: it is prose sitting in a dense dashboard,
 * so it gets a comfortable measure, relaxed leading and full-strength
 * `text-foreground` — the one place on the page that's allowed to breathe.
 *
 * ── `embedded` ────────────────────────────────────────────────────────────
 * A design critique found this block and the change feed answering the same
 * question — "what happened this week" — and saying overlapping things twice,
 * stacked. The fix was to fold the prose INTO the feed rather than delete
 * either: the paragraph is now the lead of `ChangeFeed`, and the rows are its
 * evidence. `embedded` is that mode. It drops the card shell and the section
 * header, because the host card already supplies both.
 *
 * What it does NOT drop is `generatedLabel`. That string is the substitute for
 * the "AI" badge this component refuses to wear — it names what the paragraph
 * was assembled from — and in the `error` state it is rewritten to name the
 * window we could actually scan ("…the 7 days to Aug 28, the last window we
 * could scan"). Losing it in the one state where credibility is the whole
 * point would be a bad trade, so embedded mode moves it out of the dropped
 * header and onto the facts-reveal row instead.
 *
 * ── States ───────────────────────────────────────────────────────────────
 * `isLoading` is checked FIRST, before `available`. In `loading` the brief is
 * `available: false` exactly as it is in `zero` — identical on the surface,
 * opposite in meaning. Printing `unavailableReason` there would tell the user
 * we have nothing to say when we simply have not finished asking, so loading
 * renders a paragraph-shaped skeleton instead.
 *
 * Thin and zero then share the same `available: false` branch — the honest
 * reason differs (`unavailableReason`), the treatment doesn't. No filler
 * prose, no empty quote block, ever.
 */
import { useState } from "react";
import { ChevronDown, NotebookPen } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import { useBrief } from "@/insights-dashboard/lib/selectors";

export interface DailyBriefProps {
  className?: string;
  /**
   * Render inside a host card (the change feed) instead of as a block of its
   * own: no card shell, no section header, attribution relocated to the
   * facts-reveal row. Defaults to the standalone card.
   */
  embedded?: boolean;
}

/**
 * Paragraph-shaped placeholder. Three lines at prose leading with a short
 * last line and a trigger-sized stub below, so the real paragraph lands in
 * roughly the same box and the card underneath does not jump when it does.
 */
function BriefSkeleton(): JSX.Element {
  return (
    <div className="max-w-prose space-y-2" aria-hidden="true">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="mt-3 h-3 w-48" />
    </div>
  );
}

export function DailyBrief({ className, embedded = false }: DailyBriefProps): JSX.Element {
  const {
    available,
    paragraph,
    facts,
    factCount,
    generatedLabel,
    unavailableReason,
    isLoading,
  } = useBrief();
  const [factsOpen, setFactsOpen] = useState(false);

  // Only embedded mode carries the attribution inline; standalone keeps it in
  // the header, where it has always sat.
  //
  // NO `whitespace-nowrap` here, unlike the standalone header. This label runs
  // to ~550px in the populated state and the host card's main column is ~540px
  // at the `lg` breakpoint — pinned nowrap it overflowed the card by 11px.
  // Sharing a wrapping row with the reveal trigger, it takes a second line
  // instead. (The standalone header keeps nowrap: there it competes with a
  // title on the same line, where word-wrapping squeezes the title into a
  // 2-line sliver — different geometry, different answer.)
  const inlineAttribution =
    embedded && available && generatedLabel ? (
      <span className="min-w-0 font-mono text-[9px] font-medium uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
        {generatedLabel}
      </span>
    ) : null;

  const factsReveal =
    factCount > 0 ? (
      <Collapsible open={factsOpen} onOpenChange={setFactsOpen} className="mt-3">
        {/* Trigger and attribution share one wrapping row so the reveal keeps
            its place at the left edge of the prose even when the attribution
            takes a line of its own in a squeezed column. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <CollapsibleTrigger
            className={cn(
              "inline-flex items-center gap-1.5 rounded text-xs font-medium text-muted-foreground",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-150", factsOpen && "rotate-180")}
              aria-hidden="true"
            />
            {factsOpen ? "Hide the numbers behind this" : `Show the ${factCount} numbers behind this`}
          </CollapsibleTrigger>
          {inlineAttribution}
        </div>
        <CollapsibleContent className="mt-2 border-t border-border/60">
          <dl className="divide-y divide-border/60">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="flex items-center gap-1.5">
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {fact.value}
                  </span>
                  <Provenance tier={fact.provenance} compact />
                </dd>
              </div>
            ))}
          </dl>
        </CollapsibleContent>
      </Collapsible>
    ) : (
      // No facts to reveal — the attribution still has to land somewhere.
      inlineAttribution && <div className="mt-3">{inlineAttribution}</div>
    );

  // ORDER MATTERS: loading before available. See the header comment.
  const body = isLoading ? (
    <BriefSkeleton />
  ) : available ? (
    <div>
      <p className="max-w-prose text-[15px] leading-relaxed text-foreground">{paragraph}</p>
      {factsReveal}
    </div>
  ) : (
    <div className="flex items-start gap-2.5 py-1">
      <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        {unavailableReason}
      </p>
    </div>
  );

  if (embedded) {
    return <div className={className}>{body}</div>;
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      {/* `flex-wrap` + `whitespace-nowrap` on the attribution is what makes
          this degrade instead of collapse: the attribution either fits on the
          title's line or takes a full line of its own underneath. Without the
          nowrap it wraps word-by-word inside a squeezed column and forces the
          title into a 2-line sliver beside it. */}
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-foreground">This week, in your industries</h2>
        {available && !isLoading && (
          <span className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {generatedLabel}
          </span>
        )}
      </header>
      {body}
    </section>
  );
}
