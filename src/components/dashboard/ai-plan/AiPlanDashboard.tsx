import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { brands } from "@/mocks/shared/brands";
import { MosaicHero } from "./MosaicHero";
import { ActionPod } from "./ActionPod";
import { LivePulseTicker } from "./LivePulseTicker";
import { SetupStepperBar } from "./SetupStepperBar";
import { SpotlightRow } from "./SpotlightRow";
import { CursorFollowGlow } from "./CursorFollowGlow";
import { ZeroStateSetupTakeover } from "./ZeroStateSetupTakeover";
import { AiSuggestionsCoach } from "./AiSuggestionsCoach";
import { VideoSageRecentTile } from "./VideoSageRecentTile";
import { NowStatusStrip } from "./NowStatusStrip";

/**
 * AI-plan Dashboard — redesigned (iter 2).
 *
 * Iter 1 was generic Stripe-style stat tiles — Maalik called it boring,
 * reading-heavy, "have to process before knowing what to do." This iter
 * inverts the priority: the user's WORK is the dashboard. Visual mosaic
 * leads. Action surfaces as motif, not copy.
 *
 * Composition (top → bottom, asymmetric throughout):
 *
 *   ROW 1   Hero  (70/30 split, ~520px)
 *     LEFT  MosaicHero        Pinterest masonry of recent generations
 *     RIGHT ActionPod         Credit gauge + dominant CTA + 2 micro-cards
 *     +     CursorFollowGlow  Lime spotlight that tracks the cursor
 *
 *   ROW 2   LivePulseTicker (~64px, full)
 *     Horizontal scrolling event ticker. Continuous loop, pulse-ring
 *     anchor, lime accent on most-recent. Pause on hover.
 *
 *   ROW 3   SetupStepperBar (~44px, full, auto-hides ≥75% done)
 *     Slim horizontal stepper. Current step pulses subtly.
 *
 *   ROW 4   SpotlightRow (60/40 split, ~360px)
 *     LEFT  Trending today     4 competitor ad cards as visual blocks
 *     RIGHT Catalogue health   3 radial donut indicators
 *
 * Zero-state takeover (when activation threshold not met) replaces
 * everything below Row 0 with the 3-step setup card. Same as before.
 *
 * Motion design:
 *   - Page-level stagger: each row reveals with 80ms cascade on mount
 *   - Within each row, tile-level stagger handled by the section itself
 *   - Hero gets cursor-follow lime glow (Awwwards touch)
 *   - All hover transitions use Fabfunnel spring physics (stiffness 100,
 *     damping 20) per the design-system spec
 */
export function AiPlanDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  const rawName = user?.email?.split("@")[0] || "User";
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const userSkippedSetup = searchParams.get("setup") === "skip";

  /* ── Activation threshold ─────────────────────────────────
        Same logic as iter 1. Treats a session as "new" until the user
        has done the minimum work to give the populated dashboard
        real signal. */
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

  /* ── Stagger variants for page-level row reveal ── */
  const containerVariants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
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

  return (
    <div className="pb-6">
      {/* ── Header — utility, not marketing copy.
            Critique iter (ui-ux-pro-max P0): the previous "X's canvas /
            Where your work, signals, and next moves live" hid the
            operational signal behind poetry. Operators want their name
            + a one-line tally of what's going on. The NowStatusStrip
            does the heavy lifting underneath. ── */}
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

      {/* ── Zero-state path ─────────────────────────────────────── */}
      {isNewUser ? (
        <ZeroStateSetupTakeover onSkip={handleSkipSetup} />
      ) : (
        <motion.div
          key={refreshKey}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* ── ROW 0: Now status strip — the operational anchor.
                Added in iter 3 (ui-ux-pro-max P0). Glance-readable chips
                for credits / new-since-last-visit / needs-attention so
                the user knows "am I OK today, what needs me?" in <1s. ── */}
          <motion.section variants={rowVariants}>
            <NowStatusStrip />
          </motion.section>

          {/* ── ROW 1: Hero — Mosaic (70%) + ActionPod (30%) ── */}
          <motion.section
            variants={rowVariants}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Cursor-follow lime spotlight backdrop. Pure polish, pointer-events:none. */}
            <CursorFollowGlow size={520} color="rgba(195,235,66,0.08)" />

            <div className="relative grid grid-cols-1 lg:grid-cols-10 gap-4 items-start">
              <div className="lg:col-span-7">
                <MosaicHero />
              </div>
              <div className="lg:col-span-3">
                <ActionPod />
              </div>
            </div>
          </motion.section>

          {/* ── ROW 2: Live ticker ── */}
          <motion.section variants={rowVariants}>
            <LivePulseTicker />
          </motion.section>

          {/* ── ROW 3: Setup stepper (only renders when applicable) ── */}
          <motion.section variants={rowVariants}>
            <SetupStepperBar />
          </motion.section>

          {/* ── ROW 4: Spotlight — Trending + Health ── */}
          <motion.section variants={rowVariants}>
            <SpotlightRow />
          </motion.section>

          {/* ── ROW 5: Coach + Video Sage (60/40) ──
              These two tiles are holdovers from iter 1. Coach mode was
              an explicit Maalik pick; Video Sage rounds out the "what
              you've researched recently" axis. Both still read text-led
              — flagged for a visual redesign in the next iter. */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start"
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
