/**
 * VariantsList — variant rows + the merge/split control on the 92%-match
 * dedup pair (handoff §5.2). The dedup banner is the one allowed sub-container
 * here; the variant rows themselves stay flat.
 *
 * Grouping logic lives in the sibling `variantGrouping.ts` module (not here)
 * so RelatedCreativesGrid (the 1100px overlay's bottom "similar ads" grid)
 * can render the SAME variant grouping as visual tiles instead of
 * re-deriving it — one source of truth, no new data — without this module
 * having to export anything besides the component.
 */
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pluralize } from "@/creative-report/lib/format";
import { useDedupResolution, setDedupResolution } from "@/creative-report/actions/actionStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { groupVariants } from "@/creative-report/drawer/variantGrouping";

export function VariantsList({ rollup }: { rollup: CreativeRollup }) {
  const groupId = rollup.creative.dedupGroupId;
  const dedupMatch = rollup.creative.dedupMatch;
  const resolution = useDedupResolution(groupId);

  const groups = groupVariants(rollup);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Variants</span>
        <span className="text-xs text-muted-foreground">{pluralize(groups.length, "variant")}</span>
      </div>

      {groupId !== undefined && dedupMatch !== undefined && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Possibly the same creative ({Math.round(dedupMatch * 100)}% match)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            We detected a near-duplicate — same asset, different crop. Merge to report them as one creative, or
            keep them split.
          </p>
          <div className="mt-2 flex items-center gap-2">
            {resolution === "merged" ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-text">
                  Merged <Check className="h-3 w-3" />
                </span>
                <Button size="sm" variant="outline" onClick={() => setDedupResolution(groupId!, "split")}>
                  Split
                </Button>
              </>
            ) : resolution === "split" ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  Kept split <Check className="h-3 w-3" />
                </span>
                <Button size="sm" variant="outline" onClick={() => setDedupResolution(groupId!, "merged")}>
                  Merge
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => setDedupResolution(groupId!, "merged")}>
                  Merge
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDedupResolution(groupId!, "split")}>
                  Keep split
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {groups.map((g, i) => (
          <div key={g.variantId} className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">Variant {i + 1}</span>
            <span className="text-xs text-muted-foreground">{pluralize(g.count, "placement")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
