import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";

/**
 * GeneratedTabZeroState — the TRUE zero-data screen for the Library's
 * Scripts / Concepts / Storyboards tabs: the pool itself is empty, so no
 * filter change can bring anything back.
 *
 * Deliberately a different screen from each tab's "no match for your
 * filters" state (design system §3 — populated / partial / zero-data are
 * three distinct screens, and the filtered-empty one always implies data
 * exists somewhere, so its only honest exit is clearing the filter). This
 * one implies the opposite: nothing has been generated yet, so it explains
 * what lands here, how it gets here, and where the already-saved ones live.
 * Same reasoning `AdsGeneratedTab` uses to keep its filter-empty state
 * separate from `Library.tsx`'s `EmptyStateOnboarding`.
 *
 * The two exits are the only two true ones: Studio is the single place that
 * produces these drafts, and the type's Assets home is where anything
 * already saved out of this tab has gone.
 */
export function GeneratedTabZeroState({
  noun,
  description,
  assetsPath,
  assetsLabel,
  Icon,
}: {
  /** Plural, lowercase — "scripts" / "concepts" / "storyboards". */
  noun: string;
  /** One sentence: what a saved one of these actually is. */
  description: string;
  /** Where already-saved ones of this type live. */
  assetsPath: string;
  assetsLabel: string;
  Icon: LucideIcon;
}) {
  return (
    <EmptyState
      motif={
        <div className="flex h-16 w-16 items-center justify-center rounded-g6-card bg-g6-bg-spotlight text-g6-primary">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      }
      title={`No ${noun} generated yet`}
      description={`${description} Generate a batch in Studio and every draft lands here with its Batch ID — review it, then save the keepers to Assets.`}
      primaryAction={
        <Link
          to="/iq/genie6/generate"
          className="inline-flex h-9 items-center rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary focus-visible:ring-offset-2 focus-visible:ring-offset-g6-bg-container"
        >
          Open Studio
        </Link>
      }
      secondaryAction={
        <Link
          to={assetsPath}
          className="inline-flex h-9 items-center rounded-g6-pill border border-g6-border-secondary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text transition-colors hover:border-g6-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary focus-visible:ring-offset-2 focus-visible:ring-offset-g6-bg-container"
        >
          {assetsLabel}
        </Link>
      }
    />
  );
}
