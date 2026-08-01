/**
 * RelatedCreativesGrid — the overlay's bottom "Similar ads" role (Ref A: a
 * card grid of related creatives below the two-column detail). Raised to
 * Ref A's card quality — avatar + name + relation chip header, a one-line
 * honest copy, the real thumbnail as hero media with a format chip
 * overlaid, a footer fact — but built entirely from data the drawer already
 * has, no new selector, no invented relationship:
 *
 * 1. Variant tiles — the SAME creative's own crops/placements, i.e. exactly
 *    what VariantsList already groups via `groupVariants()`. The relation
 *    chip shows the real placement count for that variant, and the copy
 *    line uses the variant's REAL label from `dataset.variantsByCreative`
 *    (e.g. "Crop swap 1") instead of a fabricated "Variant 1".
 * 2. Dedup-sibling tile — the OTHER creative in this creative's %-match pair
 *    (`creative.dedupGroupId`), if one exists. A real, different Creative
 *    entity already in the dataset — clicking it opens it in the same
 *    drawer via the existing `view()` action, exactly like any grid card.
 *    This is the only tile that navigates: variant tiles point at the SAME
 *    creative already open, so making them "clickable" would just re-open
 *    the current drawer.
 *
 * Ref A's cards also carry a bookmark icon and a footer row of icon actions.
 * Neither is reproduced here — this prototype has no per-related-card save
 * action or share/link action wired to anything real, and a decorative
 * button that does nothing on click is worse than not having it (repo
 * anti-pattern: a control with nothing behind it reads as a bug). The
 * avatar reuses the existing `brand.logo` favicon convention already used
 * across Catalogue (CatalogueListPage/CatalogueDetailPage/CatalogueFinder)
 * rather than introducing a new avatar pattern.
 *
 * Renders nothing when there's exactly one variant and no dedup pair — an
 * empty/lonely "Similar ads" section would be worse than no section
 * (repo anti-pattern: a section with nothing behind it reads as a bug).
 *
 * Renders as bare content (no self-wrapped outer card) — only the individual
 * grid-item tiles are bordered, which is the grid's own item chrome, not an
 * extra wrapping level around the whole component. The drawer shell owns
 * whatever band/card wraps this component as a unit.
 */
import { Image as ImageIcon, LayoutGrid, Video, type LucideIcon } from "lucide-react";
import { getDataset } from "@/data/generator";
import { getBrand } from "@/mocks/shared/brands";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { groupVariants } from "@/creative-report/drawer/variantGrouping";
import { FORMAT_LABELS } from "@/creative-report/lib/paramSchema";
import { fmtDate, pluralize, truncate } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import type { Creative } from "@/data/model";

const CARD_NAME_MAX = 28;
const FORMAT_ICON: Record<Creative["format"], LucideIcon> = {
  video: Video,
  static: ImageIcon,
  carousel: LayoutGrid,
};

/** Header identity — the real brand logo (Catalogue's `brand.logo` favicon
 *  convention) with a format-icon fallback circle when the creative has no
 *  Catalogue brand link. Never a fabricated avatar. */
function CardAvatar({ creative }: { creative: Creative }) {
  const brand = creative.brandId ? getBrand(creative.brandId) : undefined;
  const Icon = FORMAT_ICON[creative.format];
  if (brand?.logo) {
    return <img src={brand.logo} alt="" className="h-5 w-5 shrink-0 rounded-full bg-muted" />;
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
      <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
    </span>
  );
}

function RelatedCard({
  creative,
  relationLabel,
  copy,
  footer,
  onClick,
}: {
  creative: Creative;
  relationLabel: string;
  copy: string;
  footer: string;
  onClick?: () => void;
}) {
  const name = truncate(creative.name, CARD_NAME_MAX);
  const Icon = FORMAT_ICON[creative.format];

  const inner = (
    <>
      <div className="flex items-center gap-2">
        <CardAvatar creative={creative} />
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
          title={name.truncated ? creative.name : undefined}
        >
          {name.text}
        </span>
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {relationLabel}
        </span>
      </div>
      <p className="truncate text-xs text-muted-foreground">{copy}</p>
      <div className="relative mx-auto w-fit overflow-hidden rounded-md">
        <CreativeThumb creative={creative} size={140} />
        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
          <Icon className="h-2.5 w-2.5" aria-hidden />
          {FORMAT_LABELS[creative.format]}
        </span>
      </div>
      <p className="truncate text-[11px] text-muted-foreground" title={footer}>
        {footer}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col gap-2.5 rounded-lg border border-border p-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex flex-col gap-2.5 rounded-lg border border-border p-3">{inner}</div>;
}

export function RelatedCreativesGrid({ rollup }: { rollup: CreativeRollup }) {
  const a = useCreativeActions();
  const dataset = getDataset();

  const groups = groupVariants(rollup);
  const variantGroups = groups.length > 1 ? groups : [];
  const variantsForCreative = dataset.variantsByCreative[rollup.creative.id] ?? [];

  const groupId = rollup.creative.dedupGroupId;
  const dedupMatch = rollup.creative.dedupMatch;
  const sibling =
    groupId !== undefined
      ? dataset.creatives.find((c) => c.dedupGroupId === groupId && c.id !== rollup.creative.id)
      : undefined;

  const hasAny = variantGroups.length > 0 || (sibling && dedupMatch !== undefined);
  if (!hasAny) return null;

  const parentBrand = rollup.creative.brandId ? getBrand(rollup.creative.brandId) : undefined;
  const parentCopy = parentBrand
    ? `${parentBrand.name} · ${rollup.creative.product}`
    : rollup.creative.product;

  const siblingBrand = sibling?.brandId ? getBrand(sibling.brandId) : undefined;
  const siblingCopy = sibling ? (siblingBrand ? `${siblingBrand.name} · ${sibling.product}` : sibling.product) : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Related creatives</span>
        <span className="text-xs text-muted-foreground">
          {pluralize(variantGroups.length + (sibling ? 1 : 0), "creative")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sibling && dedupMatch !== undefined && (
          <RelatedCard
            key={sibling.id}
            creative={sibling}
            relationLabel={`${Math.round(dedupMatch * 100)}% match`}
            copy={siblingCopy}
            footer={`Possible duplicate · first seen ${fmtDate(sibling.createdAt)}`}
            onClick={() => a.view(sibling.id)}
          />
        )}
        {variantGroups.map((g) => {
          const variantLabel = variantsForCreative.find((v) => v.id === g.variantId)?.label ?? "Variant";
          return (
            <RelatedCard
              key={g.variantId}
              creative={rollup.creative}
              relationLabel={pluralize(g.count, "placement")}
              copy={parentCopy}
              footer={`${variantLabel} · same creative`}
            />
          );
        })}
      </div>
    </div>
  );
}
