import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Wand2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
// Owned by the RUN STORE agent (Genie 2.0 build brief §8). Coded against
// the documented signature — `useBatches(): RunBatch[]` — which may not
// exist on disk yet while that agent is still building it; expected.
import { useBatches } from "@/genie6/lib/genieRunStore";
import { batchStatus, batchDoneCount, type RunBatch } from "@/genie6/lib/genieRunTypes";
import { SectionHeader } from "@/genie6/studio-v4/components/SectionHeader";
import { brands, angles } from "@/mocks/shared";
import type { CatalogueType } from "./assetTypes";

/**
 * Best-effort join key for `GenerationsFromAsset` — `RunBatch.config` only
 * ever carries `brandName` / `productName` / `angle` (free strings, no
 * ids). `tracked` says whether that's enough to HONESTLY attribute a batch
 * to this specific asset:
 *
 *   - Brands / Products / Angles / Hooks / Concepts (5 types) get a real,
 *     specific criterion (name, or name+name, or a label) — `tracked: true`.
 *   - Categories / Avatars / Voices / Frameworks / Templates (5 types) have
 *     no brand/product/angle to point at whatsoever.
 *   - Audiences / Scripts / CTAs (3 types) carry only a `brandId` → the
 *     only criterion available is the parent brand's name, which would
 *     match EVERY batch run for that brand — not this specific audience /
 *     script / cta. That's a false positive dressed up as a real join, so
 *     it's treated the same as "no criterion" rather than silently
 *     over-matching.
 *
 * That's 8 of 13 types where `tracked: false` — see the report for why an
 * honest "not tracked" beats a confident, fabricated "0".
 */
export interface GenieMatchCriteria {
  brandName?: string;
  productName?: string;
  angleLabel?: string;
  tracked: boolean;
}

export function deriveGenieMatchCriteria(
  type: CatalogueType,
  item: any,
): GenieMatchCriteria {
  if (type === "brands") return { brandName: item?.name, tracked: true };
  if (type === "products") {
    const brand = brands.find((b) => b.id === item?.brandId);
    return { brandName: brand?.name, productName: item?.name, tracked: true };
  }
  if (type === "angles") return { angleLabel: item?.label, tracked: true };
  if (type === "hooks") {
    const brand = item?.brandId ? brands.find((b) => b.id === item.brandId) : undefined;
    const angle = item?.angleId ? angles.find((a) => a.id === item.angleId) : undefined;
    return { brandName: brand?.name, angleLabel: angle?.label, tracked: true };
  }
  if (type === "concepts") {
    const brand = brands.find((b) => b.id === item?.brandId);
    return { brandName: brand?.name, angleLabel: item?.angle, tracked: true };
  }
  // Categories / Avatars / Voices / Frameworks / Templates: no criterion.
  // Audiences / Scripts / CTAs: brand-only would over-match every batch for
  // the brand, which is worse than an honest zero — see the docblock above.
  return { tracked: false };
}

/**
 * §9 "An asset's detail view also lists the generations made from it. This
 * is what closes the loop between input and output." Reads `useBatches()`
 * and filters to batches whose `config` (brandName / productName / angle)
 * matches this asset — but ONLY when `tracked` says that match is honest
 * for this asset type (see `deriveGenieMatchCriteria` above). For the 8
 * types where it isn't, this renders a plain "not tracked" state instead
 * of a fabricated "0 generations", which reads as a confident (and false)
 * claim that nothing has ever been generated.
 */
interface GenerationsFromAssetProps extends GenieMatchCriteria {
  useInGenieHref: string;
  className?: string;
  /** Singular label for copy, e.g. "audience" / "template". Defaults to
   *  "asset" for callers that don't have one handy. */
  assetLabel?: string;
}

export function GenerationsFromAsset({
  brandName,
  productName,
  angleLabel,
  tracked,
  useInGenieHref,
  className,
  assetLabel = "asset",
}: GenerationsFromAssetProps) {
  const batches = useBatches();

  const matched = useMemo(() => {
    if (!tracked) return [];
    if (!brandName && !productName && !angleLabel) return [];
    return batches.filter((b) => {
      const cfg = b.config;
      if (!cfg) return false;
      if (brandName && cfg.brandName !== brandName) return false;
      if (productName && cfg.productName !== productName) return false;
      if (angleLabel && (cfg.angle ?? "").toLowerCase() !== angleLabel.toLowerCase()) return false;
      return true;
    });
  }, [batches, brandName, productName, angleLabel, tracked]);

  if (!tracked) {
    return (
      <section className={className}>
        <SectionHeader title="Generations made from this" />
        <div className="mt-2 flex flex-col items-start gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            Not tracked for {assetLabel} assets yet — Genie's run history doesn't carry a link back
            to a specific {assetLabel}, so this can't honestly show a count.
          </p>
          <Link
            to={useInGenieHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:scale-[1.02] transition-transform"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Use in Genie
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionHeader title={`Generations made from this · ${matched.length}`} />
      <div className="mt-2">
        {matched.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              Nothing generated from this yet — the loop from input to output starts with a run.
            </p>
            <Link
              to={useInGenieHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:scale-[1.02] transition-transform"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Use in Genie
            </Link>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {matched.slice(0, 8).map((b) => (
              <BatchRow key={b.batchId} batch={b} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const STATUS_STYLE: Record<string, string> = {
  running: "border-primary/30 bg-primary/10 text-primary-text",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  partial: "border-warning-text/30 bg-warning-text/10 text-warning-text",
  cancelled: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

function BatchRow({ batch }: { batch: RunBatch }) {
  const status = batchStatus(batch);
  const date = new Date(batch.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{batch.label}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {batch.batchId} · {date}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {batchDoneCount(batch)} outputs
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
            STATUS_STYLE[status],
          )}
        >
          {status}
        </span>
        <Link
          to={`/iq/genie6/library?q=${encodeURIComponent(batch.batchId)}`}
          className="text-muted-foreground hover:text-foreground"
          aria-label={`Open ${batch.batchId} in Library`}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}
