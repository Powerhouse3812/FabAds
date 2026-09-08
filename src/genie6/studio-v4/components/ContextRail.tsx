import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ImageOff,
  Link2,
  PanelRightClose,
  Sparkles,
  Tag as TagIcon,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveUploadedImage } from "@/genie6/lib/uploaded-image-store";
import type { UseWizardReturn } from "../state/useWizard";
import type { AlphaMode } from "../screens/StudioHome";
import {
  brands as ALL_BRANDS,
  products as ALL_PRODUCTS,
  categories as ALL_CATEGORIES,
  getInstructionsForEntity,
  getWinnerAdsForEntity,
  getReferenceUrlsForEntity,
  shortUrl,
  type EntityType,
  type EntityId,
} from "@/mocks/shared";
import { ANGLE_CHIP_LABEL } from "./PromptReferenceBar";
import { SectionHeader } from "./SectionHeader";
import { ConceptAngleRail } from "./ConceptAngleRail";
import {
  useSavedWinnersForEntity,
  useSavedConceptsForEntity,
  useSavedInstructionsForEntity,
} from "@/genie6/concepts/saved-store";
import { FlowBanner } from "@/genie6/flows/FlowBanner";
import type { FlowContext } from "@/genie6/flows/flowTypes";

interface ContextRailProps {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
  onCollapse?: () => void;
  /** Default "rail" — the narrow 300px right-side column (unchanged
   *  behavior). "inline" is the Linear layout variant (Maalik, 2026-09-08):
   *  rendered full-width at the top of the main column instead. Only
   *  changes the outer width constraint here — internal content is the
   *  same either way. */
  layout?: "rail" | "inline";
  /** Only passed `true` from AlphaStep3Configure in the Linear variant —
   *  every other call site omits it, so Angle stays exactly as read-only as
   *  before. When true, the Angle block becomes a button that opens the
   *  same ConceptAngleRail picker Configure already uses, writing straight
   *  to wizard.state via the `wizard` prop this component already holds. */
  angleEditable?: boolean;
  /** Linear-variant only: when the wizard was entered via a flow hand-off,
   *  render FlowBanner as the first element of Overview instead of as a
   *  separate strip above the whole wizard (StudioAlpha.tsx owns that
   *  choice — it stops rendering FlowBanner itself when this is passed). */
  flowCtx?: FlowContext | null;
}

function modeLabel(m: AlphaMode | undefined): string | null {
  if (!m) return null;
  const map: Record<AlphaMode, string> = {
    "product-shoot": "Product Shoot",
    "brand-ad": "Brand Ad",
    "product-ad": "Product Ad",
    social: "Social",
    "performance-ad": "Performance Ad",
  };
  return map[m] ?? null;
}

/* ── Ad type (Step-2 tab), independent of Mode ───────────────────────────
 * §5: "The tab the user picks is what determines the ad type. There is no
 * separate ad-type screen anywhere in Genie." `studioMode` is the flow the
 * user launched from Studio home — it is NOT wired to the URL, so a
 * deep-linked or flow-borne run defaults to it and can go stale relative to
 * whichever Step-2 tab the user is actually sitting on. The ad-type chip
 * must therefore read the raw entity ids, not the Mode.
 * Category wins over a hero product picked inside it — §4: "a picked
 * product becomes the hero of the ad" — the ad stays a Category Ad. */
type AdTypeKey = "brand-ad" | "product-ad" | "performance-ad";
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

/* ── Smart Summary Card (Variant 4) ──────────────────────────────────────
 *
 * Header: eyebrow "OVERVIEW" + animated icon-only close button (rotates 180°
 * on hover). Hero combo card with brand circle + product thumb side-by-side,
 * compact title, and Mode/Format/Angle chips. Status caption below — readiness
 * read at a glance. Quick actions row of 3 KB tiles. Below-fold accordion
 * for full Brand / Product / Related / KB detail.
 * ──────────────────────────────────────────────────────────────────────── */
