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
 * LockedFeatureSellModal — rich sell modal shown when an AI-plan user
 * clicks a Growth-only nav item in the parent rail. Replaces the tiny
 * 280px UpsellPopover (which was used as both hover-tooltip and click
 * destination — the popover scale was too small for a sell pitch).
 *
 * Design grammar (Maalik A-12.176 — "industry, professional, sales touch"):
 *   - shadcn Dialog, ~560px wide, rounded-2xl
 *   - Header: lime-tinted lock disc + Geist Mono caps eyebrow + close X
 *   - Title: Geist Sans 20px semibold "Unlock [Feature]"
 *   - Preview region: 4:3 aspect placeholder with feature glyph centered.
 *     Real screenshots can be wired later via previewIllustration prop.
 *   - 3 ROI bullets with lime check icons (Geist Sans 13px)
 *   - Dual CTA row: Primary lime "Start 14-day Growth trial" + Ghost "Talk to sales"
 *   - Social proof footer: tiny caps "TRUSTED BY 12,000+ AGENCIES" + 5
 *     monogram circles (Mamaearth · Noise · boAt · Sleepyhead · Mensa
 *     Brands) — licensing-clean, no third-party logos
 *   - Bottom "Stay on AI plan ←" text link — closes modal, no nav
 *
 * Driven by URL state (`?upsell=<moduleKey>` set by ParentNavigationRail).
 * Mount once at the rail level; the modal reads the URL param and shows
 * the matching preset.
 */

const SOCIAL_MONOGRAMS = [
  { initials: "M", label: "Mamaearth" },
  { initials: "N", label: "Noise" },
  { initials: "b", label: "boAt" },
  { initials: "S", label: "Sleepyhead" },
  { initials: "MB", label: "Mensa Brands" },
];

export interface FeaturePreset {
  /** Eyebrow above the title — Geist Mono caps. */
  eyebrow: string;
  /** Feature display name — goes in "Unlock X". */
  name: string;
  /** 3 ROI bullets. More than 3 dilutes the pitch — modal forces brevity. */
  bullets: string[];
  /** Optional inline illustration that replaces the default lock-disc preview. */
  previewIllustration?: ReactNode;
  /** Lucide icon component for the preview placeholder. */
  PreviewIcon?: React.ComponentType<{ className?: string }>;
}

/**
 * Module-key → preset map. Keyed on the ModuleDef.key values used in
 * `components/sidebar/modules.ts`. Each preset captures the feature's
 * sales-deck framing in 3 bullets + an eyebrow.
 */
export const FEATURE_PRESETS: Record<string, FeaturePreset> = {
  reports: {
    eyebrow: "Multi-account reporting",
    name: "Reports",
    bullets: [
      "Drill down from Account → Campaign → Ad Set → Ad in one view.",
      "Up to 15 ad accounts in one dashboard with custom KPI columns.",
      "Creative reporting across Facebook, NB, and TikTok.",
    ],
    PreviewIcon: BarChart3,
  },
  launch: {
    eyebrow: "Managed launches",
    name: "Launch",
    bullets: [
      "Push 50+ ads at once with proven Round Robin distribution.",
      "Per-account naming, dedupe, warm-up windows baked in.",
      "Relaunch any winner from history with one click.",
    ],
    PreviewIcon: Rocket,
  },
  automation: {
    eyebrow: "Ad-ops automation",
    name: "Automation",
    bullets: [
      "Rules-based spend, refresh, and rotation across accounts.",
      "Auto-pause on fatigue, dilution, or rejection thresholds.",
      "Audit trail of every automated action for compliance.",
    ],
    PreviewIcon: Workflow,
  },
  rrm: {
    eyebrow: "Recovery & retention",
    name: "Recovery & Retention Manager",
    bullets: [
      "Recover 1:1:250 retention patterns automatically.",
      "Auto-detect ad fatigue and spend dilution per account.",
      "Multi-account health scores with rollback triggers.",
    ],
    PreviewIcon: Rocket,
  },
  insights: {
    eyebrow: "Industry Insights Pro",
    name: "Industry Insights Pro",
    bullets: [
      "9-table competitor schema + similar-categories intelligence.",
      "Track unlimited brands + pages across Facebook, TikTok, Google.",
      "Save winning competitor ads straight into your boards.",
    ],
    PreviewIcon: Telescope,
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
    navigate("/plans-v2?tier=growth&view=trial");
  };

  const handleTalkSales = () => {
    onClose();
    navigate("/plans-v2?tier=growth&view=sales");
  };

  if (!preset) return null;

  const PreviewIcon = preset.PreviewIcon ?? Lock;

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
              Unlock {preset.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {preset.eyebrow} — upgrade to Growth to use this feature.
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

        {/* ROI bullets */}
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

        {/* Dual CTA row */}
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
          <Button
            size="default"
            variant="ghost"
            className="gap-1.5 text-foreground/70 hover:text-foreground"
            onClick={handleTalkSales}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Talk to sales
          </Button>
        </div>

        {/* Social proof footer */}
        <div className="mt-5 border-t border-foreground/[0.06] bg-foreground/[0.02] px-6 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
              Trusted by 12,000+ agencies
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

        {/* Stay on AI plan — quiet exit. Closes the modal without nav. */}
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
