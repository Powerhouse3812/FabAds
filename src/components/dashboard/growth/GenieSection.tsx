import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Camera,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Target,
  Video,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardStatStrip, type StatItem } from "./DashboardStatStrip";

/**
 * GenieSection — single compact card for the Growth dashboard.
 *
 * Maalik A-12.196: collapsed from a 4-card KPI grid + separate mode
 * launcher into ONE card. Inside, two stacked blocks under a quiet
 * header:
 *   1. DashboardStatStrip — 4 Genie KPIs as an inline divider-separated
 *      strip (no per-metric cards).
 *   2. Mode chips — compact pills, one click → Studio Alpha preset.
 *
 * Hierarchy is deliberately flat: the card is the only bordered surface;
 * everything inside is dividers + chips. Numbers carry the weight,
 * modes are the action.
 *
 * Demo data matches the AI-plan AnalyticsHero constants so the two
 * dashboards stay numerically consistent.
 */

const GENIE_STATS: StatItem[] = [
  { label: "Generations", value: "192", delta: { value: 4.5 } },
  { label: "Brands", value: "15", delta: { value: 4.5 } },
  { label: "Products", value: "47", delta: { value: 8 } },
  { label: "Categories", value: "12", delta: { value: 2, unit: "" } },
];

const MODES: Array<{ id: string; label: string; icon: LucideIcon; skipGate?: boolean }> = [
  { id: "brand-ad", label: "Brand Ad", icon: Sparkles },
  { id: "product-ad", label: "Product Ad", icon: ShoppingBag },
  { id: "affiliate-ad", label: "Affiliate", icon: Target },
  { id: "product-shoot", label: "Product Shoot", icon: Camera },
  { id: "ugc-video", label: "UGC Video", icon: Video },
  { id: "variation", label: "Variations", icon: RefreshCw, skipGate: true },
];

export function GenieSection() {
  return (
    <section
      data-fabads-dash-section="genie"
      aria-label="Genie workspace"
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
    >
      {/* Quiet header — low hierarchy: small icon + name + faded tagline,
          right-aligned link. */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Wand2 className="h-3.5 w-3.5 text-foreground" aria-hidden />
          <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
            Genie
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            · workspace
          </span>
        </div>
        <Link
          to="/iq/genie6/library"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open library
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <DashboardStatStrip stats={GENIE_STATS} />

      {/* Modes — compact pills below a hairline. The "generate" entry
          points, kept secondary to the numbers above. */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Generate · pick a mode
          </span>
          <Link
            to="/iq/genie6/studio-alpha"
            className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const href = `/iq/genie6/studio-alpha?mode=${m.id}${m.skipGate ? "&skipGate=1" : ""}`;
            return (
              <Link
                key={m.id}
                to={href}
                className={cn(
                  "group inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5",
                  "text-[12px] font-medium text-foreground transition-all",
                  "hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.04]",
                )}
              >
                <Icon
                  className="h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span>{m.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
