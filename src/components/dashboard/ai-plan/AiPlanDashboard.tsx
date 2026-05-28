import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/use-credits";
import { brands } from "@/mocks/shared/brands";
import { AnalyticsHero } from "./AnalyticsHero";
import { ModeLauncherBar } from "./ModeLauncherBar";
import { RecentWorkStrip } from "./RecentWorkStrip";
import { UpsellCornerPill } from "./UpsellCornerPill";
import { ZeroStateSetupTakeover } from "./ZeroStateSetupTakeover";
import { CreditUsageCard } from "./CreditUsageCard";
import { IndustryInsightsTile } from "./IndustryInsightsTile";
import { NewAdsFetchedTile } from "./NewAdsFetchedTile";
import { ActivityLogsTile } from "./ActivityLogsTile";
import { RecentlyFetchedCard } from "./RecentlyFetchedCard";
import { UpsellRow } from "./UpsellRow";
import { AiDashboardUpsellHero } from "./AiDashboardUpsellHero";
import { AiDashboardUpsellSide } from "./AiDashboardUpsellSide";
import { CreditApproachingBanner } from "@/components/upsell/CreditApproachingBanner";
import { CreditAtLimitModal } from "@/components/upsell/CreditAtLimitModal";

/**
 * AI-plan Dashboard — v1.6 (Figma full redesign).
 *
 * A-12.191: Full composition rewrite to match Maalik's finalised Figma at
 * node `5794-7194`. The previous v1.5 already collapsed the hero into the
 * new 4-card row; this iter aligns the rest of the page to the design:
 *
 *   • NowStatusStrip dropped — not present in Figma. Credits + setup status
 *     already surfaced in the header credits chip + Card 4 of the 4-KPI
 *     row, so the standalone chip strip becomes redundant.
 *   • TopPerformerStrip dropped — not present in Figma. Top-performer
 *     surface moved into Card 3 of the KPI row (Competitor 15/20 with
 *     "Top performing" platform tags).
 *   • CreditUsageCard goes wide (col-span-7 on lg); IndustryInsightsTile
 *     stays narrow (col-span-5 on lg). Both redesigned per Figma — Credit
 *     gets a 30px Geist Bold "1218 / 1500" hero + 4-col footer strip;
 *     Industry gets a Recharts donut + Creatives/Videos breakdown +
 *     Trending Keywords pill footer.
 *   • ModeLauncherBar rebuilt as a single horizontal row of 6 mode cards.
 *   • New bento body row: LEFT col-7 stacks NewAdsFetchedTile +
 *     RecentWorkStrip; RIGHT col-5 mounts the new ActivityLogsTile
 *     (vertical timeline with dashed tails — Figma-native pattern).
 *   • Header adds a credits chip beside UpsellCornerPill (compact pill
 *     showing live credits balance, matches Figma).
 *   • Upsell trio at the tail unchanged in mount order; internals
 *     restored to Figma copy ("12,000+ agencies" + "4 hrs/week" stats
 *     are deliberate per Maalik — Figma overrides DS §6 in this case).
 *
 * Composition (top → bottom):
 *
 *   ROW 0    Header (greeting + Trial pill + Credits chip + Refresh)
 *   ROW 1    AnalyticsHero (5-col grid, 2 KPI rows + right-rail Setup):
 *              Row 1 cols 1-4  Genie KPIs    — Gens / Brands / Products / Categories
 *              Row 2 cols 1-4  Industry KPIs — Brands followed / Competitors /
 *                              Total ads / Categories tracked
 *              Col 5 (row-span 2) — Setup workspace card (per-module onboarding:
 *                              Genie / Industry / Catalogue, 1/3 completed)
 *   ROW 2    Pair row (12-col grid):
 *              CreditUsageCard (col-7) | IndustryInsightsTile (col-5)
 *   ROW 3    ModeLauncherBar (6 horizontal mode cards)
 *   ROW 3.5  RecentlyFetchedCard (NEW — below Generate; pick up where you
 *              left off; click any recent brand/product/category to jump
 *              into Ad-create with it pre-selected)
 *   ROW 4    Bento body (12-col grid):
 *              LEFT col-7: NewAdsFetchedTile (+ source-type tags per ad row:
 *                          Brand / Competitor / Category) + RecentWorkStrip
 *              RIGHT col-5: ActivityLogsTile (timeline)
 *   ROW 5    UpsellRow (3-tile horizontal upsell)
 *   ROW 6    AiDashboardUpsellHero (single-row hero with brand monograms)
 *   ROW 7    AiDashboardUpsellSide (ROI · agency case strip)
 *
 * ZeroStateSetupTakeover still gates the whole composition on isNewUser.
 *
 * A-12.198 (this iter): handover-driven content fix. The previous 4-card
 * row mixed Genie + Industry insights together ("Brands active" was
 * actually Industry data); confused users about which numbers came from
 * which module. New 2-row split makes the source explicit with mono-caps
 * row headers. Setup card repurposed from step-tracker → per-module
 * onboarding tracker. RecentlyFetchedCard added as a high-leverage
 * quick-action below the Generate row.
 */
