import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { brands } from "@/mocks/shared/brands";
import { DashboardVariantToggle } from "../DashboardVariantToggle";

// V2-specific (this folder)
import { CommandPaletteButton } from "./CommandPaletteButton";
import { MicroAnalyticsCard } from "./MicroAnalyticsCard";
import { TopPerformerStrip } from "./TopPerformerStrip";
import { SignalsAndCoachList } from "./SignalsAndCoachList";

// Reused from V1 — already compact, fit the V2 density target
import { NowStatusStrip } from "../NowStatusStrip";
import { ModeLauncherBar } from "../ModeLauncherBar";
import { UpsellRow } from "../UpsellRow";
import { AiDashboardUpsellHero } from "../AiDashboardUpsellHero";
import { AiDashboardUpsellSide } from "../AiDashboardUpsellSide";
import { ZeroStateSetupTakeover } from "../ZeroStateSetupTakeover";

/**
 * AI-plan Dashboard — V2 "Operator HUD" (iter 2).
 *
 * Maalik's iter-1 V2 critique (verbatim):
 *   "too much big cards, and too much space wastage. No UX skills used.
 *    UI is very vague and beginner and generic."
 *
 * The fix wasn't to compact the big hero cards — it was to DELETE them.
 * Each old V2 component was designed as a focal point. Six focal points
 * on one page = no rhythm, just space-eaters.
 *
 * Operator-class references baked in (UXPin's "essential at-a-glance" +
 * UXStudio's "single-screen, hierarchical chunking"):
 *   - Linear's status bar + issue rows
 *   - Plausible Analytics dense single-screen
 *   - Vercel deployment-row density
 *   - Sublime / Raycast command palette result rows
 *
 * Cuts from V2 iter 1 (all deleted):
 *   - TopPerformerHero (340px hero card) → TopPerformerStrip (88px row)
 *   - SignalTile (340px market signal hero) → folded into SignalsAndCoachList
 *   - StatusGrid 2×2 (160px) → reused V1's NowStatusStrip (50px chips)
 *   - CompactUpsell vertical 3-stack (480px) → reused V1's horizontal UpsellRow
 *
 * Composition (4 rows, ~660px above-the-fold target on 1080p):
 *
 *   ROW 0  Header              (~44px)  greeting + ⌘K palette + V1/V2 + Refresh
 *   ROW 1  Status chips        (~50px)  reused NowStatusStrip
 *   ROW 2  Bento body          (~240px) 12-col:
 *            LEFT col-span-5 ─ MicroAnalyticsCard + TopPerformerStrip stacked
 *            RIGHT col-span-7 ─ SignalsAndCoachList (fills full row height)
 *   ROW 3  ModeLauncherBar     (~120px) reused
 *   ROW 4  UpsellRow           (~160px) reused
 *
 * Differentiators from V1 that REMAIN:
 *   - ⌘K CommandPaletteButton in header (Linear/Raycast pattern)
 *   - SignalsAndCoachList — flat-list unified signals+coach (no separate
 *     SpotlightRow + Coach tiles)
 *   - TopPerformerStrip — single horizontal row, not a hero card
 *   - MicroAnalyticsCard — slim analytics in a narrow column slot
 *
 * Zero-state takeover (unchanged) when activation threshold not met.
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
      transition: { staggerChildren: 0.05, delayChildren: 0.04 },
    },
  } as const;

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
    },
  } as const;

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  return (
    <div className="pb-4">
      {/* ── ROW 0 — Slim operator header ── */}
      <header className="flex items-center justify-between gap-3 flex-wrap mb-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[18px] font-bold tracking-tight text-foreground leading-none">
            {isNewUser ? `Welcome, ${firstName}` : `Hi, ${firstName}`}
          </h1>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {todayLabel}
          </span>
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
          className="space-y-2.5"
        >
          {/* ── ROW 0.5 — Dual-lane upsell hero. AI plan only, closable. ── */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellHero />
          </motion.section>

          {/* ── ROW 1 — Status chips ── */}
          <motion.section variants={rowVariants}>
            <NowStatusStrip />
          </motion.section>

          {/* ── ROW 2 — Bento body
                LEFT (col 1-5)  MicroAnalyticsCard + TopPerformerStrip stacked
                RIGHT (col 6-12) SignalsAndCoachList — flat list, fills row ── */}
          <motion.section
            variants={rowVariants}
            className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch"
          >
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              <MicroAnalyticsCard />
              <TopPerformerStrip />
            </div>
            <div className="lg:col-span-7">
              <SignalsAndCoachList />
            </div>
          </motion.section>

          {/* ── ROW 3 — Mode launcher (reused, already compact) ── */}
          <motion.section variants={rowVariants}>
            <ModeLauncherBar />
          </motion.section>

          {/* ── ROW 3.5 — ROI-led side card (closable, AI only). Quieter
                companion to the hero — different angle (ROI stat vs social
                proof) so the two units don't read as duplicates. ── */}
          <motion.section variants={rowVariants}>
            <AiDashboardUpsellSide />
          </motion.section>

          {/* ── ROW 4 — Upsell (reused horizontal, already tight) ── */}
          <motion.section variants={rowVariants}>
            <UpsellRow />
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
