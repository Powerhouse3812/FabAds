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
 * `done` is never touched locally — every row reflects the selector's real
 * underlying state, and clicking a CTA only navigates. That matters most for
 * "Install the Chrome extension": there is no way to detect a real install
 * from here, and an earlier build of this checklist marked that row done
 * forever the instant the store link was clicked, even if the user bailed
 * before installing anything. This component renders that row through the
 * exact same "quiet until `done` says otherwise" path as the other two, and
 * its CTA opens the store in a new tab rather than an in-app route, so the
 * "you're leaving FabAds for this" cue is visible instead of implying the
 * click itself finishes the job.
 *
 * Visual weight is entirely a function of the data, not the dashboard state:
 * done rows are quiet (checked, muted, no button), the first remaining item
 * (`nextStep`) gets the one prominent filled button, and any other remaining
 * items get a smaller outline button — "one clear next action, not three
 * equal buttons." In the zero state that naturally makes the block feel like
 * the page's first instruction (nothing done yet to quiet down); in the
 * populated/complete state it collapses to three quiet checked rows with no
 * button at all, never a celebration banner.
 */
import { ArrowRight, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetupChecklist, type SetupChecklistItem } from "@/insights-dashboard/lib/selectors";

/** Only the extension step's href is external; the other two are in-app routes. */
function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Renders `item.ctaLabel` as either an in-app `Link` or an external anchor
 * that opens in a new tab — never an in-app route standing in for a
 * destination that isn't actually part of FabAds.
 */
function ChecklistCta({
  item,
  variant,
  className,
}: {
  item: SetupChecklistItem;
  variant: ButtonProps["variant"];
  className?: string;
}) {
  if (isExternalHref(item.href)) {
    return (
      <Button asChild variant={variant} size="sm" className={className}>
        <a href={item.href} target="_blank" rel="noopener noreferrer">
          {item.ctaLabel}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size="sm" className={className}>
      <Link to={item.href}>
        {item.ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Button>
  );
}

/** Same quiet-link treatment as the CTA button, sized down for a done row. */
function ChecklistQuietLink({ item }: { item: SetupChecklistItem }) {
  const className =
    "shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm";

  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.ctaLabel}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      {item.ctaLabel}
    </Link>
  );
}

function ChecklistRow({ item, isNextStep }: { item: SetupChecklistItem; isNextStep: boolean }) {
  if (item.done) {
    // Quiet + checked. A small text link keeps "go manage this" reachable
    // (user control, recognition over recall) without competing for
    // attention the way a full button would.
    return (
      <li className="flex items-start gap-2.5 py-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/40">
            {item.label}
          </span>
          <ChecklistQuietLink item={item} />
        </div>
      </li>
    );
  }

  if (isNextStep) {
    // The one visually prominent action on the whole card.
    return (
      <li className="rounded-md border border-border bg-muted/40 p-3">
        <div className="flex items-start gap-2.5">
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.description}</p>
            <ChecklistCta item={item} variant="default" className="mt-2.5" />
          </div>
        </div>
      </li>
    );
  }

  // Remaining, but not the immediate next step — visible and still
  // actionable, deliberately quieter than the prominent row above so there
  // is never more than one full-weight button on screen at once.
  return (
    <li className="flex items-start gap-2.5 py-2">
      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{item.label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.description}</p>
      </div>
      <ChecklistCta item={item} variant="outline" className="shrink-0" />
    </li>
  );
}

export function SetupChecklist({ className }: { className?: string }): JSX.Element {
  const { items, progressPct, progressLabel, nextStep, isLoading } = useSetupChecklist();

  // CHECK isLoading BEFORE reading `done`. The three items always exist, but
  // every one reads `done: false` while nothing has resolved yet — rendering
  // that verbatim would say "0 of 3 done" to a user who may have already
  // finished all three. A skeleton keeps this from asserting an unearned zero.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Get set up</h2>
          <Skeleton className="h-2.5 w-14" />
        </header>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <ul className="mt-3.5 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-start gap-2.5 py-2">
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Get set up</h2>
        <span className="shrink-0 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {progressLabel}
        </span>
      </header>

      <Progress value={progressPct} className="h-1.5" />

      <ul className="mt-3.5 space-y-1">
        {items.map((item) => (
          <ChecklistRow key={item.key} item={item} isNextStep={nextStep?.key === item.key} />
        ))}
      </ul>
    </section>
  );
}
