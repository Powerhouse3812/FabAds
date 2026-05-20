import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * AiDashboardUpsellHero — full-width social-proof banner at the TOP of
 * the AI-plan dashboard, dual-lane upsell.
 *
 * Design grammar (Maalik A-12.173 — "industry, professional, sales touch"):
 *  - Full-width card, ~92px tall, lime-tinted left rail + neutral surface
 *  - Eyebrow (Geist Mono caps) "Outgrow your AI plan"
 *  - Headline (Geist Sans 18px semibold) — one line
 *  - Social proof: "12,000+ agencies" + 5 monogram circles (no third-party
 *    logos — sidesteps licensing + visual noise; reads as credibility)
 *  - Dual CTA: Primary lime "Upgrade to AI Team →" + ghost "Talk to Sales"
 *  - Dismiss X top-right, reveals on hover · localStorage persistence
 *  - Cross-tab sync via storage event
 *
 * Gating: only renders for AI-plan users. Growth users hide this entirely.
 *
 * Reference points: Linear pricing banner, Mercury feature-launch hero.
 * NOT: AdCreative.ai purple/pink gradient banners.
 */

const STORAGE_KEY = "genie6:dashboard:upsell-hero-dismissed";

function useDismissed(): [boolean, () => void] {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue === "1") {
        setDismissed(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Silent fail — in-memory dismiss still applies for the session.
    }
    setDismissed(true);
  }, []);

  return [dismissed, dismiss];
}

const SOCIAL_MONOGRAMS = [
  { initials: "M", label: "Mamaearth" },
  { initials: "N", label: "Noise" },
  { initials: "b", label: "boAt" },
  { initials: "S", label: "Sleepyhead" },
  { initials: "MB", label: "Mensa Brands" },
];

export function AiDashboardUpsellHero() {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [dismissed, dismiss] = useDismissed();

  // Gate to AI plan only — Growth users are already on the upper tier,
  // showing them an upgrade banner would read as a bug.
  if (plan !== "ai" || dismissed) return null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-primary/25 bg-foreground/[0.03]",
        "transition-[border-color,background-color] duration-200",
        "hover:border-primary/40",
      )}
    >
      {/* Lime accent rail — left edge identity, signals "growth path" without
          flooding the card. 3px solid bar; never thicker (don't look like a
          status banner). */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] bg-primary"
      />

      {/* Dismiss X — opacity-0 at rest, reveals on hover. Sits in tab order
          so keyboard users can dismiss without the mouse. */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss upgrade banner"
        title="Dismiss"
        className={cn(
          "absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full",
          "text-foreground/45 opacity-0 transition-opacity duration-150",
          "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
        )}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      <div className="flex flex-col gap-3 px-5 py-3.5 pl-6 md:flex-row md:items-center md:gap-5">
        {/* Left column — eyebrow + headline + social proof */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
              Outgrow your AI plan
            </span>
          </div>
          <h2 className="mt-1 text-[16px] font-semibold leading-snug text-foreground">
            More seats, or the full Growth stack — pick the lane that fits.
          </h2>
          {/* Social proof — agency count + monogram circles. No third-party
              logos (licensing-clean) but reads as trust-anchored credibility. */}
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/55">
              Trusted by 12,000+ agencies
            </span>
            <span className="h-3 w-px bg-foreground/[0.10]" aria-hidden />
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

        {/* Right column — dual CTA. Primary = same-lane upgrade, secondary =
            cross-lane (Growth). Parallel, not a ladder. */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/plans-v2?tier=ai&view=direct")}
          >
            Upgrade to AI Team
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-foreground/65 hover:text-foreground"
            onClick={() => navigate("/plans-v2?tier=growth&view=trial")}
          >
            Talk to Sales (Growth)
          </Button>
        </div>
      </div>
    </div>
  );
}
