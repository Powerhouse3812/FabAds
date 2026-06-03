import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Camera,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Target,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";
import { KB_INSTRUCTIONS } from "@/mocks/shared/kbInstructions";

const ICONS: Record<string, LucideIcon> = {
  "brand-ad": Sparkles,
  "product-ad": ShoppingBag,
  "affiliate-ad": Target,
  "product-shoot": Camera,
  "ugc-video": Video,
  variation: RefreshCw,
};

const MODES: Array<{ id: string; label: string; skipGate?: boolean }> = [
  { id: "brand-ad", label: "Brand Ad" },
  { id: "product-ad", label: "Product Ad" },
  { id: "affiliate-ad", label: "Affiliate" },
  { id: "product-shoot", label: "Product Shoot" },
  { id: "ugc-video", label: "UGC Video" },
  { id: "variation", label: "Variations", skipGate: true },
];

/**
 * GenieQuickStartCard — Growth dashboard widget that merges the 6-mode
 * launcher with a KB coverage stat. Single compact card replacing two
 * AI-plan widgets (ModeLauncherBar + KB tile) for Growth-plan density.
 *
 * Top: 2x3 grid of mode pills, each ~36px tall — bigger than a chip,
 * smaller than the AI-plan launcher's 70px cards. Click navigates to
 * Studio Alpha with the mode preselected (?mode=<id>). The Variations
 * mode appends &skipGate=1 to bypass the gate modal (same rule as the
 * AI-plan launcher).
 *
 * Bottom: KB coverage footer — "3 of 5 brands have a main instruction"
 * + CTA arrow to the catalogue. Computed live from KB_INSTRUCTIONS so
 * adding a main instruction in any brand-detail page bumps the count.
 */
export function GenieQuickStartCard() {
  // KB coverage — how many brands have a main instruction. Tiny live
  // stat that doubles as a quality signal: low = Genie is generating
  // without brand voice, the team should fix.
  const { withMain, total } = useMemo(() => {
    const brandsWithMain = new Set(
      KB_INSTRUCTIONS.filter(
        (i) => i.entityType === "brand" && i.kind === "main",
      ).map((i) => i.entityId),
    );
    return { withMain: brandsWithMain.size, total: brands.length };
  }, []);

  return (
    <section
      data-fabads-dash-widget="genie-quick-start"
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
      aria-label="Quick start a generation"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Quick start
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            Pick a mode · land in Studio
          </span>
        </div>
        <Link
          to="/iq/genie6/studio-alpha"
          className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Studio
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {/* 6 modes in a 2x3 grid */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {MODES.map((m) => {
          const Icon = ICONS[m.id] ?? Sparkles;
          const href = `/iq/genie6/studio-alpha?mode=${m.id}${m.skipGate ? "&skipGate=1" : ""}`;
          return (
            <Link
              key={m.id}
              to={href}
              className={cn(
                "group flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5",
                "text-[12px] font-medium text-foreground transition-all",
                "hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.04]",
              )}
            >
              <span
                aria-hidden
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-foreground transition-colors group-hover:bg-primary/20"
              >
                <Icon className="h-3 w-3" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 truncate">{m.label}</span>
            </Link>
          );
        })}
      </div>

      {/* KB coverage — quality signal footer. Dashed top border so it
          reads as a footnote rather than another row of equal weight. */}
      <Link
        to="/catalogue/brands"
        className={cn(
          "group -mx-1 -mb-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors",
          "border-t border-dashed border-border/60 hover:bg-muted/40",
        )}
      >
        <BookOpen
          className="h-3 w-3 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-[11px] text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">
            {withMain} of {total}
          </span>{" "}
          brands have a main instruction
        </span>
        <ArrowUpRight
          className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
          aria-hidden
        />
      </Link>
    </section>
  );
}
