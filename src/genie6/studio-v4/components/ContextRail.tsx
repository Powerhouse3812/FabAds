import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseWizardReturn } from "../state/useWizard";
import type { AlphaMode } from "../screens/StudioHome";
import {
  brands as ALL_BRANDS,
  products as ALL_PRODUCTS,
  categories as ALL_CATEGORIES,
} from "@/mocks/shared";

interface ContextRailProps {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
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
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-border px-3 py-2.5"
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

export function ContextRail({ wizard, studioMode }: ContextRailProps) {
  const { state } = wizard;

  const selectedProduct = ALL_PRODUCTS.find((p) => p.id === state.productId);
  const brand = ALL_BRANDS.find((b) => b.id === selectedProduct?.brandId);

  const productName =
    selectedProduct?.name ??
    (state.categoryId
      ? (ALL_CATEGORIES.find((c) => c.id === state.categoryId)?.name ?? "—")
      : "—");

  const approachLabel =
    state.mode === "scratch"
      ? "Custom"
      : state.mode === "ugc-video"
        ? "UGC Video"
        : "—";

  const promptSnippet = state.prompt
    ? state.prompt.slice(0, 80) + (state.prompt.length > 80 ? "…" : "")
    : "—";

  const otherProducts = ALL_PRODUCTS.filter(
    (p) =>
      p.brandId === selectedProduct?.brandId &&
      p.categoryId === selectedProduct?.categoryId &&
      p.id !== state.productId,
  ).slice(0, 4);

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-border bg-card overflow-y-auto">

      {/* 1. Run Details — open by default */}
      <Section label="Run Details" defaultOpen>
        <KVRow label="Mode" value={modeLabel(studioMode)} />
        <KVRow
          label="Format"
          value={
            state.format === "image"
              ? "Image"
              : state.format === "video"
                ? "Video"
                : "—"
          }
        />
        <KVRow label="Product" value={productName} />
        <KVRow label="Approach" value={approachLabel} />
        <KVRow label="Model" value={state.modelId} />
        <KVRow label="Outputs" value={String(state.credits)} />
        <KVRow label="Prompt" value={promptSnippet} />
      </Section>

      {/* 2. Brand — collapsed */}
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

      {/* 3. Product — collapsed */}
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

      {/* 4. Related Products — collapsed */}
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

      {/* 5. Knowledge Base — stub, collapsed */}
      <Section label="Knowledge Base">
        {(
          [
            "Target Audience",
            "What to say",
            "What to avoid",
            "Problem → Solution",
          ] as const
        ).map((label) => (
          <div key={label} className="flex items-start justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
              {label}
            </span>
            <span className="text-foreground/50">—</span>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground/60 italic pt-1">
          KB coming soon
        </p>
      </Section>

    </div>
  );
}
