import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { brands } from "@/mocks/shared/brands";
import { DashboardVariantToggle } from "../DashboardVariantToggle";

// V2-specific components (this folder)
import { TopPerformerHero } from "./TopPerformerHero";
import { StatusGrid } from "./StatusGrid";
import { SignalTile } from "./SignalTile";
import { CommandPaletteButton } from "./CommandPaletteButton";
import { CompactUpsell } from "./CompactUpsell";

// Reused from V1 (still appropriate for V2's bento)
import { AnalyticsHero } from "../AnalyticsHero";
import { ModeLauncherBar } from "../ModeLauncherBar";
import { RecentWorkStrip } from "../RecentWorkStrip";
import { AiSuggestionsCoach } from "../AiSuggestionsCoach";
import { ZeroStateSetupTakeover } from "../ZeroStateSetupTakeover";

/**
 * AI-plan Dashboard — V2 ("Operator Briefing").
 *
 * Design judgment-call (made without re-asking, per Maalik):
 *   V1 = vertical linear stack, analytics-led, Vercel-style. Works but
 *   feels generic.
 *   V2 = bento grid, emotion-led hero, operator-class density. Influenced
 *   by UXPin/UXStudio dashboard principles (essential at-a-glance,
 *   single-screen ambition, hierarchical chunking) + bento-grid trend
 *   (Apple keynotes, Arc browser) + operator tools (Linear, Raycast,
 *   Plausible).
 *
 * Differentiators from V1:
 *   1. Bento grid (variable cell widths) instead of linear rows
 *   2. TopPerformerHero as the emotional anchor (Spotify Wrapped /
 *      Suno top-track pattern) instead of analytics-led
 *   3. 2×2 StatusGrid replaces V1's horizontal chip strip — denser
 *   4. Single SignalTile (one market signal hero) replaces V1's
 *      SpotlightRow with 4 competitor cards
 *   5. CommandPaletteButton in header (⌘K affordance, Linear/Raycast
 *      pattern) — operator-class shortcut surface
 *   6. CompactUpsell as a vertical 3-stack (right column) instead of
 *      V1's horizontal 3-up row
 *
 * Composition (all rows are multi-column bento, none are linear stack):
 *
 *   ROW 0  Header  (greeting · ⌘K palette button · refresh)
 *   ROW 1  Bento hero — 7/5 split
 *     LEFT  (7/12)  TopPerformerHero
 *     RIGHT (5/12)  StatusGrid + SignalTile stacked
 *   ROW 2  Analytics + Upsell — 8/4 split
 *     LEFT  (8/12)  AnalyticsHero  (V1's, reused)
 *     RIGHT (4/12)  CompactUpsell  (V2's vertical 3-stack)
 *   ROW 3  Action band — 8/4 split
 *     LEFT  (8/12)  ModeLauncherBar
 *     RIGHT (4/12)  AiSuggestionsCoach
 *   ROW 4  Recent work strip (full-width)
 *
 * Zero-state takeover (unchanged from V1) when activation threshold
 * not met.
 */
export function AiPlanDashboardV2() {
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
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
    },
  } as const;

  /** Today's date in operator-class format: "Wed · May 15" */
  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  return (
    <div className="pb-6">
      {/* ── ROW 0 — Operator briefing header ──
            Different from V1: a flat horizontal bar with greeting
            on the left, command-palette search button in the middle,
            and refresh on the right. The palette button is the
            biggest UX difference vs V1 — operator-class affordance. */}
      <header className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-0.5">
            {todayLabel} · V2 Preview
          </p>
          <h1 className="text-[20px] font-bold tracking-tight text-foreground leading-none">
            {isNewUser ? `Welcome, ${firstName}` : `Hi, ${firstName}`}
          </h1>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <CommandPaletteButton />
          <DashboardVariantToggle active="v2" />
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
          {/* ── ROW 1 — Bento hero (7/5 split) ──
                LEFT  TopPerformerHero — emotional anchor
                RIGHT StatusGrid + SignalTile stacked

                The two children's natural heights are different:
                TopPerformerHero ~340px, StatusGrid ~150px, SignalTile
                ~340px. The right column's vertical flex stack lets each
                breathe at its natural height. CSS grid items-start
                prevents left column from stretching to match right
                column total. */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start"
          >
            <div className="lg:col-span-7">
              <TopPerformerHero />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              <StatusGrid />
              <SignalTile />
            </div>
          </motion.section>

          {/* ── ROW 2 — Analytics (left) + Upsell stack (right) ── */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start"
          >
            <div className="lg:col-span-8">
              <AnalyticsHero />
            </div>
            <div className="lg:col-span-4">
              <CompactUpsell />
            </div>
          </motion.section>

          {/* ── ROW 3 — Mode launcher (left) + Coach (right) ── */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start"
          >
            <div className="lg:col-span-8">
              <ModeLauncherBar />
            </div>
            <div className="lg:col-span-4">
              <AiSuggestionsCoach />
            </div>
          </motion.section>

          {/* ── ROW 4 — Recent work (full-width) ── */}
          <motion.section variants={rowVariants}>
            <RecentWorkStrip />
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
