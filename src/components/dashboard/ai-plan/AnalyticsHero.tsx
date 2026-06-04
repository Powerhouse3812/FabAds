/**
 * AnalyticsHero — 5-col 2-row KPI grid (A-12.192, Figma redesign).
 *
 * Strategic context (Maalik's pivot):
 *   A-12.191 collapsed the hero into a single row of 4 cards where the
 *   4th card absorbed onboarding inline. That packed too many disparate
 *   concerns into one row (mixing Genie + Industry data) and made the
 *   Setup card visually compete with KPIs.
 *
 *   A-12.192 splits the hero into TWO logical KPI rows, separated by
 *   mono-caps row headers, with a dedicated Setup card on the right rail
 *   spanning the full hero height:
 *     • Row 1 (Genie insights):   Generations / Brands / Products / Categories
 *     • Row 2 (Industry insights): Brands followed / Competitors / Total ads / Categories tracked
 *     • Col 5 (Setup card):        OnboardingProgressCard, spans both rows.
 *
 *   The 5-col CSS grid has 4 logical rows on cols 1-4 (header + KPIs ×2)
 *   and col 5 is occupied by a single child with row-span-4, so it spans
 *   from the top of Row 1's header to the bottom of Row 2's KPI cards.
 *
 * Mock-data note: deterministic at module scope (no per-render randomness).
 * When the real entities land, swap module-level constants for live selectors.
 */
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanUpsellRailCard } from "./PlanUpsellRailCard";

interface AnalyticsHeroProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic mock data — seeded at module level (NOT in render)
// ─────────────────────────────────────────────────────────────────────────────

// Generations sparkline — 12 points, gently rising
const SPARK_GENS = Array.from({ length: 12 }, (_, i) => ({
  i,
  v: 8 + Math.floor(i * 0.9) + ((i * 7) % 5),
}));

// Pill lists — per card
const TRENDING_BRANDS = ["Mamaearth", "Noise", "Boat"];
const TOP_PLATFORMS = ["Meta", "TikTok", "NewsBreak"];

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Mono caps eyebrow — Fabfunnel v1.2 spec. */
function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Big primary number — Geist 500 20px. */
function BigNumber({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[20px] font-semibold leading-none text-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Up-trend delta chip — lime success token, mini TrendingUp icon.
 *  `prefix` controls the leading symbol: "%" → "+4.5%", "" → "+2" (raw count).
 */
function DeltaChip({
  value,
  unit = "%",
}: {
  value: number;
  unit?: "%" | "";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-primary/15 px-1.5 py-0.5",
        "font-mono text-[10px] font-semibold text-primary tabular-nums",
      )}
    >
      <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.4} />+{value}
      {unit}
    </span>
  );
}

/** Common KPI card shell — 134px min, rounded-2xl, soft shadow. */
const CARD_BASE =
  "min-h-[134px] rounded-2xl border border-border/60 bg-card p-4 " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col";

/** Row header — tiny mono caps banding label sitting above a KPI row. */
function RowHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:col-span-4 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW 1 — Genie insights
// ─────────────────────────────────────────────────────────────────────────────

/** CARD 1.1 — Generations (sparkline) */
function CardGenerations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      {/* Header */}
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Generations</Eyebrow>
          <BigNumber>192</BigNumber>
        </div>
        <DeltaChip value={4.5} />
      </div>

      {/* Sparkline — decorative, no axes/grid/tooltip */}
      <div className="mt-auto h-[50px] w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={SPARK_GENS}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="genSparkArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#95BC20" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#95BC20" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#95BC20"
              strokeWidth={1.75}
              fill="url(#genSparkArea)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/** CARD 1.2 — Brands (total Genie brands) */
function CardBrands() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Brands</Eyebrow>
          <BigNumber>15</BigNumber>
        </div>
        <DeltaChip value={4.5} />
      </div>
      <span className="mt-auto pt-2 text-[11.5px] text-muted-foreground">
        Across all workspaces
      </span>
    </motion.div>
  );
}

/** CARD 1.3 — Products (total Genie products) */
function CardProducts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Products</Eyebrow>
          <BigNumber>47</BigNumber>
        </div>
        <DeltaChip value={8} />
      </div>
      <span className="mt-auto pt-2 text-[11.5px] text-muted-foreground">
        Created this month
      </span>
    </motion.div>
  );
}

/** CARD 1.4 — Categories (total Genie categories) */
function CardCategories() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Categories</Eyebrow>
          <BigNumber>12</BigNumber>
        </div>
        <DeltaChip value={2} unit="" />
      </div>
      <span className="mt-auto pt-2 text-[11.5px] text-muted-foreground">
        Catalogue groups
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW 2 — Industry insights
// ─────────────────────────────────────────────────────────────────────────────

