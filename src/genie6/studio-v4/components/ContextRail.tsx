import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseWizardReturn } from "../state/useWizard";
import type { AlphaMode } from "../screens/StudioHome";
import {
  brands as ALL_BRANDS,
  products as ALL_PRODUCTS,
  categories as ALL_CATEGORIES,
} from "@/mocks/shared";
import { findInstructionForAngle } from "../data/kbInstructions";
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

      {/* Knowledge Base — active instruction or warning if uncovered. */}
      <Section label="Knowledge Base">
        {(() => {
          const currentInstruction = findInstructionForAngle(
            state.angleId,
            state.customKbInstructions,
          );
          if (state.angleId && !currentInstruction) {
            return (
              <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold">
                    No instruction for {angleLabel}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Click the warning chip near Knowledge Base to create one.
                  </p>
                </div>
              </div>
            );
          }
          if (currentInstruction) {
            return (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Active
                  </span>
                  <span className="break-words text-right text-foreground/80">
                    {currentInstruction.name}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  {currentInstruction.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    /* future: open KB editor */
                  }}
                  className="text-[10px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
                >
                  View / Edit
                </button>
              </>
            );
          }
          return (
            <p className="text-[11px] text-muted-foreground">
              Pick an angle to see the matching instruction.
            </p>
          );
        })()}
      </Section>

      {/* Winner Ads — stub placeholder for upcoming feature */}
      <Section label="Winner Ads">
        <div className="flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Coming soon
          </span>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Top-performing creatives for this brand and product will appear here
          once the winner-ads feed is connected.
        </p>
      </Section>

    </div>
  );
}
