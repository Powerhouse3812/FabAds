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
 * CTA), the next step stays the one prominent row with the primary CTA, and
 * later pending steps show their label with no loud CTA. `done` is never
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
      <TooltipContent side="top" className="max-w-[240px]">
        <p className="text-xs leading-snug">{item.description}</p>
      </TooltipContent>
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
          <h2 className={SECTION_LABEL}>Finish setup</h2>
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
        <h2 className={SECTION_LABEL}>Finish setup</h2>
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
              // Next: the one prominent row with the primary CTA.
              return (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <ChecklistLabel item={item} className="text-xs font-medium text-foreground" />
                  </div>
                  <ChecklistCta item={item} variant="default" className="h-7 shrink-0 px-2.5 text-xs" />
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
