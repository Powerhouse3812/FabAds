import { useState } from "react";
import { LayoutGrid, AlignJustify } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryCard } from "./components/CategoryCard";
import { QuickModeChip } from "./components/QuickModeChip";
import { StudioV3LandingHorizontal } from "./StudioV3LandingHorizontal";
import { CATEGORIES, QUICK_MODES } from "./types";

/**
 * StudioV3Landing — picker controller (A-11.15 redesign).
 *
 * Hosts BOTH variants of the picker:
 *   - V1 "stacked": 3 category cards in a grid, sub-modes inline as
 *     compact tiles inside each card. (Current default — original A-11.14
 *     layout with cleanup.)
 *   - V2 "horizontal": each mode = one horizontal row, sub-modes spread
 *     as full cards with preview thumbnails ("kya bn ne wala hai" preview
 *     per Maalik). (New in A-11.15.)
 *
 * Toggle: click the H1 title → flips between variants. Per Maalik's
 * literal ask. Local state only — no URL persistence yet.
 *
 * Backdrop: unified dot-grid + slight off-white tone across the whole
 * right-side panel (per Maalik feedback — "right side ka bg, dot wala
 * off white. ek hi rakho"). No layered gradient backdrops.
 */

type LandingVariant = "stacked" | "horizontal";

export function StudioV3Landing() {
  const [variant, setVariant] = useState<LandingVariant>("stacked");

  const isStacked = variant === "stacked";
  const VariantIcon = isStacked ? LayoutGrid : AlignJustify;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-muted/40">
      {/* Unified dot-grid texture across the whole panel */}
      <DotGridBackdrop />

      <div className="relative flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Header */}
        <header className="mb-5 shrink-0 max-w-3xl">
          <button
            type="button"
            onClick={() => setVariant(isStacked ? "horizontal" : "stacked")}
            aria-label={`Toggle picker layout — current: ${variant}. Click to switch.`}
            title="Click to switch picker layout"
            className={cn(
              "group inline-flex items-baseline gap-2 text-left transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 rounded",
            )}
          >
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
              What are you generating today?
            </h1>
            <VariantIcon className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors translate-y-[-2px]" />
          </button>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl leading-relaxed">
            Pick a category. Pick a sub-mode. Smart defaults set up the form for you — override anything before you generate.
          </p>
        </header>

        {/* Variant body */}
        {isStacked ? <StackedView /> : <StudioV3LandingHorizontal />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  V1 (current) — 3 category cards in a grid, sub-modes inline
 *  as compact tiles. Cleanup applied (no gradient bands per
 *  Maalik feedback).
 * ───────────────────────────────────────────────────────── */
function StackedView() {
  return (
    <>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>

      {/* Quick modes — small chip strip below the 3 main cards */}
      <section className="mt-7 max-w-6xl">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Quick modes
          </h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_MODES.map((m) => (
            <QuickModeChip key={m.id} quickMode={m} />
          ))}
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────── */

function DotGridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.10]"
      style={{
        backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        color: "hsl(var(--foreground))",
      }}
    />
  );
}
