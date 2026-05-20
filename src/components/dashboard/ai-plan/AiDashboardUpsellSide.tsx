import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * AiDashboardUpsellSide — ROI-led upsell card placed mid-dashboard.
 *
 * Sits between the Spotlight row and the existing UpsellRow on the AI-plan
 * dashboard. Where the hero leads with social proof + dual CTA, this card
 * leads with a single quantified ROI claim + one Growth CTA. The two units
 * work in concert — same banner family, different angle.
 *
 * Design grammar:
 *  - Compact (~88px tall), neutral surface with quiet lime accents
 *  - Clock icon + tiny eyebrow "ROI · AGENCY CASE"
 *  - One big stat ("4 hrs/week") + one-line benefit
 *  - Single lime CTA chip "See Growth Pro →"
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

export function AiDashboardUpsellSide() {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [dismissed, dismiss] = useDismissed();

  if (plan !== "ai" || dismissed) return null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-foreground/[0.08] bg-foreground/[0.03]",
        "transition-[border-color,background-color,transform] duration-200",
        "hover:border-primary/30 hover:bg-foreground/[0.045]",
      )}
    >
      {/* Dismiss X */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss upsell card"
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

      <div className="flex flex-col gap-3 px-5 py-3.5 md:flex-row md:items-center md:gap-6">
        {/* Eyebrow + Stat — the headline number does the heavy lifting. */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-foreground/55" aria-hidden />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                ROI · agency case
              </span>
            </div>
            <span className="mt-0.5 font-mono text-[28px] font-bold leading-none text-foreground tabular-nums">
              4 hrs<span className="text-[16px] text-foreground/55">/week</span>
            </span>
          </div>
        </div>

        <span aria-hidden className="hidden h-10 w-px bg-foreground/[0.08] md:block" />

        {/* Benefit + CTA */}
        <div className="flex flex-1 flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-4">
          <p className="text-[13px] leading-snug text-foreground/75 max-w-[420px]">
            Saved per buyer with Auto-Pilot on Growth Pro — multi-account launches,
            Round Robin distribution, all on one drill-down.
          </p>
          <button
            type="button"
            onClick={() => navigate("/plans-v2?tier=growth&view=trial")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5",
              "bg-primary text-[12px] font-medium text-primary-foreground",
              "transition-colors duration-150 hover:bg-primary/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            )}
          >
            <span>See Growth Pro</span>
            <ArrowRight
              className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-[1px]"
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  );
}