/** CARD 2.1 — Brands followed (Industry Insights) */
function CardBrandsFollowed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Brands followed</Eyebrow>
          <BigNumber>8</BigNumber>
        </div>
        <DeltaChip value={1} unit="" />
      </div>

      {/* Footer — trending brand pills */}
      <div className="mt-auto pt-2 border-t border-border/60 flex flex-col gap-1.5">
        <Eyebrow>Trending</Eyebrow>
        <div className="flex items-center gap-1 flex-wrap">
          {TRENDING_BRANDS.map((b) => (
            <span
              key={b}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5",
                "bg-foreground/5 text-foreground/45 text-[11px] leading-none",
              )}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** CARD 2.2 — Competitors (count / limit + top platforms) */
function CardCompetitors() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Competitors</Eyebrow>
          <div className="flex items-baseline gap-1">
            <BigNumber>15</BigNumber>
            <span className="text-[12px] font-semibold text-muted-foreground tabular-nums leading-none">
              / 20
            </span>
          </div>
        </div>
        <DeltaChip value={4.5} />
      </div>

      {/* Footer — top platforms */}
      <div className="mt-auto pt-2 border-t border-border/60 flex flex-col gap-1.5">
        <Eyebrow>Top platforms</Eyebrow>
        <div className="flex items-center gap-1 flex-wrap">
          {TOP_PLATFORMS.map((p) => (
            <span
              key={p}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5",
                "bg-foreground/5 text-foreground/45 text-[11px] leading-none",
              )}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** CARD 2.3 — Total ads (footer split Images / Videos) */
function CardTotalAds() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Total ads</Eyebrow>
          <BigNumber>24,851</BigNumber>
        </div>
        <DeltaChip value={12} />
      </div>

      {/* Footer split — Images | Videos */}
      <div className="mt-auto pt-2 border-t border-border/60 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Eyebrow>Images</Eyebrow>
          <span className="text-[13px] font-medium text-foreground tabular-nums leading-none">
            18,420
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <Eyebrow>Videos</Eyebrow>
          <span className="text-[13px] font-medium text-foreground tabular-nums leading-none">
            6,431
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/** CARD 2.4 — Categories tracked (Industry Insights trend categories) */
function CardCategoriesTracked() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Categories tracked</Eyebrow>
          <BigNumber>9</BigNumber>
        </div>
        <DeltaChip value={2} unit="" />
      </div>
      <span className="mt-auto pt-2 text-[11.5px] text-muted-foreground">
        Trend categories
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grid topology (lg breakpoint and up):
 *   ┌─────────────────────────────────────────────┬──────────┐
 *   │ ROW 1: GENIE INSIGHTS header (cols 1-4)     │          │
 *   ├──────────┬──────────┬──────────┬────────────┤          │
 *   │ Gen.     │ Brands   │ Products │ Categories │  Setup   │
 *   ├──────────┴──────────┴──────────┴────────────┤  card    │
 *   │ ROW 3: INDUSTRY INSIGHTS header (cols 1-4)  │ (col 5,  │
 *   ├──────────┬──────────┬──────────┬────────────┤  row-    │
 *   │ Followed │ Compet.  │ Total ads│ Cat. track │  span-4) │
 *   └──────────┴──────────┴──────────┴────────────┴──────────┘
 *
 * The OnboardingProgressCard is the FIRST child of col-5 with
 * lg:col-start-5 lg:row-start-1 lg:row-span-4, anchoring the right rail
 * across all four logical rows on cols 1-4.
 */
export function AnalyticsHero({ className }: AnalyticsHeroProps) {
  return (
    <section
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3",
        className,
      )}
    >
      {/* Row 1 header — GENIE INSIGHTS */}
      <RowHeader>Genie insights</RowHeader>

      {/* Row 2 — 4 Genie KPI cards (cols 1-4) */}
      <CardGenerations />
      <CardBrands />
      <CardProducts />
      <CardCategories />

      {/* Setup card — spans full hero height on col 5 */}
      <PlanUpsellRailCard className="lg:row-span-4 lg:col-start-5 lg:row-start-1 lg:self-stretch" />

      {/* Row 3 header — INDUSTRY INSIGHTS */}
      <RowHeader>Industry insights</RowHeader>

      {/* Row 4 — 4 Industry KPI cards (cols 1-4) */}
      <CardBrandsFollowed />
      <CardCompetitors />
      <CardTotalAds />
      <CardCategoriesTracked />
    </section>
  );
}

export default AnalyticsHero;

// A-12.196: the AnalyticsHeroGenieRow / AnalyticsHeroInsightsRow exports
// (added in A-12.195) were removed. The Growth dashboard no longer reuses
// the heavy 134px KPI cards — GenieSection + IndustryInsightsSection now
// render their own compact inline stat strip (DashboardStatStrip). This
// file is back to being AI-plan-only.
