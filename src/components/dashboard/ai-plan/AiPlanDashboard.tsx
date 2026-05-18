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
import { LivePulseTicker } from "./LivePulseTicker";
import { SetupStepperBar } from "./SetupStepperBar";
import { SpotlightRow } from "./SpotlightRow";
import { AiSuggestionsCoach } from "./AiSuggestionsCoach";
import { VideoSageRecentTile } from "./VideoSageRecentTile";
import { ZeroStateSetupTakeover } from "./ZeroStateSetupTakeover";

/**
 * AI-plan Dashboard — iter 4 (analytics-led).
 *
 * Strategic pivot (Maalik, locked):
 *   Iter 3 mosaic-as-hero was Suno-style but answered "what did I make?"
 *   not "what should I do?". Brands as hero → no action emerges.
 *   This iter inverts: ANALYTICS becomes the hero, with embedded
 *   drill-throughs from each metric. Mode launcher sits directly under
 *   the chart so action is one click away. The past-work mosaic
 *   demotes to a smaller strip below.
 *
 * Composition (top → bottom):
 *
 *   ROW 0  Header
 *   ROW 1  NowStatusStrip       Glance chips (credits, new, attention)
 *   ROW 2  AnalyticsHero        DOMINANT — chart + 4 KPI tiles with
 *                               deltas + sparklines. Each tile drills
 *                               into its source surface.
 *   ROW 3  ModeLauncherBar      6 mode cards, one-click → Studio Alpha
 *                               with mode pre-selected.
 *   ROW 4  RecentWorkStrip      4-card uniform grid (replaces broken
 *                               MosaicHero — masonry-in-CSS fixed).
 *   ROW 5  LivePulseTicker      Rotating single-event display.
 *   ROW 6  SetupStepperBar      Auto-hides ≥75% done.
 *   ROW 7  SpotlightRow         Trending today + Catalogue health.
 *   ROW 8  Coach + Video Sage   AI suggestions + recent video analyses.
 *
 * Zero-state takeover (when activation threshold not met) replaces
 * everything below ROW 0 with the 3-step setup card. Same as before.
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

  /* ── Page-level stagger ── */
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
          {/* ── ROW 1 — Now status chips ── */}
          <motion.section variants={rowVariants}>
            <NowStatusStrip />
          </motion.section>

          {/* ── ROW 2 — Analytics hero (DOMINANT) ── */}
          <motion.section variants={rowVariants}>
            <AnalyticsHero />
          </motion.section>

          {/* ── ROW 3 — Mode launcher ── */}
          <motion.section variants={rowVariants}>
            <ModeLauncherBar />
          </motion.section>

          {/* ── ROW 4 — Recent work (smaller mosaic) ── */}
          <motion.section variants={rowVariants}>
            <RecentWorkStrip />
          </motion.section>

          {/* ── ROW 5 — Live ticker ── */}
          <motion.section variants={rowVariants}>
            <LivePulseTicker />
          </motion.section>

          {/* ── ROW 6 — Setup stepper (auto-hides ≥75% done) ── */}
          <motion.section variants={rowVariants}>
            <SetupStepperBar />
          </motion.section>

          {/* ── ROW 7 — Spotlight: Trending + Catalogue health ── */}
          <motion.section variants={rowVariants}>
            <SpotlightRow />
          </motion.section>

          {/* ── ROW 8 — Coach + Video Sage (60/40) ── */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start"
          >
            <div className="lg:col-span-3">
              <AiSuggestionsCoach />
            </div>
            <div className="lg:col-span-2">
              <VideoSageRecentTile />
            </div>
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
