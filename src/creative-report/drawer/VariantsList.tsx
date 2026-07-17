/**
 * VariantsList — variant rows + the merge/split control on the 92%-match
 * dedup pair (handoff §5.2). The dedup banner is the one allowed sub-container
 * here; the variant rows themselves stay flat.
 */
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pluralize } from "@/creative-report/lib/format";
import { useDedupResolution, setDedupResolution } from "@/creative-report/actions/actionStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function VariantsList({ rollup }: { rollup: CreativeRollup }) {
  const groupId = rollup.creative.dedupGroupId;
  const dedupMatch = rollup.creative.dedupMatch;
  const resolution = useDedupResolution(groupId);

  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const inst of rollup.instances) {
    if (!counts.has(inst.variantId)) order.push(inst.variantId);
    counts.set(inst.variantId, (counts.get(inst.variantId) ?? 0) + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Variants</span>
        <span className="text-xs text-muted-foreground">{pluralize(order.length, "variant")}</span>
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
        {order.map((variantId, i) => (
          <div key={variantId} className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">Variant {i + 1}</span>
            <span className="text-xs text-muted-foreground">
              {pluralize(counts.get(variantId) ?? 0, "placement")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
