/**
 * LaunchedBeforeCard — cross-module "launched before" recommendation
 * (iter-2 P5). Surfaces real past Creative Report performance at the
 * decision point in OTHER modules (Launch's confirm/relaunch step,
 * Genie 6's concept-generation step) — see `lib/launchedBefore.ts` for
 * the read-only data source and the product rationale.
 *
 * Pure presentational, self-contained: no Creative-Report-only
 * context/providers, so it mounts cleanly from Genie 6 (a different
 * module) as well as from Creative Report itself. Renders nothing when
 * there's no brand/category context or no real past creatives to show —
 * never a fabricated or empty-looking card.
 *
 * Hard rule: this is literal past performance, not a prediction for a
 * NEW creative — the header copy says so explicitly.
 */
import { TrendingUp } from "lucide-react";
import { findLaunchedBefore } from "@/creative-report/lib/launchedBefore";
import { fmtCompactCurrency, fmtMultiple, truncate, NAME_MAX } from "@/creative-report/lib/format";
import { BucketChip } from "@/creative-report/components/BucketChip";

export function LaunchedBeforeCard({
  brandId,
  categoryId,
  excludeCreativeId,
  title = "Launched before",
}: {
  brandId?: string | null;
  categoryId?: string | null;
  /** Creative currently being acted on — never recommended back to itself. */
  excludeCreativeId?: string;
  title?: string;
}) {
  const matches = findLaunchedBefore({ brandId, categoryId, excludeCreativeId });
  if (matches.length === 0) return null;

  // Honest scope label: only claim brand-matching when a brand was matched.
  const scope = brandId ? "this brand" : "this category";

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        {title}
      </div>
      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
        Real results from past creatives for {scope} — not a prediction for anything new.
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {matches.map((r) => {
          const name = truncate(r.creative.name, NAME_MAX);
          return (
            <li
              key={r.creative.id}
              className="flex items-center justify-between gap-2 text-[13px]"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="truncate text-foreground"
                  title={name.truncated ? r.creative.name : undefined}
                >
                  {name.text}
                </span>
                {r.bucket && <BucketChip bucket={r.bucket} size="xs" />}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {fmtMultiple(r.metrics.roas)} · {fmtCompactCurrency(r.metrics.spend)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
