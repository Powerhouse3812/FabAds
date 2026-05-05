import { Sparkles, Zap } from "lucide-react";
import { CategoryCard } from "./components/CategoryCard";
import { QuickModeChip } from "./components/QuickModeChip";
import { CATEGORIES, QUICK_MODES } from "./types";

/**
 * StudioV3Landing — picker for the new 3-category Studio (A-11.14).
 *
 * Layout per Maalik:
 *   - 3 category cards (Brand / Ad / Social) in a responsive grid.
 *   - Each card has its sub-modes inline (always visible — no expand).
 *   - Quick modes (UGC Video / Variations / Image-to-Ad) in a separate row
 *     below, visually lighter so they don't compete with the categories.
 *   - Dot-grid backdrop + lime corner glow — visual continuity with the
 *     existing GenerateLanding.
 *
 * Sub-mode tile clicks route to `/iq/genie6/generate-v3/{categoryId}/{subModeId}`
 * which currently lands on SubModePlaceholder. Real forms ship one-by-one
 * starting with Product Shoot (next commit).
 */

export function StudioV3Landing() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Dot-grid backdrop — AI-tool motif at 6% opacity */}
      <DotGridBackdrop />

      {/* Lime corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex h-full flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-7 shrink-0 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 mb-3">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground">
              Studio v3 · 3-category model
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            What are you generating today?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
            Pick a category. Pick a sub-mode. We set up the form for you with
            smart defaults — override anything before you generate.
          </p>
        </header>

        {/* Category grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>

        {/* Quick modes row */}
        <section className="mt-10 max-w-6xl">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Quick modes
            </h2>
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
              {QUICK_MODES.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_MODES.map((m) => (
              <QuickModeChip key={m.id} quickMode={m} />
            ))}
          </div>
        </section>

        {/* Bottom hint */}
        <p className="mt-8 max-w-3xl text-[11px] text-muted-foreground/80">
          Studio v3 runs in parallel with the existing Studio while we build
          out each sub-mode. Sub-mode forms ship one-by-one — Product Shoot
          first.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function DotGridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        color: "hsl(var(--foreground))",
      }}
    />
  );
}
