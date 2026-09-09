import { resolveUploadedImage } from "@/genie6/lib/uploaded-image-store";
import { isEntityOptionalMode } from "./useWizard";
import type { UseWizardReturn } from "./useWizard";
import type { AlphaMode } from "../screens/StudioHome";
import { MODES } from "../data/modes";
import {
  brands as ALL_BRANDS,
  products as ALL_PRODUCTS,
  categories as ALL_CATEGORIES,
  getInstructionsForEntity,
  getWinnerAdsForEntity,
  getReferenceUrlsForEntity,
  type Brand,
  type Product,
  type Category,
  type EntityType,
  type EntityId,
  type KbInstruction,
  type KbConcept,
  type WinnerAd,
  type ReferenceUrl,
} from "@/mocks/shared";
import { ANGLE_CHIP_LABEL } from "../components/PromptReferenceBar";
import {
  useSavedWinnersForEntity,
  useSavedConceptsForEntity,
  useSavedInstructionsForEntity,
} from "@/genie6/concepts/saved-store";

/**
 * ONE derivation of the wizard's "Overview" context — brand / product /
 * category / format / angle / readiness — consumed by BOTH presentations of
 * it: the vertical `ContextRail` and the horizontal `ContextOverviewBand`.
 *
 * The derivation lives here rather than in either component on purpose: two
 * surfaces re-deriving the same summary is exactly how this repo ended up
 * with three duplicate MODE_LABEL maps and labels that lie. Add a field here,
 * not a second computation in a component.
 */

/** Reads the title straight off the MODES roster rather than keeping a second
 *  copy of it — the hand-maintained map this replaced had already gone stale
 *  (it was missing entries by the time Podcast and Animated AI were added). */
function modeLabel(m: AlphaMode | undefined): string | null {
  if (!m) return null;
  return MODES.find((mode) => mode.id === m)?.title ?? null;
}

/* ── Ad type (Step-2 tab), independent of Mode ───────────────────────────
 * §5: "The tab the user picks is what determines the ad type. There is no
 * separate ad-type screen anywhere in Genie." `studioMode` is the flow the
 * user launched from Studio home. It IS wired to the URL now (`?studioMode`,
 * added 2026-09-09 — this comment used to say the opposite), but it can still
 * go stale relative to whichever Step-2 tab the user is actually sitting on,
 * so the ad-type chip must read the raw entity ids, not the Mode.
 * Category wins over a hero product picked inside it — §4: "a picked
 * product becomes the hero of the ad" — the ad stays a Category Ad. */
export type AdTypeKey = "brand-ad" | "product-ad" | "performance-ad";
const AD_TYPE_LABEL: Record<AdTypeKey, string> = {
  "brand-ad": "Brand Ad",
  "product-ad": "Product Ad",
  "performance-ad": "Category Ad",
};

function deriveAdType(state: {
  categoryId: string | null;
  productId: string | null;
  brandId: string | null;
}): AdTypeKey | null {
  if (state.categoryId) return "performance-ad";
  if (state.productId) return "product-ad";
  if (state.brandId) return "brand-ad";
  return null;
}

/* ── Mode-aware readiness gate ────────────────────────────────────────────
 * §4's table is per-ad-type/Mode, not a single blanket rule:
 *   Brand Ad          → requires Brand alone
 *   Product Ad        → requires Product (or, per §21.2's third route, a
 *                        brand + one uploaded image standing in for it)
 *   Category (Perf.)  → requires Category; a hero product is optional
 *   Product Shoot     → requires a Product, or a Category(/product) — a
 *                        brand alone is NOT enough, brand details travel
 *                        with the product. This was the named defect: the
 *                        old mode-blind gate let Product Shoot read READY
 *                        on a brand alone.
 * Social / Affiliate / Custom-Manual / no Mode yet fall back to the
 * original permissive check (no §4 row names them). */
