/**
 * SetupChecklist — right-rail activation checklist.
 *
 * Exactly three steps, always, in every state: follow your industries, track
 * your first competitor, install the Chrome extension. `useSetupChecklist()`
 * is the only source of items — do not add a fourth. An earlier pass of this
 * checklist had a "turn on the weekly digest" step; it was cut because that
 * feature does not exist, and a checklist promising a capability we don't
 * ship would undercut the honesty the rest of this page is built on.
 *
 * All-rows pass (2026-09): an audit found the previous "scannable" version
 * rendered only the next step — done and later-pending steps, and their
 * labels, were gone entirely. That turned a 3-step checklist into a nag: the
 * user could see *that* there were 3 steps but never *what* the other two
 * were, so they couldn't plan against it. All three rows now always render:
 * done steps go quiet (checked, muted, a small "Manage" link, no competing
 * CTA), the next step stays the one prominent row with the block's only
 * actionable CTA (see the progress-meter note below on why it's `outline`,
 * not lime), and later pending steps show their label with no CTA. `done` is never
 * touched locally — every row always reflects the selector's real state, and
 * CTAs only navigate.
 *
 * Descriptions don't fit on the row without blowing the ~160px height
 * budget for three rows plus header and progress bar, so each row's label is
 * a focusable element (`tabIndex=0` + `aria-label`) carrying the description
 * as a tooltip — same pattern as `Provenance.tsx` — instead of the old plain
 * `title` attribute, which was mouse-only and invisible to assistive tech.
 *
 * "Install the Chrome extension" has no way to detect a real install from
 * here, so its CTA opens the store in a new tab (external link icon) rather
 * than an in-app route — the click must not imply the install finished. That
 * holds in every row state: `isExternalHref` reads the href, not `done`.
 *
 * When `complete` is true the block renders nothing. The page may still
 * mount it — it just goes quiet instead of showing a celebration banner.
 *
 * Progress-meter pass (2026-09): every other block on this dashboard now
 * carries its own market-grounded provocation and its own single action in
 * `firstTime`/`empty` (follow an industry, track a competitor, save an ad,
 * launch your first ads) — so this block stopped being the page's only
 * instruction and risked becoming a fourth restatement of two of those same
 * three asks. It was NOT cut, because it is the one place that shows overall
 * setup progress across all three steps at once — the only form of
 * gamification this page is allowed (standing rule: progress, nothing more)
 * — and `coverage`/`checklist`/`watchlist`/`boards` are the genuinely
 * user-scoped collections with no market number to lean on instead. What
 * changed is emphasis: the next-step CTA below is deliberately styled
 * `outline`, not the lime `default` used for a block's own big pitch
 * elsewhere on the page (e.g. a per-row "Follow" on `CoverageRescue` /
 * `TopCompetitors`). That's the resolution — this row is a return path back
 * to a step already introduced elsewhere, not a second full-throated ask for
 * the same thing. The progress bar and "N of 3 done" label stay the loudest
 * thing in the block, which is the point: nothing else on the page shows
 * that number.
 */
