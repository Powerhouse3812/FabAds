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

/**
 * AI-plan Dashboard — v1.3 (Maalik reorder + restored upsell trio).
 *
 * A-12.188: Maalik did a sit-down review of the v1.2 layout and asked for
 * two changes that together dismantle the Row 4 bento body:
 *
 *   1. The Credit + Industry Insights pair moves UP — promoted from the
 *      right column of the bento to its own flat 2-col row above the mode
 *      launcher.
 *   2. The TopPerformer + RecentWork pair moves DOWN — demoted from the
 *      left column of the bento to its own flat 2-col row below the mode
 *      launcher.
 *
 * ModeLauncherBar ("generate mode wala") stays sandwiched between them,
 * which gives the dashboard a clearer cadence: hero strip → analytics →
 * fresh ads → spend/market context → action launcher → recent results →
 * upsell tail.
 *
 * Plus the 3 upsell components deleted in A-12.186 (UpsellRow,
 * AiDashboardUpsellHero, AiDashboardUpsellSide) are back. That deletion
 * was a misread of Maalik's intent — only the header-area upsell was meant
 * to be replaced by UpsellCornerPill, the 3 body-row upsells were never
 * supposed to go. A parallel git-restore agent is bringing the component
 * files back; this file re-imports them and mounts them at the bottom as
 * Rows 7/8/9. UpsellCornerPill stays in the header.
 *
 * Composition (top → bottom):
 *
 *   ROW 0  Header (greeting + UpsellCornerPill + Refresh)
 *   ROW 1  NowStatusStrip       (chips: credits, new, attention, setup)
 *   ROW 2  AnalyticsHero        (compacted chart + KPI tiles)
 *   ROW 3  NewAdsFetchedTile    ★ fresh ads pulled via Industry Insights
 *   ROW 4  Pair row (lg:grid-cols-2, gap-3):
 *            CreditUsageCard | IndustryInsightsTile
 *   ROW 5  ModeLauncherBar      (6 compact mode rows)
 *   ROW 6  Pair row (lg:grid-cols-2, gap-3):
 *            TopPerformerStrip | RecentWorkStrip
 *   ROW 7  UpsellRow            (RESTORED — 3-tile horizontal upsell)
 *   ROW 8  AiDashboardUpsellHero (RESTORED — dual-lane upsell hero)
 *   ROW 9  AiDashboardUpsellSide (RESTORED — ROI side card)
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
          {/* ROW 1 — Status chips */}
          <motion.section variants={rowVariants}>
            <NowStatusStrip />
          </motion.section>

          {/* ROW 2 — Analytics hero */}
          <motion.section variants={rowVariants}>
            <AnalyticsHero />
          </motion.section>

          {/* ROW 3 — New ads fetched (priority placement — the most
              action-driving surface on the dashboard; fresh ads pulled
              in via the Industry Insights extension). */}
          <motion.section variants={rowVariants}>
            <NewAdsFetchedTile />
          </motion.section>

          {/* ROW 4 — Pair row: Credit | Industry Insights.
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

          {/* ROW 5 — Mode launcher (stays sandwiched between the two
              pair rows — Maalik's "generate mode wala", middle of the
              dashboard). */}
          <motion.section variants={rowVariants}>
            <ModeLauncherBar />
          </motion.section>

          {/* ROW 6 — Pair row: TopPerformer | RecentWork.
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

          {/* ROW 7 — Upsell row (RESTORED in A-12.188).
              3-tile horizontal upsell — the A-12.186 deletion was a
              misread, this comes back unchanged. */}
          <motion.section variants={rowVariants}>
            <UpsellRow />
          </motion.section>

          {/* ROW 8 — Upsell hero (RESTORED in A-12.188).
              Dual-lane upsell hero — same misread-deletion story. */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellHero />
          </motion.section>

          {/* ROW 9 — Upsell side (RESTORED in A-12.188).
              ROI side card — final restored upsell. */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellSide />
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
