import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { brands } from "@/mocks/shared/brands";
import { NowStatusStrip } from "./NowStatusStrip";
import { AnalyticsHero } from "./AnalyticsHero";
import { ModeLauncherBar } from "./ModeLauncherBar";
import { RecentWorkStrip } from "./RecentWorkStrip";
import { SpotlightRow } from "./SpotlightRow";
import { UpsellRow } from "./UpsellRow";
import { AiSuggestionsCoach } from "./AiSuggestionsCoach";
import { VideoSageRecentTile } from "./VideoSageRecentTile";
import { ZeroStateSetupTakeover } from "./ZeroStateSetupTakeover";

/**
 * AI-plan Dashboard — iter 5 (designer-critic pass).
 *
 * Pass-through critique applied this iter:
 *
 *   - LivePulseTicker CUT — claimed "LIVE" but was 8 hardcoded events on
 *     a 4.5s rotation. Faking liveness creates trust debt. No action
 *     emerged from any event. Surfaced one row of dashboard noise.
 *
 *   - SetupStepperBar CUT — folded into NowStatusStrip as a single
 *     "Setup 2/4" chip. The standalone 44px row was vestigial — users
 *     don't re-complete setup steps after onboarding; it just hung
 *     around showing the same partial state.
 *
 *   - RecentWorkStrip thumbnails REDESIGNED — looked like paint chips
 *     (gradient + brand initial). Now mode-aware mini ad-creative mocks
 *     (UGC frame / Brand Ad / Product Ad / Variation grid).
 *
 *   - AnalyticsHero CHART COMPACTED — header reshaped to put the big
 *     number + delta inline, chart dropped 120→96px.
 *
 *   - UpsellRow ADDED — 3 visual upsell tiles (Launch / Reports /
 *     Automation) promoting the Full plan in-context. Each click →
 *     /plans-v2?tier=growth. Replaces invisible "discover features by
 *     hitting a wall" pattern.
 *
 * Composition (top → bottom):
 *
 *   ROW 0  Header
 *   ROW 1  NowStatusStrip   (chips: credits, new, attention, setup)
 *   ROW 2  AnalyticsHero    (compacted — chart + 4 KPI tiles)
 *   ROW 3  ModeLauncherBar  (6 compact mode rows)
 *   ROW 4  RecentWorkStrip  (4 ad-mockup thumbnails)
 *   ROW 5  SpotlightRow     (Trending + Catalogue health)
 *   ROW 6  UpsellRow        (3 Full-plan upsell tiles)
 *   ROW 7  Coach + VideoSage (60/40 — flagged for visual redesign)
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
        {!isNewUser && (
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard?v=2"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/[0.06] px-3 py-2 text-[12px] font-medium text-primary hover:bg-primary/10 transition-colors"
              title="Preview V2 bento dashboard"
            >
              Try V2
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
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
          {/* ROW 1 — Status chips */}
          <motion.section variants={rowVariants}>
            <NowStatusStrip />
          </motion.section>

          {/* ROW 2 — Analytics hero */}
          <motion.section variants={rowVariants}>
            <AnalyticsHero />
          </motion.section>

          {/* ROW 3 — Mode launcher */}
          <motion.section variants={rowVariants}>
            <ModeLauncherBar />
          </motion.section>

          {/* ROW 4 — Recent work (mode-aware ad mockups) */}
          <motion.section variants={rowVariants}>
            <RecentWorkStrip />
          </motion.section>

          {/* ROW 5 — Spotlight: Trending + Catalogue health */}
          <motion.section variants={rowVariants}>
            <SpotlightRow />
          </motion.section>

          {/* ROW 6 — Upsell row (Full plan promotion) */}
          <motion.section variants={rowVariants}>
            <UpsellRow />
          </motion.section>

          {/* ROW 7 — Coach + Video Sage (60/40) */}
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