export function ContextRail({
  wizard,
  studioMode,
  onCollapse,
  layout = "rail",
  angleEditable = false,
  flowCtx = null,
}: ContextRailProps) {
  const { state } = wizard;
  const [angleRailOpen, setAngleRailOpen] = useState(false);
  // A-12.51 (Maalik): "More details" accordion state is URL-backed via
  // ?more=closed (default = open). Mirrors the ?rail=closed pattern so a
  // hard refresh / HTML.to.design capture restores the exact accordion
  // state the user was viewing.
  const [searchParams, setSearchParams] = useSearchParams();
  const moreOpen = searchParams.get("more") !== "closed";
  const setMoreOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const resolved = typeof next === "function" ? next(moreOpen) : next;
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (resolved) sp.delete("more");
        else sp.set("more", "closed");
        return sp;
      },
      { replace: true },
    );
  };

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

  const category =
    (selectedProduct?.categoryId &&
      ALL_CATEGORIES.find((c) => c.id === selectedProduct.categoryId)) ||
    (state.categoryId
      ? ALL_CATEGORIES.find((c) => c.id === state.categoryId)
      : undefined) ||
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
  // Saved concepts not surfaced in this rail today (concepts panel was removed
  // in earlier rev) — but exposed via the store so future surfaces can use it.
  void savedConcepts;

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

  return (
    <div
      className={cn(
        "v3-glass space-y-4 rounded-3xl p-4",
        // Linear variant: full-width at the top of the main column instead
        // of a narrow 300px rail — capped to the same max-w-2xl the rest of
        // Configure's main column uses, so Overview doesn't stretch to some
        // arbitrary full-bleed width on a wide viewport.
        layout === "inline" && "mx-auto w-full max-w-2xl",
      )}
    >
      {/* Flow-origin context — Linear variant only. Rail variant keeps this
          as StudioAlpha.tsx's own separate FlowBanner above the wizard. */}
      {layout === "inline" && flowCtx && <FlowBanner ctx={flowCtx} />}

      {/* Header */}
      <SectionHeader
        title="Overview"
        trailing={
          onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Hide overview"
              className="group inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 ease-out hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <PanelRightClose className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            </button>
          )
        }
      />

      {/* Hero combo card — brand + product + chips */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background to-primary/[0.04] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start gap-3">
          {/* Brand circle */}
          {brand?.logo ? (
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-11 w-11 rounded-full border border-border/50 bg-card object-contain"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-card text-sm font-bold text-foreground">
              {brand?.name?.charAt(0) ?? "—"}
            </div>
          )}
          {/* Product thumb — falls back to the §21.2 uploaded image when
              there's no catalogue product (Product Shoot's third route). */}
          {selectedProduct?.thumbnail ? (
            <img
              src={selectedProduct.thumbnail}
              alt={selectedProduct.name}
              className="h-11 w-11 rounded-lg border border-border/50 object-cover"
            />
          ) : uploadedImageUrl ? (
            <img
              src={uploadedImageUrl}
              alt="Uploaded product"
              className="h-11 w-11 rounded-lg border border-border/50 object-cover"
            />
          ) : hasUploadedImage ? (
            // DEFECT FIX — degrade honestly when the token no longer
            // resolves (reload): never render a broken <img src>.
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-warning-text/40 bg-muted text-muted-foreground"
              title="Uploaded image needs re-uploading"
            >
              <ImageOff className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border/50 bg-muted text-xs text-muted-foreground">
              —
            </div>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] font-bold leading-tight text-foreground">
          {titleText}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {/* §5 — ad type comes from the Step-2 tab, never from Mode; shown
              first since it's what the readiness gate actually keys off. */}
          <Chip filled={!!adTypeLabel} accent={!!adTypeLabel}>
            {adTypeLabel ?? "Ad type pending"}
          </Chip>
          {/* Mode is explicitly labelled so it can never be misread as the
              ad type (that was the defect: an unlabelled Mode chip reading
              "Product Ad" while the user sat on the Category tab). */}
          <Chip filled={!!modeText}>{modeText ? `Mode: ${modeText}` : "Mode pending"}</Chip>
          <Chip filled={!!formatText}>{formatText ?? "Format pending"}</Chip>
          {/* Angle always carries a real value — explicit pick, or the
              Auto default — so this chip is always filled, never dashed. */}
          <Chip filled accent>
            {angleText ?? "Angle: Auto"}
          </Chip>
          {/* §9 — bulk product selection outcome, closing the loop back to
              what Step 2 already said in words before the user committed. */}
          {state.bulkProductIds.length > 0 && (
            <Chip filled accent>
              +{state.bulkProductIds.length} more product
              {state.bulkProductIds.length > 1 ? "s" : ""}
            </Chip>
          )}
        </div>
      </div>

      {/* Readiness caption */}
      <div className="text-center">
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.18em]",
            readinessTone === "ready"
              ? "text-foreground"
              : "text-warning-text",
          )}
        >
          {readinessTone === "ready" && <Check className="inline h-3 w-3 mr-1" strokeWidth={3} />}
          {readinessCaption}
        </span>
      </div>

      {/* Quick actions — KB tiles */}
      <div className="space-y-2">
        <SectionHeader title="Knowledge Base" />
        <div className="grid grid-cols-3 gap-2">
          <KbTile label="Instructions" count={instructionsCount} />
          <KbTile label="Winner Ads" count={winners.length} subtext="of 50 max" />
          <KbTile label="References" count={refs.length} />
        </div>
      </div>

      {/* A-12.46 (Maalik): More Details rebuilt for scan-first interactivity.
          - Brand block: clickable mini-card → /catalogue/brands/:id, with
            inline color swatches + tone pill + USP pills.
          - Product block: thumb + name + price pill + benefit pills + promo
            banner. Category chip if present.
          - Related Products: horizontal snap-scroll strip of mini cards.
            Click any card to switch wizard.productId without leaving step.
          - Knowledge Base: 3 metric pills (icon-led), reference-URL chip
            row, deep-link to BrandDetail KB tab.
          Each block lives in its own card surface — hairline separators,
          tight typography, scannable left-to-right rhythm. */}
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.04]"
        >
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            More details
          </span>
          <ChevronDown
            className={cn(
              "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
              moreOpen && "rotate-180",
            )}
          />
        </button>
        {moreOpen && (
          <div className="space-y-2.5 border-t border-border/40 p-2.5">
            {/* ── Brand mini-card ───────────────────────────── */}
            <BrandMiniCard brand={brand} />

            {/* ── Product mini-card ─────────────────────────── */}
            <ProductMiniCard
              product={selectedProduct ?? null}
              category={category}
              hasUploadedImage={hasUploadedImage}
              uploadedImageUrl={uploadedImageUrl}
              bulkCount={state.bulkProductIds.length}
            />

            {/* ── Related Products strip ────────────────────── */}
            <RelatedProductsStrip
              products={otherProducts}
              onPick={(id) => wizard.set("productId", id)}
            />

            {/* ── Knowledge Base at-a-glance ────────────────── */}
            <KbGlance
              entityType={entity?.type}
              brandId={brand?.id}
              instructionsCount={instructionsCount}
              winnersCount={winners.length}
              refs={refs}
            />

            {/* ── Angle ──────────────────────────────────────
                §5's Overview panel order puts Angle LAST, after Knowledge
                Base — it used to be the first thing shown (a hero-card
                chip only) with no detail block at all. Auto is a real,
                populated state here (§5: Concept/Script/Style/Angle default
                to "Auto"), so this never renders as an empty/dashed card
                the way Brand/Product do before anything is picked. */}
            <AngleDetailCard
              isAuto={isAngleAuto}
              label={angleText}
              onClick={angleEditable ? () => setAngleRailOpen(true) : undefined}
            />
          </div>
        )}
      </div>

      {/* Linear-variant Angle+Concept picker — same ConceptAngleRail
          Configure's PromptReferenceBar chip already opens, reused
          standalone here (it's a plain controlled component, no dependency
          on Configure's own `railMode` state). Writes straight to
          wizard.state via the `wizard` prop this component already holds. */}
      {angleEditable && angleRailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <ConceptAngleRail
              selectedAngleId={state.angleId}
              selectedConceptIds={state.selectedConceptIds}
              onAngleChange={(id) => wizard.set("angleId", id)}
              onConceptsChange={(ids) => wizard.set("selectedConceptIds", ids)}
              onClose={() => setAngleRailOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function Chip({
  children,
  filled,
  accent,
}: {
  children: React.ReactNode;
  filled?: boolean;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        filled
          ? accent
            ? "border border-primary/30 bg-primary/15 text-primary"
            : "border border-border/40 bg-foreground/[0.06] text-foreground"
          : "border border-dashed border-border text-muted-foreground/60",
      )}
    >
      {children}
    </span>
  );
}

