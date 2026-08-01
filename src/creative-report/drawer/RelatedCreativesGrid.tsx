/**
 * RelatedCreativesGrid — the overlay's bottom "Similar ads" role (Ref A: a
 * card grid of related creatives below the two-column detail). Built
 * entirely from data the drawer already has — no new selector, no invented
 * relationship:
 *
 * 1. Variant tiles — the SAME creative's own crops/placements, i.e. exactly
 *    what VariantsList already groups via `groupVariants()`. Shown as visual
 *    tiles instead of VariantsList's text rows so the bottom-of-overlay grid
 *    reads like Ref A's "Similar ads" without re-deriving anything.
 * 2. Dedup-sibling tile — the OTHER creative in this creative's 92%-match
 *    pair (`creative.dedupGroupId`), if one exists. A real, different
 *    Creative entity already in the dataset — clicking it opens it in the
 *    same drawer via the existing `view()` action (same as any grid card).
 *
 * Renders nothing when there's exactly one variant and no dedup pair — an
 * empty/lonely "Similar ads" section would be worse than no section
 * (repo anti-pattern: a section with nothing behind it reads as a bug).
 */
import { Image as ImageIcon, LayoutGrid, Video, type LucideIcon } from "lucide-react";
import { getDataset } from "@/data/generator";
import { getBrand } from "@/mocks/shared/brands";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { groupVariants } from "@/creative-report/drawer/variantGrouping";
import { pluralize, truncate, NAME_MAX } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import type { Creative } from "@/data/model";

const CARD_NAME_MAX = 32;
const FORMAT_ICON: Record<Creative["format"], LucideIcon> = {
  video: Video,
  static: ImageIcon,
  carousel: LayoutGrid,
};

function VariantTile({ creative, index, count }: { creative: Creative; index: number; count: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
      <CreativeThumb creative={creative} size={48} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">Variant {index + 1}</p>
        <p className="text-xs text-muted-foreground">
          {pluralize(count, "placement")} · same creative
        </p>
      </div>
    </div>
  );
}

function DedupSiblingTile({ creative, match }: { creative: Creative; match: number }) {
  const a = useCreativeActions();
  const brand = creative.brandId ? getBrand(creative.brandId) : undefined;
  const name = truncate(creative.name, CARD_NAME_MAX);
  const Icon = FORMAT_ICON[creative.format];

  return (
    <button
      type="button"
      onClick={() => a.view(creative.id)}
      className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-left transition-colors hover:border-foreground/20"
    >
      <CreativeThumb creative={creative} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground" title={name.truncated ? creative.name : undefined}>
          {name.text}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {brand ? `${brand.name} · ${creative.product}` : creative.product}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
        <Icon className="h-3 w-3" />
        {Math.round(match * 100)}% match
      </span>
    </button>
  );
}

export function RelatedCreativesGrid({ rollup }: { rollup: CreativeRollup }) {
  const groups = groupVariants(rollup);
  const variantTiles = groups.length > 1 ? groups : [];

  const groupId = rollup.creative.dedupGroupId;
  const dedupMatch = rollup.creative.dedupMatch;
  const sibling =
    groupId !== undefined
      ? getDataset().creatives.find((c) => c.dedupGroupId === groupId && c.id !== rollup.creative.id)
      : undefined;

  const hasAny = variantTiles.length > 0 || (sibling && dedupMatch !== undefined);
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Related creatives</span>
        <span className="text-xs text-muted-foreground">
          {pluralize(variantTiles.length + (sibling ? 1 : 0), "creative")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sibling && dedupMatch !== undefined && (
          <DedupSiblingTile creative={sibling} match={dedupMatch} />
        )}
        {variantTiles.map((g, i) => (
          <VariantTile key={g.variantId} creative={rollup.creative} index={i} count={g.count} />
        ))}
      </div>
    </div>
  );
}
