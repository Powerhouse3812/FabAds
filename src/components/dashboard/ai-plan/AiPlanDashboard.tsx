import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { brands } from "@/mocks/shared/brands";
import { NowStatusStrip } from "./NowStatusStrip";
import { AnalyticsHero } from "./AnalyticsHero";
import { ModeLauncherBar } from "./ModeLauncherBar";
import { RecentWorkStrip } from "./RecentWorkStrip";
import { UpsellCornerPill } from "./UpsellCornerPill";
import { ZeroStateSetupTakeover } from "./ZeroStateSetupTakeover";
import { TopPerformerStrip } from "./TopPerformerStrip";
import { CreditUsageCard } from "./CreditUsageCard";
import { IndustryInsightsTile } from "./IndustryInsightsTile";
import { NewAdsFetchedTile } from "./NewAdsFetchedTile";
import { UpsellRow } from "./UpsellRow";
import { AiDashboardUpsellHero } from "./AiDashboardUpsellHero";
import { AiDashboardUpsellSide } from "./AiDashboardUpsellSide";
import {
  OnboardingProgressCard,
  ONBOARDING_COMPLETE,
} from "./OnboardingProgressCard";

/**
 * AI-plan Dashboard — v1.4 (OnboardingProgressCard promoted to its own row).
 *
 * A-12.190: A-12.189 mounted OnboardingProgressCard as a third column inside
 * AnalyticsHero (chart-6 | KPIs-3 | onboarding-3). Audit P0 flagged that
 * this jammed the chart canvas down to ~360px at lg and cramped the KPI
 * tiles, dismantling the clean chart + KPI single-row hero from A-12.187.
 *
 * Fix: OnboardingProgressCard moved from inside AnalyticsHero (col-3) to
 * its own dedicated Row 1, only renders while setup is in progress (gated
 * via the exported ONBOARDING_COMPLETE flag — when true, the row collapses
 * with no empty space). AnalyticsHero reverts to the A-12.187 layout:
 * chart col-span-7 | KPIs col-span-5.
 *
 * A-12.188 history (kept for context): Credit + Industry Insights pair
 * sits above the mode launcher; TopPerformer + RecentWork pair sits below.
 * ModeLauncherBar ("generate mode wala") stays sandwiched between them.
 * The 3 body-row upsells (UpsellRow, AiDashboardUpsellHero,
 * AiDashboardUpsellSide) are restored at the tail; UpsellCornerPill stays
 * in the header.
 *
 * Composition (top → bottom):
 *
 *   ROW 0  Header (greeting + UpsellCornerPill + Refresh)
 *   ROW 1  OnboardingProgressCard  ★ NEW — only while !ONBOARDING_COMPLETE
 *   ROW 2  NowStatusStrip       (chips: credits, new, attention, setup)
 *   ROW 3  AnalyticsHero        (clean chart-7 + KPIs-5, A-12.187 layout)
 *   ROW 4  NewAdsFetchedTile    ★ fresh ads pulled via Industry Insights
 *   ROW 5  Pair row (lg:grid-cols-2, gap-3):
 *            CreditUsageCard | IndustryInsightsTile
 *   ROW 6  ModeLauncherBar      (6 compact mode rows)
 *   ROW 7  Pair row (lg:grid-cols-2, gap-3):
 *            TopPerformerStrip | RecentWorkStrip
 *   ROW 8  UpsellRow            (3-tile horizontal upsell)
 *   ROW 9  AiDashboardUpsellHero (dual-lane upsell hero)
 *   ROW 10 AiDashboardUpsellSide (ROI side card)
 *
 * Both pair rows collapse to single-column below the lg breakpoint so
 * mobile stacks cleanly.
 *
 * ZeroStateSetupTakeover still gates the whole composition on isNewUser.
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
          {/* ROW 1 — Onboarding progress card (A-12.190).
              Promoted out of AnalyticsHero (was a cramped col-3 slot
              there) into its own dedicated row. Auto-hides once setup
              is complete via the ONBOARDING_COMPLETE flag so this row
              collapses with no empty real-estate. */}
          {!ONBOARDING_COMPLETE && (
            <motion.section variants={rowVariants}>
              <OnboardingProgressCard />
            </motion.section>
          )}

          {/* ROW 2 — Status chips */}
          <motion.section variants={rowVariants}>
            <NowStatusStrip />
          </motion.section>

          {/* ROW 3 — Analytics hero (clean chart-7 + KPIs-5, A-12.187 layout) */}
          <motion.section variants={rowVariants}>
            <AnalyticsHero />
          </motion.section>

          {/* ROW 4 — New ads fetched (priority placement — the most
              action-driving surface on the dashboard; fresh ads pulled
              in via the Industry Insights extension). */}
          <motion.section variants={rowVariants}>
            <NewAdsFetchedTile />
          </motion.section>

          {/* ROW 5 — Pair row: Credit | Industry Insights.
              Was the right column of the v1.2 bento; promoted UP per
              Maalik so spend/market context lands before the launcher.
              Stacks single-column below the lg breakpoint. */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            <CreditUsageCard />
            <IndustryInsightsTile />
          </motion.section>

          {/* ROW 6 — Mode launcher (stays sandwiched between the two
              pair rows — Maalik's "generate mode wala", middle of the
              dashboard). */}
          <motion.section variants={rowVariants}>
            <ModeLauncherBar />
          </motion.section>

          {/* ROW 7 — Pair row: TopPerformer | RecentWork.
              Was the left column of the v1.2 bento; demoted DOWN per
              Maalik so recent results sit after the action launcher.
              Stacks single-column below the lg breakpoint. */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            <TopPerformerStrip />
            <RecentWorkStrip />
          </motion.section>

          {/* ROW 8 — Upsell row (RESTORED in A-12.188).
              3-tile horizontal upsell — the A-12.186 deletion was a
              misread, this comes back unchanged. */}
          <motion.section variants={rowVariants}>
            <UpsellRow />
          </motion.section>

          {/* ROW 9 — Upsell hero (RESTORED in A-12.188).
              Dual-lane upsell hero — same misread-deletion story. */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellHero />
          </motion.section>

          {/* ROW 10 — Upsell side (RESTORED in A-12.188).
              ROI side card — final restored upsell. */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellSide />
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
