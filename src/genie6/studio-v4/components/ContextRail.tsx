import { useState } from "react";
import { ChevronDown, ExternalLink, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ContextRailProps {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
  onCollapse?: () => void;
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

/* ── Smart Summary Card (Variant 4) ──────────────────────────────────────
 *
 * Header: eyebrow "OVERVIEW" + animated icon-only close button (rotates 180°
 * on hover). Hero combo card with brand circle + product thumb side-by-side,
 * compact title, and Mode/Format/Angle chips. Status caption below — readiness
 * read at a glance. Quick actions row of 3 KB tiles. Below-fold accordion
 * for full Brand / Product / Related / KB detail.
 * ──────────────────────────────────────────────────────────────────────── */
export function ContextRail({ wizard, studioMode, onCollapse }: ContextRailProps) {
  const { state } = wizard;
  const [moreOpen, setMoreOpen] = useState(false);

  const selectedProduct = ALL_PRODUCTS.find((p) => p.id === state.productId);
  const brand = ALL_BRANDS.find((b) => b.id === selectedProduct?.brandId);

  const productName =
    selectedProduct?.name ??
    (state.categoryId
      ? (ALL_CATEGORIES.find((c) => c.id === state.categoryId)?.name ?? null)
      : null);

  const formatText =
    state.format === "image" ? "Image" : state.format === "video" ? "Video" : null;
  const modeText = modeLabel(studioMode);
  const angleText = state.angleId
    ? (ANGLE_CHIP_LABEL[state.angleId] ?? state.angleId)
    : null;

  // Heuristic: "ready" once product + format + angle are all set.
  const complete = !!selectedProduct && !!state.format && !!state.angleId;

  // Resolve readiness caption. Tone is orange when pending, neutral when ready.
  let readinessCaption: string;
  let readinessTone: "ready" | "pending";
  if (complete) {
    readinessCaption = "READY TO GENERATE";
    readinessTone = "ready";
  } else if (!selectedProduct) {
    readinessCaption = "PICK A PRODUCT";
    readinessTone = "pending";
  } else if (!state.format) {
    readinessCaption = "PICK A FORMAT";
    readinessTone = "pending";
  } else if (!state.angleId) {
    readinessCaption = "PICK AN ANGLE";
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

  const instructionGroups = entity
    ? getInstructionsForEntity(entity.type, entity.id, state.customKbInstructions)
    : { main: null, custom: [], angles: [] };
  const winners = entity ? getWinnerAdsForEntity(entity.type, entity.id) : [];
  const refs = entity ? getReferenceUrlsForEntity(entity.type, entity.id) : [];

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
          {/* Product thumb */}
          {selectedProduct?.thumbnail ? (
            <img
              src={selectedProduct.thumbnail}
              alt={selectedProduct.name}
              className="h-11 w-11 rounded-lg border border-border/50 object-cover"
            />
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
          <Chip filled={!!modeText}>{modeText ?? "Mode pending"}</Chip>
          <Chip filled={!!formatText}>{formatText ?? "Format pending"}</Chip>
          <Chip filled={!!angleText} accent>
            {angleText ?? "Angle: Auto"}
          </Chip>
        </div>
      </div>

      {/* Readiness caption */}
      <div className="text-center">
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.18em]",
            readinessTone === "ready"
              ? "text-foreground"
              : "text-amber-600 dark:text-amber-400",
          )}
        >
          {readinessTone === "ready" ? "✓ " : ""}
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

      {/* Below-fold — full detail accordion. Nested inside glass rail, so use
          solid bg-card to avoid double-glass. */}
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
          <div className="space-y-3 border-t border-border/40 px-3 py-3 text-[11px] text-foreground">
            {/* Brand */}
            <DetailBlock label="Brand">
              {brand ? (
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold">{brand.name}</p>
                  {brand.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {brand.colors.slice(0, 3).map((color) => (
                        <span
                          key={color}
                          className="inline-block h-4 w-4 rounded-full border border-border/40"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                  {brand.tone && (
                    <p className="text-muted-foreground">
                      {brand.tone.slice(0, 80)}
                      {brand.tone.length > 80 ? "…" : ""}
                    </p>
                  )}
                  {brand.usps.slice(0, 3).map((usp) => (
                    <p key={usp} className="text-muted-foreground">
                      · {usp}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No brand selected</p>
              )}
            </DetailBlock>

            {/* Product */}
            <DetailBlock label="Product">
              {selectedProduct ? (
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold">{selectedProduct.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {selectedProduct.price}
                  </p>
                  {selectedProduct.benefits.slice(0, 3).map((b) => (
                    <p key={b} className="text-muted-foreground">
                      · {b}
                    </p>
                  ))}
                  {selectedProduct.promo && (
                    <p className="italic text-primary/80">{selectedProduct.promo}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No product selected</p>
              )}
            </DetailBlock>

            {/* Related products */}
            <DetailBlock label="Related Products">
              {otherProducts.length > 0 ? (
                <ul className="space-y-1">
                  {otherProducts.map((p) => (
                    <li key={p.id} className="flex items-center gap-1">
                      <span className="truncate text-[11px] font-medium">{p.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                        {p.price}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No related products</p>
              )}
            </DetailBlock>

            {/* KB lists */}
            <DetailBlock label="Knowledge Base">
              {!entity ? (
                <p className="text-muted-foreground">
                  No entity selected — pick a brand / product / category.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] text-muted-foreground/80">
                    {instructionsCount} instruction{instructionsCount === 1 ? "" : "s"} ·{" "}
                    {winners.length} winner{winners.length === 1 ? "" : "s"} · {refs.length}{" "}
                    ref{refs.length === 1 ? "" : "s"}
                  </p>
                  {refs.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                      {refs.slice(0, 6).map((r) => (
                        <li key={r.id}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={r.label}
                            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:text-foreground"
                          >
                            <span className="max-w-[140px] truncate">{shortUrl(r.url)}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </DetailBlock>
          </div>
        )}
      </div>
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

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="text-[11px]">{children}</div>
    </div>
  );
}
