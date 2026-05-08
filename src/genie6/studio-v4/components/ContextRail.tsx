import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
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

interface ContextRailProps {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
  onCollapse?: () => void;
}

function modeLabel(m: AlphaMode | undefined): string {
  if (!m) return "—";
  const map: Record<AlphaMode, string> = {
    "product-shoot": "Product Shoot",
    "brand-ad": "Brand Ad",
    "product-ad": "Product Ad",
    social: "Social",
    "performance-ad": "Performance Ad",
  };
  return map[m] ?? "—";
}

interface SectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ label, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-border/40 px-3 py-2.5"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-1.5 px-3 py-3 text-[11px] text-foreground">
          {children}
        </div>
      )}
    </div>
  );
}

function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right text-foreground/80 break-all">{value}</span>
    </div>
  );
}

export function ContextRail({ wizard, studioMode, onCollapse }: ContextRailProps) {
  const { state } = wizard;

  const selectedProduct = ALL_PRODUCTS.find((p) => p.id === state.productId);
  const brand = ALL_BRANDS.find((b) => b.id === selectedProduct?.brandId);

  const productName =
    selectedProduct?.name ??
    (state.categoryId
      ? (ALL_CATEGORIES.find((c) => c.id === state.categoryId)?.name ?? "—")
      : "—");

  const formatLabel =
    state.format === "image"
      ? "Image"
      : state.format === "video"
        ? "Video"
        : "—";

  const angleLabel = state.angleId
    ? (ANGLE_CHIP_LABEL[state.angleId] ?? state.angleId)
    : null;

  const otherProducts = ALL_PRODUCTS.filter(
    (p) =>
      p.brandId === selectedProduct?.brandId &&
      p.categoryId === selectedProduct?.categoryId &&
      p.id !== state.productId,
  ).slice(0, 4);

  return (
    <div className="flex h-full flex-col overflow-hidden overflow-y-auto rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">

      {/* Header — title + collapse button */}
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
          Overview
        </span>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse overview"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Always-visible compact summary — scan-friendly key/value rows */}
      <div className="space-y-1 border-b border-border/40 px-3 py-3 text-[11px]">
        <KVRow label="Mode" value={modeLabel(studioMode)} />
        <KVRow label="Format" value={formatLabel} />
        <KVRow label="Brand" value={brand?.name ?? "—"} />
        <KVRow label="Product" value={productName} />
        <KVRow label="Angle" value={angleLabel ?? "—"} />
      </div>

      {/* Brand — collapsed */}
      <Section label="Brand">
        {brand ? (
          <>
            <div className="flex items-center gap-2">
              {brand.logo && (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-5 w-5 rounded-full object-contain"
                />
              )}
              <span className="text-[12px] font-semibold">{brand.name}</span>
            </div>
            {brand.colors.length > 0 && (
              <div className="flex items-center gap-1 pt-0.5">
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
                {brand.tone.slice(0, 60)}
                {brand.tone.length > 60 ? "…" : ""}
              </p>
            )}
            {brand.usps.slice(0, 3).map((usp) => (
              <p key={usp} className="text-muted-foreground">
                · {usp}
              </p>
            ))}
          </>
        ) : (
          <p className="text-muted-foreground">No brand selected</p>
        )}
      </Section>

      {/* Product — collapsed */}
      <Section label="Product">
        {selectedProduct ? (
          <>
            <p className="font-semibold text-[12px]">{selectedProduct.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {selectedProduct.price}
            </p>
            {selectedProduct.benefits.slice(0, 3).map((b) => (
              <p key={b} className="text-[11px] text-muted-foreground">
                · {b}
              </p>
            ))}
            {selectedProduct.promo && (
              <p className="text-[11px] italic text-primary/80">
                {selectedProduct.promo}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">No product selected</p>
        )}
      </Section>

      {/* Related Products — collapsed */}
      <Section label="Related Products">
        {otherProducts.length > 0 ? (
          otherProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <span className="text-[11px] font-medium truncate">{p.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground ml-auto shrink-0">
                {p.price}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No related products</p>
        )}
      </Section>

      {/* Knowledge Base — single section, 3 sub-blocks (Instructions / Winner Ads / Reference URLs) */}
      <Section label="Knowledge Base">
        {(() => {
          // Resolve active entity (priority: product → brand → category).
          let entity:
            | { type: EntityType; id: EntityId }
            | null = null;
          if (state.productId) {
            entity = { type: "product", id: state.productId as EntityId };
          } else if (state.brandId) {
            entity = { type: "brand", id: state.brandId as EntityId };
          } else if (state.categoryId) {
            entity = { type: "category", id: state.categoryId as EntityId };
          }

          if (!entity) {
            return (
              <p className="text-[11px] text-muted-foreground">
                No entity selected — pick a brand / product / category.
              </p>
            );
          }

          const instructionGroups = getInstructionsForEntity(
            entity.type,
            entity.id,
            state.customKbInstructions,
          );
          const winnerAds = getWinnerAdsForEntity(entity.type, entity.id);
          const referenceUrls = getReferenceUrlsForEntity(
            entity.type,
            entity.id,
          );

          const mainCount = instructionGroups.main ? 1 : 0;
          const customCount = instructionGroups.custom.length;
          const angleCount = instructionGroups.angles.length;
          const totalInstructions = mainCount + customCount + angleCount;
          const visibleInstructions = [
            ...(instructionGroups.main ? [instructionGroups.main] : []),
            ...instructionGroups.custom,
            ...instructionGroups.angles,
          ].slice(0, 5);

          return (
            <div className="space-y-3">
              {/* Block 1 — Instructions */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Instructions
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/60">
                    · {mainCount} main · {customCount} custom · {angleCount} angle-specific
                  </span>
                </div>
                {totalInstructions === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    No instructions saved yet.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-1">
                      {visibleInstructions.map((i) => (
                        <li key={i.id} className="space-y-0.5">
                          <p className="text-[11px] font-semibold leading-tight text-foreground">
                            {i.name}
                          </p>
                          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                            {i.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                    {totalInstructions > visibleInstructions.length && (
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
                      >
                        View all →
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Block 2 — Winner Ads */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Winner Ads
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/60">
                    · {winnerAds.length} of 50 max
                  </span>
                </div>
                {winnerAds.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    No winners saved yet.
                  </p>
                ) : (
                  <>
                    <ul className="grid grid-cols-2 gap-1.5">
                      {winnerAds.slice(0, 4).map((ad) => (
                        <li
                          key={ad.id}
                          className="overflow-hidden rounded-md border border-border/40 bg-muted/40"
                        >
                          {ad.thumbnail ? (
                            <img
                              src={ad.thumbnail}
                              alt={ad.headline}
                              loading="lazy"
                              className="aspect-square w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-square w-full items-center justify-center text-base text-muted-foreground/50">
                              ✨
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    {winnerAds.length > 4 && (
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
                      >
                        View all →
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Block 3 — Reference URLs */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Reference URLs
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/60">
                    · {referenceUrls.length} saved
                  </span>
                </div>
                {referenceUrls.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    No reference URLs saved.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {referenceUrls.map((r) => (
                      <li key={r.id}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={r.label}
                          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:text-foreground"
                        >
                          <span className="truncate max-w-[140px]">
                            {shortUrl(r.url)}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })()}
      </Section>

    </div>
  );
}
