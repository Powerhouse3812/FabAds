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
 * Scannable pass (2026-08): the surface is now exactly three marks — the
 * progress bar, "N of 3 done", and the single next step as one button. The
 * other two items' descriptions never rendered as prose here; the next
 * step's own description moves to a `title` tooltip on its row instead of a
 * paragraph. `done` is never touched locally — the row always reflects the
 * selector's real state, and the CTA only navigates.
 *
 * "Install the Chrome extension" has no way to detect a real install from
 * here, so its CTA opens the store in a new tab (external link icon) rather
 * than an in-app route — the click must not imply the install finished.
 *
 * When `complete` is true the block renders nothing. The page may still
 * mount it — it just goes quiet instead of showing a celebration banner.
 */
import { ArrowRight, Circle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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

export function SetupChecklist({ className }: { className?: string }): JSX.Element | null {
  const { progressPct, progressLabel, nextStep, complete, isLoading } = useSetupChecklist();

  // CHECK isLoading BEFORE reading `complete`/`nextStep`. The three items
  // always exist, but every one reads `done: false` while nothing has
  // resolved yet — rendering that verbatim would say "0 of 3 done" to a user
  // who may have already finished all three. A skeleton keeps this from
  // asserting an unearned zero.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className={SECTION_LABEL}>Finish setup</h2>
          <Skeleton className="h-2.5 w-14" />
        </header>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-7 w-24 shrink-0" />
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

      <div
        title={nextStep.description}
        className="mt-3 flex items-center justify-between gap-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-xs font-medium text-foreground">{nextStep.label}</span>
        </div>
        <ChecklistCta item={nextStep} variant="default" className="h-7 shrink-0 px-2.5 text-xs" />
      </div>
    </section>
  );
}
