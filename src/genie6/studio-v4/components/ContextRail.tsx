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
import type { UseWizardReturn } from "../state/useWizard";
import type { AlphaMode } from "../screens/StudioHome";
import {
  brands as ALL_BRANDS,
  products as ALL_PRODUCTS,
  categories as ALL_CATEGORIES,
  getReferenceUrlsForEntity,
  shortUrl,
  type EntityType,
} from "@/mocks/shared";
import { SectionHeader } from "./SectionHeader";
import { useStudioContextSummary } from "../state/useContextSummary";

/**
 * This component is read-only context. It never renders the flow banner and
 * never edits the run: StudioAlpha.tsx mounts a single `<FlowBanner>` above
 * the whole wizard (§6 Rule 5) and Configure owns Angle/Concept editing. Do
 * not re-add a flow-banner prop here — the banner would render twice.
 *
 * Two mounts, both passing exactly these props: the desktop 300px aside in
 * StudioAlpha.tsx and the below-`md` bottom sheet in
 * MobileContextRailSheet.tsx. Keep any new prop optional so both stay valid.
 */
interface ContextRailProps {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
  /** Omitted nowhere today, but optional so the rail can be embedded in a
   *  surface that owns its own dismiss. Renders the header close button. */
  onCollapse?: () => void;
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
}: ContextRailProps) {
  const { state } = wizard;
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

  const {
    brand,
    selectedProduct,
    category,
    hasUploadedImage,
    uploadedImageUrl,
    titleText,
    formatText,
    modeText,
    adTypeLabel,
    isAngleAuto,
    angleText,
    readinessCaption,
    readinessTone,
    entity,
    winners,
    refs,
    instructionsCount,
    otherProducts,
  } = useStudioContextSummary(wizard, studioMode);

  return (
    <div className="v3-glass space-y-4 rounded-3xl p-4">
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
            <AngleDetailCard isAuto={isAngleAuto} label={angleText} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

export function Chip({
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

/** Read-only summary. Angle/Concept are edited on Configure, never here —
 *  the rail is a mirror of the run, not a second editor for it. */
function AngleDetailCard({
  isAuto,
  label,
}: {
  /** Auto is a real, valid answer (§5) — this block never reads as an
   *  empty/dashed placeholder the way an un-picked Brand/Product does. */
  isAuto: boolean;
  label: string | null;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-2.5">
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
        {isAuto
          ? "Genie picks the strongest angle for this ad — pick one on Configure to lock it in."
          : "Locked in for this generation — change it any time on Configure."}
      </p>
    </div>
  );
}

export function KbMetricPill({
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
