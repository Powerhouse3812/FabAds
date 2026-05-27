import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Check,
  ArrowRight,
  MessageCircle,
  BarChart3,
  Rocket,
  Workflow,
  Telescope,
  Users,
  Plug,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * LockedFeatureSellModal — the canonical paywall modal for the entire
 * FabAds app. Shown when an AI-plan user clicks any Growth-only surface
 * (nav rail items, UserMenu Team / Integration entries, etc.).
 *
 * Single source of truth: every paywall in the product reads its copy
 * from `FEATURE_PRESETS` below. The modal is opened by passing a
 * `presetKey` — when the key resolves to a preset, the modal renders
 * the matching copy. Callers route to this component via a `?upsell=`
 * or `?paywall=` URL param read at the relevant rail.
 *
 * Copy doctrine (Maalik — operator-class framing):
 *   - Loss-aversion: frame the *absence* of the feature, not the
 *     feature itself. "Reports without account-level totals is a
 *     spreadsheet you screenshot."
 *   - Anchoring with Maalik-authorized facts only:
 *       "12,000+ agencies", "4 hrs/week saved", "50+ ads at once",
 *       "1:1:250 retention", "up to 15 ad accounts".
 *   - Tier name is always "Growth" — never PRO, Premium, Full plan.
 *   - Trial length is always 14 days, everywhere.
 *   - English only. No Hinglish, no sales clichés (Elevate / Unleash /
 *     Supercharge / Seamlessly / Next-gen / Empower).
 *
 * Chassis (560px shell — do not widen):
 *   - shadcn Dialog, ~560px, rounded-2xl
 *   - Header: lime-tinted Lock disc + Geist Mono caps eyebrow + close X
 *   - Headline: confronting one-liner, Geist Sans 20px semibold
 *   - 3 sub-bullets — specific capabilities currently missing, as facts
 *   - Primary CTA: "Start 14-day Growth trial"
 *   - Optional secondary CTA: "Talk to sales" (Enterprise-adjacent only)
 *   - Trust strap: "12,000+ agencies on Growth"
 *   - Quiet exit: "Stay on AI plan ←"
 */

const SOCIAL_MONOGRAMS = [
  { initials: "M", label: "Mamaearth" },
  { initials: "N", label: "Noise" },
  { initials: "b", label: "boAt" },
  { initials: "S", label: "Sleepyhead" },
  { initials: "MB", label: "Mensa Brands" },
];

export interface FeaturePreset {
  /** Eyebrow above the title — Geist Mono caps. 2-3 words max. */
  eyebrow: string;
  /** Feature display name — used for the sr-only description + aria. */
  name: string;
  /**
   * The confronting one-liner. Frame the absence of the feature, not
   * the feature itself. Replaces the old "Unlock {name}" title.
   */
  headline: string;
  /**
   * 3 sub-bullets — each a specific capability the user is currently
   * missing, written as a fact (not a promise). Use numbers. More than
   * 3 dilutes the pitch; the modal enforces a slice(0, 3).
   */
  bullets: string[];
  /**
   * Show the "Talk to sales" secondary CTA. Reserved for
   * Enterprise-adjacent presets where a sales conversation actually
   * makes sense (multi-account integration, large-team rollouts).
   * Defaults to false — most presets are pure self-serve trial.
   */
  showTalkSales?: boolean;
  /** Optional inline illustration that replaces the default glyph preview. */
  previewIllustration?: ReactNode;
  /** Lucide icon component for the preview placeholder. */
  PreviewIcon?: React.ComponentType<{ className?: string }>;
}

/**
 * Module-key → preset map. Keyed on the ModuleDef.key values used in
 * the nav rail + UserMenu gates. Every paywall in the product resolves
 * its copy through this map. Adding a new gated surface means adding
 * a key here — not duplicating the modal anywhere else.
 */
export const FEATURE_PRESETS: Record<string, FeaturePreset> = {
  reports: {
    eyebrow: "REPORTS",
    name: "Reports",
    headline:
      "Reports without account-level totals is a spreadsheet you screenshot.",
    bullets: [
      "Roll up to 15 ad accounts into one dashboard with custom KPI columns.",
      "Drill from account → campaign → ad set → ad without leaving the row.",
      "Compare ROAS across Facebook, TikTok, and NewsBreak in a single view.",
    ],
    PreviewIcon: BarChart3,
  },
  launch: {
    eyebrow: "LAUNCH",
    name: "Launch",
    headline:
      "Push 50 ads at once with Round Robin, or paste copy 50 times. You pick.",
    bullets: [
      "Launch 50+ ads in one motion across up to 15 ad accounts.",
      "Per-account naming, dedupe, and warm-up windows applied automatically.",
      "Relaunch any past winner from history with one click.",
    ],
    PreviewIcon: Rocket,
  },
  automation: {
    eyebrow: "AUTOMATION",
    name: "Automation",
    headline:
      "Auto-rotate winners and losers nightly, or keep watching dashboards yourself.",
    bullets: [
      "Auto-pause on fatigue, dilution, or rejection thresholds across every account.",
      "Rules-based spend, refresh, and rotation that save the team 4 hrs/week.",
      "Audit trail of every automated action for compliance and rollback.",
    ],
    PreviewIcon: Workflow,
  },
  rrm: {
    eyebrow: "RRM",
    name: "Recovery & Retention Manager",
    headline:
      "Without RRM, the 1:1:250 retention pattern is a slide deck — not a workflow.",
    bullets: [
      "Detect ad fatigue and spend dilution per account before ROAS breaks.",
      "Recover the 1:1:250 retention curve automatically across 15 accounts.",
      "Multi-account health scores with rollback triggers wired in.",
    ],
    PreviewIcon: Rocket,
  },
  insights: {
    eyebrow: "INSIGHTS",
    name: "Industry Insights",
    headline:
      "AI plan shows you your ads. Growth shows you every competitor's ads too.",
    bullets: [
      "9 tables of competitor data + similar-categories intelligence per brand.",
      "Track unlimited brands and pages across Facebook, TikTok, and Google.",
      "Save winning competitor ads straight into your boards for reuse.",
    ],
    PreviewIcon: Telescope,
  },
  team: {
    eyebrow: "TEAM",
    name: "Team",
    headline:
      "Solo on AI plan. Growth lets 5 people share one workspace.",
    bullets: [
      "Invite teammates without losing brand context or campaign history.",
      "Role-based access on every ad account, down to the ad set.",
      "One billing seat for the whole team — no juggling logins.",
    ],
    PreviewIcon: Users,
  },
  integration: {
    eyebrow: "INTEGRATION",
    name: "Integrations",
    headline: "AI plan stops at one ad account. Growth doesn't.",
    bullets: [
      "Connect Meta, TikTok, and NewsBreak ad accounts in one workspace.",
      "Up to 15 ad accounts on Growth Starter, with unified billing.",
      "Unified spend, ROAS, and creative reporting across every account.",
    ],
    showTalkSales: true,
    PreviewIcon: Plug,
  },
};

