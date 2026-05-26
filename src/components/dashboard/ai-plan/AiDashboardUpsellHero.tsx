import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * AiDashboardUpsellHero — dual-lane plan-limits banner at the TOP of the
 * AI-plan dashboard.
 *
 * Operator-class grammar:
 *  - Two lanes side-by-side, each with ONE primary CTA
 *  - Lane A: AI Team plan (same-tier upgrade)
 *  - Lane B: Growth Pro (cross-tier upgrade)
 *  - No fabricated social proof (no "12,000+ agencies"), no logos
 *  - Specific feature copy, not marketing slogans
 *  - Dismiss X reveals on hover · localStorage persistence · cross-tab sync
 *
 * Gating: AI-plan users only. Growth users hide this entirely.
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

interface Lane {
  eyebrow: string;
  title: string;
  bullets: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

const LANES: Lane[] = [
  {
    eyebrow: "AI TEAM",
    title: "More seats, same AI surface",
    bullets: [
      "5 seats · 200 generations/month",
      "Genie API access",
      "Shared brand kits",
    ],
    primaryLabel: "See AI Team plan",
    primaryHref: "/plans-v2?tier=ai&view=direct",
    secondaryLabel: "Compare AI Team vs AI Solo",
    secondaryHref: "/plans-v2?tier=ai&view=compare",
  },
  {
    eyebrow: "GROWTH PRO",
    title: "Full launch + reporting stack",
    bullets: [
      "One-click launch to Meta + Google",
      "Hierarchical reports drill-down",
      "Rule-based automation",
    ],
    primaryLabel: "See Growth Pro",
    primaryHref: "/plans-v2?tier=growth&view=trial",
    secondaryLabel: "Or schedule a Growth Pro walkthrough",
    secondaryHref: "/plans-v2?tier=growth&view=walkthrough",
  },
];

export function AiDashboardUpsellHero() {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [dismissed, dismiss] = useDismissed();

  if (plan !== "ai" || dismissed) return null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-border/60 bg-card",
        "transition-[border-color] duration-200",
      )}
    >
      {/* Dismiss X — opacity-0 at rest, reveals on hover or keyboard focus. */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss upgrade banner"
        title="Dismiss"
        className={cn(
          "absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full",
          "text-foreground/45 opacity-0 transition-opacity duration-150",
          "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
        )}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      <div className="px-5 py-4">
        {/* Header row — eyebrow + qualitative positioning (no fabricated count). */}
        <div className="mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
            Plan limits
          </span>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Built for performance agencies operating at scale.
          </p>
        </div>

        {/* Dual lanes — each gets ONE primary CTA + ONE text-link footer. */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {LANES.map((lane) => (
            <div
              key={lane.eyebrow}
              className={cn(
                "flex flex-col rounded-xl border border-border/60 bg-background/40 p-4",
                "transition-[border-color] duration-200 hover:border-border",
              )}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                {lane.eyebrow}
              </span>
              <h3 className="mt-1 text-[14px] font-semibold leading-snug text-foreground">
                {lane.title}
              </h3>
              <ul className="mt-2 space-y-1">
                {lane.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-foreground/40"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-1.5 pt-3">
                <Button
                  size="sm"
                  className="w-full justify-center gap-1.5"
                  onClick={() => navigate(lane.primaryHref)}
                >
                  {lane.primaryLabel}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                </Button>
                <button
                  type="button"
                  onClick={() => navigate(lane.secondaryHref)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1 text-[11.5px] text-foreground/55",
                    "transition-colors hover:text-foreground/80",
                    "focus-visible:outline-none focus-visible:underline",
                  )}
                >
                  {lane.secondaryLabel}
                  <ArrowRight className="h-3 w-3" strokeWidth={2.25} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