function KbTile({
  label,
  count,
  subtext,
}: {
  label: string;
  count: number;
  subtext?: string;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/60 p-3 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
    >
      <span className="text-xl font-bold text-foreground">{count}</span>
      {subtext && <span className="font-mono text-[8px] text-muted-foreground">{subtext}</span>}
      <span className="mt-1 text-center text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}

function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  );
}

/* ── More Details · Brand mini-card ─────────────────────── */

function BrandMiniCard({
  brand,
}: {
  brand:
    | (typeof ALL_BRANDS[number])
    | null;
}) {
  if (!brand) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-background/30 px-3 py-2.5">
        <BlockLabel>Brand</BlockLabel>
        <p className="mt-1 text-[11px] italic text-muted-foreground">
          Pick a brand to fill this in.
        </p>
      </div>
    );
  }
  return (
    <Link
      to={`/catalogue/brands/${brand.id}`}
      className="group block rounded-xl border border-border/50 bg-background/40 p-2.5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2.5">
        {brand.logo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-8 w-8 shrink-0 rounded-lg border border-border/40 bg-card object-contain p-0.5"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card text-[11px] font-bold">
            {brand.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">
            {brand.name}
          </p>
          <p className="truncate font-mono text-[9px] text-muted-foreground">
            {brand.domain}
          </p>
        </div>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Color swatches strip */}
      {brand.colors.length > 0 && (
        <div className="mb-2 flex items-center gap-1">
          {brand.colors.slice(0, 5).map((c) => (
            <span
              key={c}
              title={c}
              className="inline-block h-3.5 w-3.5 rounded-full border border-border/40"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Tone + USPs as pills */}
      <div className="flex flex-wrap gap-1">
        {brand.tone && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] italic text-primary">
            {brand.tone.length > 40 ? `${brand.tone.slice(0, 40)}…` : brand.tone}
          </span>
        )}
        {brand.usps.slice(0, 3).map((u) => (
          <span
            key={u}
            className="inline-flex items-center rounded-full border border-border/50 bg-card px-1.5 py-0.5 text-[9px] text-foreground/80"
          >
            {u}
          </span>
        ))}
      </div>
    </Link>
  );
}

/* ── More Details · Product mini-card ───────────────────── */

function ProductMiniCard({
  product,
  category,
  hasUploadedImage,
  uploadedImageUrl,
  bulkCount = 0,
}: {
  product: (typeof ALL_PRODUCTS[number]) | null;
  category: (typeof ALL_CATEGORIES[number]) | null;
  /** §21.2 — Product Shoot's third route: brand + one uploaded image, no
   *  catalogue product. Rendered here so "More details" doesn't fall back
   *  to the generic "Pick a product" placeholder when this is what's set. */
  hasUploadedImage?: boolean;
  /** Resolved data: URL for `hasUploadedImage` — undefined when the token no
   *  longer resolves (reload). DEFECT FIX: this used to be the raw token
   *  itself passed straight to <img src>; see uploaded-image-store.ts. */
  uploadedImageUrl?: string;
  /** §9 — co-star count (excludes the hero, which IS `product`). */
  bulkCount?: number;
}) {
  if (!product) {
    if (hasUploadedImage) {
      return (
        <div className="rounded-xl border border-border/50 bg-background/40 p-2.5">
          <div className="flex items-start gap-2.5">
            {uploadedImageUrl ? (
              <img
                src={uploadedImageUrl}
                alt="Uploaded product"
                className="h-10 w-10 shrink-0 rounded-lg border border-border/40 object-cover"
              />
            ) : (
              // DEFECT FIX — degrade honestly rather than a broken <img>.
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-warning-text/40 bg-muted text-muted-foreground">
                <ImageOff className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <BlockLabel>Product</BlockLabel>
              <p className="mt-0.5 text-[11px] font-medium text-foreground">
                {uploadedImageUrl ? "Uploaded image" : "Image needs re-uploading"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {uploadedImageUrl
                  ? "Not in the Catalogue — brand + image only."
                  : "This session's upload didn't survive the reload."}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-background/30 px-3 py-2.5">
        <BlockLabel>Product</BlockLabel>
        <p className="mt-1 text-[11px] italic text-muted-foreground">
          Pick a product to fill this in.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-2.5">
      <div className="mb-2 flex items-start gap-2.5">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-10 w-10 shrink-0 rounded-lg border border-border/40 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted text-[11px] text-muted-foreground">
            —
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
            {product.name}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
              {product.price}
            </span>
            {category && (
              <Link
                to={`/catalogue/categories/${category.id}`}
                className="inline-flex items-center gap-0.5 rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground hover:bg-primary/15 hover:text-primary"
              >
                <TagIcon className="h-2 w-2" />
                {category.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Benefit pills */}
      {product.benefits.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {product.benefits.slice(0, 3).map((b) => (
            <span
              key={b}
              className="inline-flex items-center rounded-full border border-border/50 bg-card px-1.5 py-0.5 text-[9px] text-foreground/80"
            >
              {b}
            </span>
          ))}
          {product.benefits.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              +{product.benefits.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Promo banner */}
      {product.promo && (
        <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] text-primary">
          <Sparkles className="h-2.5 w-2.5 shrink-0" />
          <span className="line-clamp-1 italic">{product.promo}</span>
        </div>
      )}

      {/* §9 — bulk co-stars. `product` above is the hero; this states the
          outcome again here, closing the loop with what Step 2 already said
          in words before the user committed. */}
      {bulkCount > 0 && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          + {bulkCount} more product{bulkCount > 1 ? "s" : ""} in this ad — one ad, not{" "}
          {bulkCount + 1} separate ones.
        </p>
      )}
    </div>
  );
}

/* ── More Details · Related products horizontal strip ─── */

function RelatedProductsStrip({
  products: list,
  onPick,
}: {
  products: typeof ALL_PRODUCTS;
  onPick: (id: string) => void;
}) {
  if (list.length === 0) return null;
  return (
    <div className="space-y-1.5 rounded-xl border border-border/50 bg-background/40 p-2.5">
      <BlockLabel>Related products · {list.length}</BlockLabel>
      <div className="-mx-2.5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2.5 pb-1">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            className="group block w-[90px] shrink-0 snap-start overflow-hidden rounded-lg border border-border/50 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            title={`Switch to ${p.name}`}
          >
            <div className="aspect-square w-full overflow-hidden bg-muted">
              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                  —
                </div>
              )}
            </div>
            <div className="space-y-0.5 px-1.5 py-1">
              <p className="line-clamp-1 text-[10px] font-medium text-foreground">
                {p.name}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground">{p.price}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── More Details · KB at-a-glance ────────────────────── */

function KbGlance({
  entityType,
  brandId,
  instructionsCount,
  winnersCount,
  refs,
}: {
  entityType: EntityType | undefined;
  brandId: string | undefined;
  instructionsCount: number;
  winnersCount: number;
  refs: ReturnType<typeof getReferenceUrlsForEntity>;
}) {
  if (!entityType) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-background/30 px-3 py-2.5">
        <BlockLabel>Knowledge Base</BlockLabel>
        <p className="mt-1 text-[11px] italic text-muted-foreground">
          Pick a brand / product / category to surface KB context.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-background/40 p-2.5">
      <div className="flex items-center justify-between">
        <BlockLabel>Knowledge Base</BlockLabel>
        {brandId && (
          <Link
            to={`/catalogue/brands/${brandId}?tab=kb`}
            className="inline-flex items-center gap-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Open KB
            <ChevronRight className="h-2.5 w-2.5" />
          </Link>
        )}
      </div>

      {/* 3 metric pills */}
      <div className="grid grid-cols-3 gap-1.5">
        <KbMetricPill icon={BookOpen} count={instructionsCount} label="Instr." />
        <KbMetricPill icon={Trophy} count={winnersCount} label="Winners" />
        <KbMetricPill icon={Link2} count={refs.length} label="Refs" />
      </div>

      {/* Reference URL chips */}
      {refs.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {refs.slice(0, 6).map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              title={r.label}
              className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:text-foreground"
            >
              <span className="max-w-[120px] truncate">{shortUrl(r.url)}</span>
              <ExternalLink className="h-2 w-2 shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── More Details · Angle ──────────────────────────────── */

function AngleDetailCard({
  isAuto,
  label,
  onClick,
}: {
  /** Auto is a real, valid answer (§5) — this block never reads as an
   *  empty/dashed placeholder the way an un-picked Brand/Product does. */
  isAuto: boolean;
  label: string | null;
  /** Linear variant only (`angleEditable`) — turns this card into a picker
   *  trigger instead of a read-only summary. Undefined everywhere else,
   *  so Rail-variant / steps 1-3 render byte-identical to before. */
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="mb-1 flex items-center justify-between">
        <BlockLabel>Angle + Concept</BlockLabel>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
            isAuto
              ? "border border-border/50 bg-card text-muted-foreground"
              : "border border-primary/30 bg-primary/15 text-primary",
          )}
        >
          {isAuto ? "Auto" : "Set"}
        </span>
      </div>
      <p className="text-[11px] font-medium text-foreground">{label ?? "Auto"}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {onClick
          ? isAuto
            ? "Genie picks the strongest angle for this ad — tap to choose your own."
            : "Tap to change the angle or concept."
          : isAuto
            ? "Genie picks the strongest angle for this ad — pick one on Configure to lock it in."
            : "Locked in for this generation — change it any time on Configure."}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-border/50 bg-background/40 p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
      >
        {body}
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-2.5">
      {body}
    </div>
  );
}

function KbMetricPill({
  icon: Icon,
  count,
  label,
}: {
  icon: React.ElementType;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-2 py-1.5">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="text-[13px] font-bold leading-none text-foreground">
        {count}
      </span>
      <span className="ml-auto font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