import { ArrowRight, Check, Circle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { useSetupChecklist, type SetupChecklistItem } from "@/insights-dashboard/lib/selectors";

const SECTION_LABEL = "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70";

/** Only the extension step's href is external; the other two are in-app routes. */
function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Renders `item.ctaLabel` as either an in-app `Link` or an external anchor
 * that opens in a new tab — never an in-app route standing in for a
 * destination that isn't actually part of FabAds.
 *
 * `tip`, when passed, wraps the rendered `Button` in `InfoTip` wrap-mode
 * (the button itself becomes the trigger, no added glyph) instead of a
 * second tooltip stacked beside it. Only the "follow-industries" step's
 * live CTA uses this — `action.follow-industry` describes what clicking it
 * actually does, which is only true while the step is still actionable.
 */
function ChecklistCta({
  item,
  variant,
  className,
  tip,
}: {
  item: SetupChecklistItem;
  variant: ButtonProps["variant"];
  className?: string;
  tip?: string;
}) {
  const button = isExternalHref(item.href) ? (
    <Button asChild variant={variant} size="sm" className={className}>
      <a href={item.href} target="_blank" rel="noopener noreferrer">
        {item.ctaLabel}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </Button>
  ) : (
    <Button asChild variant={variant} size="sm" className={className}>
      <Link to={item.href}>
        {item.ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Button>
  );

  if (tip) {
    return (
      <InfoTip tip={tip} asChild>
        {button}
      </InfoTip>
    );
  }

  return button;
}

/**
 * A row's label wrapped as a focusable, hoverable target for its
 * description — keyboard and screen-reader reachable, unlike the old plain
 * `title` attribute.
 */
function ChecklistLabel({ item, className }: { item: SetupChecklistItem; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`${item.label}: ${item.description}`}
          className={cn("min-w-0 truncate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", className)}
        >
          {item.label}
        </span>
      </TooltipTrigger>
      {/* Portalled — an unportalled TooltipContent clips inside any ancestor
          scroller. Same pattern as `InfoTip`. */}
      <TooltipPrimitive.Portal>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="text-xs leading-snug">{item.description}</p>
        </TooltipContent>
      </TooltipPrimitive.Portal>
    </Tooltip>
  );
}

export function SetupChecklist({ className }: { className?: string }): JSX.Element | null {
  const { items, progressPct, progressLabel, nextStep, complete, isLoading } = useSetupChecklist();

  // CHECK isLoading BEFORE reading `complete`/`nextStep`. The three items
  // always exist, but every one reads `done: false` while nothing has
  // resolved yet — rendering that verbatim would say "0 of 3 done" to a user
  // who may have already finished all three. A skeleton keeps this from
  // asserting an unearned zero. Shape matches the three real rows below so
  // the block doesn't reflow height once data resolves.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className={SECTION_LABEL}>Finish setup</h2>
            <InfoTip tip="block.setup-checklist" />
          </div>
          <Skeleton className="h-2.5 w-14" />
        </header>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-7 w-24 shrink-0" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      </section>
    );
  }

  // Hide quietly once all three are done — the page may still mount this
  // component, it just has nothing left to ask for.
  if (complete || !nextStep) {
    return null;
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className={SECTION_LABEL}>Finish setup</h2>
          <InfoTip tip="block.setup-checklist" />
        </div>
        <span className="shrink-0 text-xs font-medium text-foreground/70">{progressLabel}</span>
      </header>

      <Progress value={progressPct} className="h-1.5" />

      <TooltipProvider delayDuration={200}>
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => {
            if (item.done) {
              // Done: quiet row — checked, muted, no competing CTA. A small
              // management link stays so the step is still reachable.
              return (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <ChecklistLabel item={item} className="text-xs text-foreground/70" />
                  </div>
                  <ChecklistCta
                    item={item}
                    variant="link"
                    className="h-auto shrink-0 px-0 py-0 text-[11px] font-normal text-foreground/70"
                  />
                </div>
              );
            }

            if (item.key === nextStep.key) {
              // Next: the one prominent row on this block — but the CTA is
              // `outline`, not the lime `default` a block's own provocation
              // uses elsewhere on the page. This step's ask (follow an
              // industry / track a competitor) is already made, with its own
              // market-grounded case, by another block; this row is a return
              // path back to it, not a second full-throated pitch for it.
              return (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <ChecklistLabel item={item} className="text-xs font-medium text-foreground" />
                  </div>
                  <ChecklistCta
                    item={item}
                    variant="outline"
                    className="h-7 shrink-0 px-2.5 text-xs"
                    tip={item.key === "follow-industries" ? "action.follow-industry" : undefined}
                  />
                </div>
              );
            }

            // Later pending: visible label, no loud CTA.
            return (
              <div key={item.key} className="flex items-center gap-2">
                <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                <ChecklistLabel item={item} className="text-xs text-foreground/70" />
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </section>
  );
}