function computeHasRequiredEntity(
  mode: AlphaMode | undefined,
  opts: {
    hasCategory: boolean;
    hasSelectedProduct: boolean;
    hasBrand: boolean;
    hasUploadedImage: boolean;
  },
): boolean {
  const { hasCategory, hasSelectedProduct, hasBrand, hasUploadedImage } = opts;
  // §10a — a Mode whose entity rule makes all three optional (Social, Animated
  // AI, Custom, Podcast) is READY with nothing picked. Maalik's words were
  // "either user can pick one or nothing from these 3", so the permissive
  // default below still demanded *something* and rendered "PICK A BRAND,
  // PRODUCT OR CATEGORY" — a nag for a requirement that doesn't exist, and the
  // exact "reads as unfinished rather than deliberate" problem step 0 exists
  // to remove.
  if (isEntityOptionalMode(mode ?? null)) return true;
  switch (mode) {
    case "brand-ad":
      return hasBrand;
    case "product-ad":
      return hasSelectedProduct || (hasBrand && hasUploadedImage);
    case "performance-ad":
      return hasCategory;
    case "product-shoot":
      return hasSelectedProduct || hasCategory;
    default:
      return (
        hasCategory ||
        hasSelectedProduct ||
        (hasBrand && hasUploadedImage) ||
        (hasBrand && !hasSelectedProduct && !hasCategory)
      );
  }
}

/** Pending-state copy for the readiness caption, matched to what §4 actually
 *  requires for the active Mode (rather than one generic message for all). */
function missingEntityCaption(mode: AlphaMode | undefined): string {
  switch (mode) {
    case "brand-ad":
      return "PICK A BRAND";
    case "product-ad":
      return "PICK A PRODUCT";
    case "performance-ad":
      return "PICK A CATEGORY";
    case "product-shoot":
      return "PICK A PRODUCT OR CATEGORY";
    default:
      return "PICK A BRAND, PRODUCT OR CATEGORY";
  }
}

/** The derived shape both Overview surfaces render from. Field names are a
 *  cross-component contract — renaming one silently breaks the other surface. */
export interface StudioContextSummary {
  brand: Brand | null;
  selectedProduct: Product | undefined;
  category: Category | null;
  hasUploadedImage: boolean;
  uploadedImageUrl: string | undefined;
  productName: string | null;
  titleText: string;
  formatText: string | null;
  modeText: string | null;
  adTypeKey: AdTypeKey | null;
  adTypeLabel: string | null;
  isAngleAuto: boolean;
  angleText: string | null;
  hasRequiredEntity: boolean;
  complete: boolean;
  readinessCaption: string;
  readinessTone: "ready" | "pending";
  entity: { type: EntityType; id: EntityId } | null;
  instructionGroups: {
    main: KbInstruction | null;
    custom: KbInstruction[];
    angles: KbInstruction[];
  };
  winners: WinnerAd[];
  refs: ReferenceUrl[];
  instructionsCount: number;
  savedConcepts: KbConcept[];
  otherProducts: Product[];
}