export function AiPlanDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  const rawName = user?.email?.split("@")[0] || "User";
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const userSkippedSetup = searchParams.get("setup") === "skip";

  const isNewUser = useMemo(() => {
    if (userSkippedSetup) return false;
    const first = brands[0];
    if (!first) return true;
    const brandReady =
      first.voice.length > 20 &&
      first.colors.length >= 2 &&
      first.usps.length >= 2;
    const competitorsReady = first.competitors.length >= 3;
    const forceFlag = searchParams.get("newuser") === "true";
    if (forceFlag) return true;
    return !(brandReady && competitorsReady);
  }, [searchParams, userSkippedSetup]);

  const handleSkipSetup = () => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("setup", "skip");
        return sp;
      },
      { replace: false },
    );
  };

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const containerVariants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
  } as const;

  const rowVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] },
    },
  } as const;

  return (
    <div className="pb-6">
      {/* ── ROW 0 — Header ── */}
      <header className="flex items-end justify-between flex-wrap gap-3 mb-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground leading-none">
            {isNewUser ? `Welcome, ${firstName}` : `Hi, ${firstName}`}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-snug">
            {isNewUser
              ? "Three quick steps before you start generating."
              : "Here's what's on your plate today."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isNewUser && (
            <>
              <UpsellCornerPill />
              <HeaderCreditsChip />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </>
          )}
        </div>
      </header>

      {isNewUser ? (
        <ZeroStateSetupTakeover onSkip={handleSkipSetup} />
      ) : (
        <motion.div
          key={refreshKey}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {/* Credit-state surfaces. Banner renders only at >=85% usage;
              modal opens once per session at >=100%. Both self-gate via
              useCredits() so mount order is the only knob here. */}
          <CreditApproachingBanner />
          <CreditAtLimitModal />

          {/* ROW 1 — Analytics hero (5-col, 2-KPI-rows + right-rail Setup).
              A-12.198 restructure per Maalik's handover:
                Row 1 (cols 1-4):  Genie KPIs    — Gens / Brands / Products / Categories
                Row 2 (cols 1-4):  Industry KPIs — Brands followed / Competitors / Total ads / Categories tracked
                Col 5 (spans both rows): Setup workspace card (per-module onboarding tracker:
                  Genie / Industry Insights / Catalogue — 1/3 onboardings completed). */}
          <motion.section variants={rowVariants}>
            <AnalyticsHero />
          </motion.section>

          {/* ROW 2 — Pair row: Credit (col-7 wide hero) | Industry (col-5).
              Per Figma the credit usage gets the bulk of the row so the
              "1218 / 1500" hero number lands at full visual weight; the
              Industry donut sits compact to the right. */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch"
          >
            <div className="lg:col-span-7">
              <CreditUsageCard />
            </div>
            <div className="lg:col-span-5">
              <IndustryInsightsTile />
            </div>
          </motion.section>

          {/* ROW 3 — Mode launcher (6 horizontal mode cards). */}
          <motion.section variants={rowVariants}>
            <ModeLauncherBar />
          </motion.section>

          {/* ROW 3.5 — Recently fetched / created (below Generate per Maalik's
              handover). Quick-action card showing recently fetched brands,
              products, and recently created categories. Click any item →
              deep-links into Ad-create with the entity pre-selected,
              skipping the brand-pick step. */}
          <motion.section variants={rowVariants}>
            <RecentlyFetchedCard />
          </motion.section>

          {/* ROW 4 — Bento body.
              LEFT col-7 stacks NewAdsFetchedTile (priority surface) +
              RecentWorkStrip (status ledger). RIGHT col-5 mounts the
              new ActivityLogsTile (vertical timeline). Stacks single
              column below lg. */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start"
          >
            <div className="lg:col-span-7 space-y-3">
              <NewAdsFetchedTile />
              <RecentWorkStrip />
            </div>
            <div className="lg:col-span-5">
              <ActivityLogsTile />
            </div>
          </motion.section>

          {/* ROW 5 — Upsell row (3 tiles: Launch · Reports · Automation). */}
          <motion.section variants={rowVariants}>
            <UpsellRow />
          </motion.section>

          {/* ROW 6 — Upsell hero ("Outgrow your AI plan" + brand monograms). */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellHero />
          </motion.section>

          {/* ROW 7 — Upsell side (ROI · agency case · "4 hrs/week"). */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellSide />
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}

/* ── Header credits chip ──
   Compact pill per Figma — shows live credits balance beside the trial
   pill. Routes to the plans page on click. Data source unified through
   `useCredits()`: same values as CreditUsageCard, no more 73/100 vs
   1218/1500 contradiction. Pill border + icon tint shift to amber at
   the 85% warning band and red at the 100% at-limit state. */
function HeaderCreditsChip() {
  const { used, limit, isApproaching, isAtLimit } = useCredits();

  const stateClasses = isAtLimit
    ? "border-red-500/50 bg-red-500/[0.06] hover:border-red-500/70"
    : isApproaching
      ? "border-amber-500/50 bg-amber-500/[0.06] hover:border-amber-500/70"
      : "border-border bg-card hover:border-foreground/20";

  const iconClasses = isAtLimit
    ? "text-red-600"
    : isApproaching
      ? "text-amber-600"
      : "text-primary";

  return (
    <Link
      to="/plans-v2"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[12px] transition-colors",
        stateClasses,
      )}
      aria-label={`${used} of ${limit} credits used`}
    >
      <Zap className={cn("h-3.5 w-3.5", iconClasses)} strokeWidth={2.2} aria-hidden />
      <span className="font-mono tabular-nums text-foreground">{used}</span>
      <span className="font-mono tabular-nums text-muted-foreground">
        /{limit}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        credits
      </span>
    </Link>
  );
}
