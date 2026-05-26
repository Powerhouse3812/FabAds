import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * AiDashboardUpsellSide — neutral "what you unlock on Growth Pro" card.
 *
 * Operator-class grammar:
 *  - Compact card, neutral surface
 *  - Eyebrow: "GROWTH PRO · UNLOCKS"
 *  - 4-row factual checklist of modules added on Growth Pro
 *  - No fabricated time-savings stats, no unsourced ROI claims
 *  - Single primary CTA: "See Growth Pro"
 *  - Dismiss X reveals on hover · localStorage persistence
 *
 * Gating: AI plan only. Growth users hide this entirely.
 */

const STORAGE_KEY = "genie6:dashboard:upsell-side-dismissed";

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
      // Silent fail.
    }
    setDismissed(true);
  }, []);

  return [dismissed, dismiss];
}

const UNLOCKS: { label: string; sub: string }[] = [
  {
    label: "Launch",
    sub: "One-click campaign deploy to Meta + Google.",
  },
  {
    label: "Reports",
    sub: "Hierarchical drill-down: account → campaign → ad set → ad.",
  },
  {
    label: "Automation",
    sub: "Rule-based pause, boost, and scale workflows.",
  },
  {
    label: "Industry Insights",
    sub: "Vertical benchmarks and competitor drill-down.",
  },
];

export function AiDashboardUpsellSide() {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [dismissed, dismiss] = useDismissed();

  if (plan !== "ai" || dismissed) return null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-border/60 bg-card",
        "transition-[border-color] duration-200 hover:border-border",
      )}
    >
      {/* Dismiss X */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss upsell card"
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

      <div className="flex flex-col gap-3 px-5 py-4">
        {/* Eyebrow + heading */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
            Growth Pro · Unlocks
          </span>
          <h3 className="mt-1 text-[14px] font-semibold leading-snug text-foreground">
            Four modules added on Growth Pro
          </h3>
        </div>

        {/* Neutral factual checklist — no time-savings claims. */}
        <ul className="space-y-2">
          {UNLOCKS.map((row) => (
            <li key={row.label} className="flex items-start gap-2">
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium leading-snug text-foreground">
                  {row.label}
                </p>
                <p className="text-[11.5px] leading-snug text-muted-foreground">
                  {row.sub}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Single primary CTA */}
        <div className="pt-1">
          <Button
            size="sm"
            className="w-full justify-center gap-1.5"
            onClick={() => navigate("/plans-v2?tier=growth")}
          >
            See Growth Pro
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
