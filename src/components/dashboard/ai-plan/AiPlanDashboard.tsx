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
import { UpsellRow } from "./UpsellRow";
import { AiDashboardUpsellHero } from "./AiDashboardUpsellHero";
import { AiDashboardUpsellSide } from "./AiDashboardUpsellSide";
import { ZeroStateSetupTakeover } from "./ZeroStateSetupTakeover";
import { TopPerformerStrip } from "./TopPerformerStrip";
import { CreditUsageCard } from "./CreditUsageCard";
import { IndustryInsightsTile } from "./IndustryInsightsTile";
import { NewAdsFetchedTile } from "./NewAdsFetchedTile";

/**
 * AI-plan Dashboard — v1.2 (consolidated single-dashboard pass).
 *
 * The V1/V2 toggle is gone. Maalik compared both iterations side-by-side
 * and locked a best-of-both content list — the V2 file (and its private
 * sub-components) have been deleted entirely. This file is now THE
 * dashboard. Composition pulls TopPerformerStrip up from the V2 folder,
 * adds three new tiles owned by parallel agents (CreditUsageCard,
 * IndustryInsightsTile, NewAdsFetchedTile), and reshuffles the row order
 * so the most action-driving surface — NewAdsFetchedTile, fresh ads
 * pulled in via the Industry Insights extension — sits prominently
 * above the bento fold.
 *
 * What got cut from the prior iter:
 *
 *   - SpotlightRow CUT — content (Trending + Catalogue health) felt
 *     redundant once IndustryInsightsTile + NewAdsFetchedTile carry the
 *     "what's happening in your market" story with sharper specificity.
 *   - AiSuggestionsCoach CUT — copy-heavy bottom row that nobody acted
 *     on. NowStatusStrip already surfaces the same chips with intent.
 *   - VideoSageRecentTile CUT — single-mode tile in a multi-mode shell;
 *     RecentWorkStrip already covers recent work across all modes.
 *   - DashboardVariantToggle CUT — no V2 to flip to anymore.
 *
 * Composition (top → bottom):
 *
 *   ROW 0  Header (greeting + Refresh — no variant toggle)
 *   ROW 1  NowStatusStrip       (chips: credits, new, attention, setup)
 *   ROW 2  AnalyticsHero        (compacted chart + KPI tiles)
 *   ROW 3  NewAdsFetchedTile    ★ priority placement — fresh ads in
 *   ROW 4  Bento 2-col (lg:grid-cols-12, gap-4):
 *            LEFT  col-span-7 : TopPerformerStrip + RecentWorkStrip
 *            RIGHT col-span-5 : CreditUsageCard + IndustryInsightsTile
 *          Below 1080px the columns stack single (default grid-cols-1).
 *   ROW 5  ModeLauncherBar      (6 compact mode rows)
 *   ROW 6  UpsellRow            (3 Full-plan upsell tiles)
 *   ROW 7  AiDashboardUpsellHero
 *   ROW 8  AiDashboardUpsellSide
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
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

          {/* ROW 4 — Bento 2-col.
                LEFT  (7/12) : TopPerformerStrip + RecentWorkStrip
                RIGHT (5/12) : CreditUsageCard + IndustryInsightsTile
              Stacks single-column below the lg breakpoint. */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
          >
            <div className="lg:col-span-7 space-y-3">
              <TopPerformerStrip />
              <RecentWorkStrip />
            </div>
            <div className="lg:col-span-5 space-y-3">
              <CreditUsageCard />
              <IndustryInsightsTile />
            </div>
          </motion.section>

          {/* ROW 5 — Mode launcher */}
          <motion.section variants={rowVariants}>
            <ModeLauncherBar />
          </motion.section>

          {/* ROW 6 — Upsell row (Full plan promotion) */}
          <motion.section variants={rowVariants}>
            <UpsellRow />
          </motion.section>

          {/* ROW 7 — Dual-lane upsell hero (social proof + Growth CTA) */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellHero />
          </motion.section>

          {/* ROW 8 — ROI-led mid-page upsell card */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellSide />
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