export function useStudioContextSummary(
  wizard: UseWizardReturn,
  studioMode?: AlphaMode,
): StudioContextSummary {
  const { state } = wizard;

  const selectedProduct = ALL_PRODUCTS.find((p) => p.id === state.productId);
  // A-12.46: brand resolution now falls back to state.brandId when no product
  // is picked yet. Earlier the rail only read brand FROM the product, so a
  // brand-only or category-only selection silently showed "No brand".
  const brand =
    (selectedProduct && ALL_BRANDS.find((b) => b.id === selectedProduct.brandId)) ||
    (state.brandId
      ? ALL_BRANDS.find((b) => b.id === state.brandId)
      : undefined) ||
    null;

  // Precedence: the category the user EXPLICITLY picked wins over the one
  // inferred from the hero product. Under the old Step-2 XOR only one of the
  // two could ever be set, so the order didn't matter; Performance Ad now
  // legitimately holds a category AND a product at once (modes.ts `also`), and
  // with the product first the rail reported the product's own category —
  // "Hair Care" for a shampoo picked inside a Skin Care ad — contradicting the
  // mandatory pick it was made under. Same precedence as
  // `buildScriptContext` in useWizard.ts, which already had it this way round.
  const category =
    (state.categoryId
      ? ALL_CATEGORIES.find((c) => c.id === state.categoryId)
      : undefined) ||
    (selectedProduct?.categoryId &&
      ALL_CATEGORIES.find((c) => c.id === selectedProduct.categoryId)) ||
    null;

  const hasUploadedImage = !!state.uploadedProductImage;
  // DEFECT FIX: state.uploadedProductImage is an opaque TOKEN (see
  // uploaded-image-store.ts) — resolve it back to the actual data: URL only
  // where something needs to paint it. undefined when the token no longer
  // resolves (e.g. after a reload); every render site below must treat that
  // as "needs re-upload," never point <img src> at the raw token.
  const uploadedImageUrl = resolveUploadedImage(state.uploadedProductImage);
  const productName =
    selectedProduct?.name ?? category?.name ?? (hasUploadedImage ? "Uploaded product" : null);

  const formatText =
    state.format === "image" ? "Image" : state.format === "video" ? "Video" : null;
  const modeText = modeLabel(studioMode);
  // §5's ad type is the Step-2 tab, not the Mode — see deriveAdType above.
  const adTypeKey = deriveAdType(state);
  const adTypeLabel = adTypeKey ? AD_TYPE_LABEL[adTypeKey] : null;
  const isAngleAuto = !state.angleId;
  const angleText = state.angleId
    ? (ANGLE_CHIP_LABEL[state.angleId] ?? state.angleId)
    : null;

  // §4 — THIS IS THE ONE READINESS GATE, keyed off the active Mode — don't
  // add a second one beside it. It used to be mode-blind (a flat OR across
  // category/product/brand) which let e.g. Product Shoot read "Ready to
  // generate" on a brand alone; computeHasRequiredEntity applies §4's
  // per-Mode row instead.
  const hasRequiredEntity = computeHasRequiredEntity(studioMode, {
    hasCategory: !!category,
    hasSelectedProduct: !!selectedProduct,
    hasBrand: !!brand,
    hasUploadedImage,
  });
  // §5 — Angle defaults to "Auto", a real answer, not a blank: Auto must
  // satisfy readiness on its own, so it's not part of this check.
  const complete = hasRequiredEntity && !!state.format;

  // Resolve readiness caption. Tone is orange when pending, neutral when ready.
  let readinessCaption: string;
  let readinessTone: "ready" | "pending";
  if (complete) {
    readinessCaption = "READY TO GENERATE";
    readinessTone = "ready";
  } else if (!hasRequiredEntity) {
    readinessCaption = missingEntityCaption(studioMode);
    readinessTone = "pending";
  } else if (!state.format) {
    readinessCaption = "PICK A FORMAT";
    readinessTone = "pending";
  } else {
    readinessCaption = "ADD MORE CONTEXT TO IMPROVE OUTPUT";
    readinessTone = "pending";
  }

  // Resolve active KB entity (priority: product → brand → category).
  let entity: { type: EntityType; id: EntityId } | null = null;
  if (state.productId) {
    entity = { type: "product", id: state.productId as EntityId };
  } else if (state.brandId) {
    entity = { type: "brand", id: state.brandId as EntityId };
  } else if (state.categoryId) {
    entity = { type: "category", id: state.categoryId as EntityId };
  }

  // Cross-app saved-store hooks. Always called (rules-of-hooks); narrow with
  // null entity by passing harmless dummies that produce empty arrays.
  const savedInstr = useSavedInstructionsForEntity(
    entity?.type ?? "brand",
    entity?.id ?? "__none__",
  );
  const savedWinners = useSavedWinnersForEntity(
    entity?.type ?? "brand",
    entity?.id ?? "__none__",
  );
  const savedConcepts = useSavedConceptsForEntity(
    entity?.type ?? "brand",
    entity?.id ?? "__none__",
  );

  const seedGroups = entity
    ? getInstructionsForEntity(entity.type, entity.id)
    : { main: null, custom: [], angles: [] };
  const instructionGroups = entity
    ? { ...seedGroups, custom: [...seedGroups.custom, ...savedInstr] }
    : seedGroups;
  const winners = entity
    ? [...getWinnerAdsForEntity(entity.type, entity.id), ...savedWinners]
    : [];
  const refs = entity ? getReferenceUrlsForEntity(entity.type, entity.id) : [];
  // Saved concepts not surfaced in the rail today (concepts panel was removed
  // in earlier rev) — but returned on the summary so future surfaces can use
  // it without adding a second call to the saved store.

  const instructionsCount =
    (instructionGroups.main ? 1 : 0) +
    instructionGroups.custom.length +
    instructionGroups.angles.length;

  const otherProducts = ALL_PRODUCTS.filter(
    (p) =>
      p.brandId === selectedProduct?.brandId &&
      p.categoryId === selectedProduct?.categoryId &&
      p.id !== state.productId,
  ).slice(0, 4);

  const titleText = `${brand?.name ?? "No brand"} / ${productName ?? "No product"}`;

  return {
    brand,
    selectedProduct,
    category,
    hasUploadedImage,
    uploadedImageUrl,
    productName,
    titleText,
    formatText,
    modeText,
    adTypeKey,
    adTypeLabel,
    isAngleAuto,
    angleText,
    hasRequiredEntity,
    complete,
    readinessCaption,
    readinessTone,
    entity,
    instructionGroups,
    winners,
    refs,
    instructionsCount,
    savedConcepts,
    otherProducts,
  };
}