export interface LockedFeatureSellModalProps {
  /** Module key to look up the preset. When null, the modal stays closed. */
  presetKey: string | null;
  /** Called when the user dismisses — X, Esc, backdrop, or "Stay on AI plan". */
  onClose: () => void;
}

export function LockedFeatureSellModal({
  presetKey,
  onClose,
}: LockedFeatureSellModalProps) {
  const navigate = useNavigate();
  const preset = presetKey ? FEATURE_PRESETS[presetKey] : null;
  const open = Boolean(preset);

  const handleStartTrial = () => {
    onClose();
    const qs = `?tier=growth&view=trial${presetKey ? `&featureKey=${encodeURIComponent(presetKey)}` : ""}`;
    navigate(`/plans-v2${qs}`);
  };

  const handleTalkSales = () => {
    onClose();
    const qs = `?tier=growth&view=sales${presetKey ? `&featureKey=${encodeURIComponent(presetKey)}` : ""}`;
    navigate(`/plans-v2${qs}`);
  };

  if (!preset) return null;

  const PreviewIcon = preset.PreviewIcon ?? Lock;
  const showTalkSales = preset.showTalkSales === true;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-[560px] gap-0 overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-foreground/[0.06] px-6 py-4">
          <span
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              "bg-primary/15 ring-1 ring-primary/25",
            )}
            aria-hidden
          >
            <Lock className="h-4 w-4 text-foreground" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
              {preset.eyebrow}
            </p>
            <DialogTitle className="mt-0.5 text-[20px] font-semibold leading-snug text-foreground">
              {preset.headline}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {preset.name} is a Growth-tier feature. Start a 14-day Growth trial to use it.
            </DialogDescription>
          </div>
        </div>

        {/* Preview region — placeholder with feature glyph. Wire real
            screenshots later via the FeaturePreset.previewIllustration
            prop. The placeholder reads as deliberate, not unfinished —
            soft gradient + centered glyph. */}
        <div className="px-6 pt-5">
          {preset.previewIllustration ?? (
            <div
              className={cn(
                "flex aspect-[3/1] w-full items-center justify-center",
                "rounded-xl bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.07]",
                "ring-1 ring-inset ring-foreground/[0.04]",
              )}
              aria-hidden
            >
              <PreviewIcon className="h-10 w-10 text-foreground/30" />
            </div>
          )}
        </div>

        {/* Sub-bullets — specific facts about what's missing */}
        <ul className="space-y-2.5 px-6 pt-5">
          {preset.bullets.slice(0, 3).map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  "bg-primary/15 text-primary",
                )}
                aria-hidden
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              <span className="text-[13px] leading-snug text-foreground/80">
                {b}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA row — primary trial always, secondary sales only for
            Enterprise-adjacent presets (integration today, more later). */}
        <div className="flex flex-col gap-2 px-6 pt-5 sm:flex-row sm:items-center">
          <Button
            size="default"
            className="gap-1.5 sm:flex-1"
            onClick={handleStartTrial}
          >
            <Rocket className="h-3.5 w-3.5" />
            Start 14-day Growth trial
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          {showTalkSales && (
            <Button
              size="default"
              variant="ghost"
              className="gap-1.5 text-foreground/70 hover:text-foreground"
              onClick={handleTalkSales}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Talk to sales
            </Button>
          )}
        </div>

        {/* Trust strap — Maalik-authorized claim, verbatim. */}
        <div className="mt-5 border-t border-foreground/[0.06] bg-foreground/[0.02] px-6 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
              12,000+ agencies on Growth
            </span>
            <div className="flex -space-x-1.5">
              {SOCIAL_MONOGRAMS.map((m) => (
                <span
                  key={m.initials}
                  title={m.label}
                  aria-label={m.label}
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full",
                    "bg-foreground/[0.06] ring-1 ring-background",
                    "font-mono text-[9px] font-semibold text-foreground/70",
                  )}
                >
                  {m.initials}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stay on AI plan — quiet exit. Closes the modal without nav.
            Arrow is rotate-180 so the glyph reads "←" in the rendered DOM. */}
        <div className="flex items-center justify-center border-t border-foreground/[0.06] px-6 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] text-foreground/45 underline-offset-2 transition-colors",
              "hover:text-foreground/70 hover:underline",
              "focus-visible:outline-none focus-visible:text-foreground focus-visible:underline",
            )}
          >
            <ArrowRight className="h-3 w-3 rotate-180" aria-hidden />
            Stay on AI plan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
