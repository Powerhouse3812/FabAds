import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { brands } from "@/mocks/shared/brands";
import { HeroTopPerformer } from "./HeroTopPerformer";
import { QuickStatsColumn } from "./QuickStatsColumn";
import { InsightsTrendingTile } from "./InsightsTrendingTile";
import { VideoSageRecentTile } from "./VideoSageRecentTile";
import { CatalogueHealthTile } from "./CatalogueHealthTile";
import { AiSuggestionsCoach } from "./AiSuggestionsCoach";
import { ProfileCompletionStrip } from "./ProfileCompletionStrip";
import { CrossModeActivityStrip } from "./CrossModeActivityStrip";
import { ZeroStateSetupTakeover } from "./ZeroStateSetupTakeover";

/**
 * AI-plan Dashboard — umbrella above Genie 6 Home.
 *
 * Scoping decision (Maalik, locked):
 *   Option 2 + 3 — Same dashboard chassis as Growth plan (header / row
 *   grid / refresh control) but tile selection is AI-plan-aware. Pulls
 *   from Genie + Industry Insights + Video Sage + Catalogue + new
 *   AI suggestions coach + profile-completion gamification. Genie 6.0
 *   Home stays focused only on creative generation.
 *
 * Layout:
 *   Row 0  Header (greet + refresh)
 *   Row 1  Hero (60%) Top Performer + QuickStats column (40%)
 *   Row 2  Industry Insights + Video Sage  (2-up)
 *   Row 3  Catalogue Health + AI Suggestions Coach  (2-up)
 *   Row 4  Profile Completion strip (auto-hides ≥90% done)
 *   Row 5  Cross-mode Activity strip (horizontal scroll)
 *
 * Zero-state takeover (when activation threshold not met) replaces
 * everything below Row 0 with a 3-step setup card. Activation =
 *   - ≥1 brand has voice + colors + usps fully filled
 *   - ≥3 competitors tracked on the primary brand
 *   - ≥1 generation completed (currently hard-coded false; real
 *     wiring lands when there's a global generations counter)
 * Escape hatch: "Skip setup" → state flips, populated dashboard
 * renders with 0-state tile copy. URL preserves via ?setup=skip so
 * hard refresh respects the user's choice.
 */
export function AiPlanDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  const rawName = user?.email?.split("@")[0] || "User";
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const userSkippedSetup = searchParams.get("setup") === "skip";

  /* ── Activation threshold ─────────────────────────────────
        Treats a session as "new" until the user has done the
        minimum work to give the populated dashboard real signal. */
  const isNewUser = useMemo(() => {
    if (userSkippedSetup) return false;
    const first = brands[0];
    if (!first) return true;
    const brandReady =
      first.voice.length > 20 &&
      first.colors.length >= 2 &&
      first.usps.length >= 2;
    const competitorsReady = first.competitors.length >= 3;
    // Step 3 (first-gen) — no live counter; treat as not-done for now.
    // Bumping `?newuser=true` in URL forces the takeover for demos.
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

  return (
    <div className="space-y-4 pb-6">
      {/* ── Row 0 — Header ─────────────────────────────────── */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isNewUser
              ? "Three quick steps before you start generating."
              : "Your AI ad-creative command center."}
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

      {/* ── Zero-state takeover ──────────────────────────────── */}
      {isNewUser ? (
        <ZeroStateSetupTakeover onSkip={handleSkipSetup} />
      ) : (
        <div key={refreshKey} className="space-y-3">
          {/* ── Row 1 — Hero + QuickStats (60/40) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start">
            <div className="lg:col-span-3">
              <HeroTopPerformer />
            </div>
            <div className="lg:col-span-2">
              <QuickStatsColumn />
            </div>
          </div>

          {/* ── Row 2 — Insights + Video Sage ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            <InsightsTrendingTile />
            <VideoSageRecentTile />
          </div>

          {/* ── Row 3 — Catalogue Health + AI Suggestions Coach ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            <CatalogueHealthTile />
            <AiSuggestionsCoach />
          </div>

          {/* ── Row 4 — Profile Completion (auto-hides) ── */}
          <ProfileCompletionStrip />

          {/* ── Row 5 — Activity strip ── */}
          <CrossModeActivityStrip />
        </div>
      )}
    </div>
  );
}
