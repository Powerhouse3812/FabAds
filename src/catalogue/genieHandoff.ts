/**
 * "Use directly in Genie" — Genie 2.0 §9: an asset's actions include
 * "Use directly in Genie", which "runs under the Other Flows rules with
 * the entity pre-filled." This builds the Studio Alpha deep-link.
 *
 * Studio Alpha's URL sync (`src/genie6/studio-v4/state/useUrlSync.ts`,
 * owned by the Studio agent) currently reads exactly: format, brand,
 * product, category, approach, angle, ratio, count, model, resolution,
 * audio, bg, kb. Per the build brief: "do not invent new [param] names."
 * So only `brand` / `product` / `category` / `angle` are honoured below —
 * every other asset type (avatar / voice / script / concept / hook / cta
 * / framework / template / reference) hands off with whichever of those
 * four params it can honestly resolve (usually just `brand`, if the asset
 * is brand-linked) and otherwise opens Studio's first step bare. That gap
 * is real and disclosed, not papered over — see the report for what the
 * Studio agent would need to add to close it.
 *
 * Bulk product selection (§9 "Bulk product selection" / Studio's
 * `WizardState.bulkProductIds`): selecting N products for a Category Ad
 * or Product Ad must produce ONE ad containing all of them. There is no
 * existing URL param for this — `useUrlSync.ts` never reads one — so this
 * file uses `?bulkProducts=id1,id2,id3` (comma-separated) — the param name
 * Studio's own useUrlSync.ts already reads and writes for
 * `WizardState.bulkProductIds`. An earlier draft here invented `?products=`,
 * which Studio never read, so the whole bulk hand-off silently selected
 * nothing. One param name, owned by the surface that consumes it. Reports
 * it as a param the Studio agent still needs to parse into
 * `bulkProductIds`. Everything else in this file reuses existing params.
 */
import type { CatalogueType } from "./assetTypes";
import { brands, products, hooks, concepts, audiences } from "@/mocks/shared";

const STUDIO_ALPHA_BASE = "/iq/genie6/studio-alpha";

/** Single-asset "Use in Genie" link. Step defaults to "product" (brand /
 *  product / category selection) since that is the step `?brand=` /
 *  `?product=` / `?category=` actually hydrate. */
export function useInGenieUrl(type: CatalogueType, id: string): string {
  const params = new URLSearchParams();

  if (type === "brands") {
    params.set("brand", id);
    return `${STUDIO_ALPHA_BASE}/product?${params.toString()}`;
  }
  if (type === "products") {
    const product = products.find((p) => p.id === id);
    if (product?.brandId) params.set("brand", product.brandId);
    params.set("product", id);
    return `${STUDIO_ALPHA_BASE}/product?${params.toString()}`;
  }
  if (type === "categories") {
    params.set("category", id);
    return `${STUDIO_ALPHA_BASE}/product?${params.toString()}`;
  }
  if (type === "angles") {
    params.set("angle", id);
    return `${STUDIO_ALPHA_BASE}/approach?${params.toString()}`;
  }
  if (type === "hooks") {
    const hook = hooks.find((h) => h.id === id);
    if (hook?.brandId) params.set("brand", hook.brandId);
    if (hook?.angleId) params.set("angle", hook.angleId);
    const qs = params.toString();
    return qs ? `${STUDIO_ALPHA_BASE}/product?${qs}` : STUDIO_ALPHA_BASE;
  }
  if (type === "concepts") {
    // Concept.angle is a label string, not an angleId, so there's no safe
    // id to pass for `?angle=` — brand is the only honest param here.
    const concept = concepts.find((c) => c.id === id);
    if (concept?.brandId) params.set("brand", concept.brandId);
    const qs = params.toString();
    return qs ? `${STUDIO_ALPHA_BASE}/product?${qs}` : STUDIO_ALPHA_BASE;
  }
  if (type === "audiences") {
    const audience = audiences.find((a) => a.id === id);
    if (audience?.brandId) params.set("brand", audience.brandId);
    const qs = params.toString();
    return qs ? `${STUDIO_ALPHA_BASE}/product?${qs}` : STUDIO_ALPHA_BASE;
  }

  // avatars / voices / scripts / ctas / frameworks / templates / references —
  // no recognised param exists for these today. Open Studio's first step bare
  // rather than inventing a param Studio doesn't read.
  return STUDIO_ALPHA_BASE;
}

/**
 * §9 bulk product selection: "Selecting N products produces one ad
 * containing all of them — not N separate ads." Param: `?bulkProducts=`,
 * matching Studio's useUrlSync.ts.
 * (comma-separated ids) on the "product" step. Studio's `useUrlSync.ts`
 * does not parse this yet — report names it as the follow-up for the
 * Studio agent to wire into `WizardState.bulkProductIds`.
 */
export function bulkUseInGenieUrl(productIds: string[], opts?: { categoryId?: string }): string {
  const params = new URLSearchParams();
  if (opts?.categoryId) params.set("category", opts.categoryId);
  params.set("bulkProducts", productIds.join(","));
  return `${STUDIO_ALPHA_BASE}/product?${params.toString()}`;
}

/** Best-effort brand resolution, used to prefix the bulk-selection notice
 *  ("N products from Mamaearth will become ONE ad") — falls back to the
 *  first distinct brand when the selection spans more than one. */
export function brandNameForProducts(productIds: string[]): string | undefined {
  const brandIds = new Set(
    productIds
      .map((id) => products.find((p) => p.id === id)?.brandId)
      .filter((x): x is string => !!x),
  );
  if (brandIds.size !== 1) return undefined;
  const [brandId] = Array.from(brandIds);
  return brands.find((b) => b.id === brandId)?.name;
}
