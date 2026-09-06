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
 * ids), so this is the honest limit of what can match: any type without a
 * brand/product/angle to point at (Categories, Avatars, Voices, Templates,
 * References, Frameworks) always renders the zero-state, which is correct
 * given the data model rather than a bug to paper over.
 */
export function deriveGenieMatchCriteria(
  type: CatalogueType,
  item: any,
): { brandName?: string; productName?: string; angleLabel?: string } {
  if (type === "brands") return { brandName: item?.name };
  if (type === "products") {
    const brand = brands.find((b) => b.id === item?.brandId);
    return { brandName: brand?.name, productName: item?.name };
  }
  if (type === "angles") return { angleLabel: item?.label };
  if (type === "hooks") {
    const brand = item?.brandId ? brands.find((b) => b.id === item.brandId) : undefined;
    const angle = item?.angleId ? angles.find((a) => a.id === item.angleId) : undefined;
    return { brandName: brand?.name, angleLabel: angle?.label };
  }
  if (type === "concepts") {
    const brand = brands.find((b) => b.id === item?.brandId);
    return { brandName: brand?.name, angleLabel: item?.angle };
  }
  if (type === "audiences") {
    const brand = item?.brandId ? brands.find((b) => b.id === item.brandId) : undefined;
    return { brandName: brand?.name };
  }
  if (type === "scripts" || type === "ctas") {
    const brand = item?.brandId ? brands.find((b) => b.id === item.brandId) : undefined;
    return { brandName: brand?.name };
  }
  return {};
}

/**
 * §9 "An asset's detail view also lists the generations made from it. This
 * is what closes the loop between input and output." Reads
 * `useBatches()` and filters to batches whose `config` (brandName /
 * productName / angle) matches this asset — `RunBatch` carries no other
 * join key back to a Catalogue entity, so anything without a brand /
 * product / angle name to match against (Avatars, Voices, Templates,
 * References, Frameworks, Categories) honestly shows the zero-state
 * always. That's a real gap, not a placeholder — see the report.
 */
interface GenerationsFromAssetProps {
  brandName?: string;
  productName?: string;
  angleLabel?: string;
  useInGenieHref: string;
  className?: string;
}

export function GenerationsFromAsset({
  brandName,
  productName,
  angleLabel,
  useInGenieHref,
  className,
}: GenerationsFromAssetProps) {
  const batches = useBatches();

  const matched = useMemo(() => {
    if (!brandName && !productName && !angleLabel) return [];
    return batches.filter((b) => {
      const cfg = b.config;
      if (!cfg) return false;
      if (brandName && cfg.brandName !== brandName) return false;
      if (productName && cfg.productName !== productName) return false;
      if (angleLabel && (cfg.angle ?? "").toLowerCase() !== angleLabel.toLowerCase()) return false;
      return true;
    });
  }, [batches, brandName, productName, angleLabel]);

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
