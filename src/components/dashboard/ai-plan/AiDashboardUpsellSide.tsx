import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * AiDashboardUpsellSide — "ROI · agency case" full-width horizontal card.
 *
 * Per Maalik's finalised Figma (2026-05-26 override): single horizontal
 * row with a big "4 hrs/week" hero stat on the left, narrative paragraph
 * in the middle, and a lime primary CTA on the right. Maalik has
 * explicitly authorised the 4 hrs/week ROI claim per Figma — it is
 * restored as designed.
 *
 * Gating: AI plan only. Growth users hide this entirely.
 * Dismiss X reveals on hover · localStorage persistence.
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
  const [dismissed, dismiss] = useDismissed();

  if (plan !== "ai" || dismissed) return null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-border/60 bg-foreground/[0.03]",
      )}
    >
      {/* Lime accent bar at left edge */}
      <span
        aria-hidden
        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
      />

      {/* Dismiss X */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss upsell card"
        title="Dismiss"
        className={cn(
          "absolute right-2 top-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full",
          "text-foreground/45 opacity-0 transition-opacity duration-150",
          "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
        )}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      <div className="flex items-center gap-6 px-5 py-3.5">
        {/* LEFT cluster — eyebrow + big hero stat */}
        <div className="flex shrink-0 flex-col gap-1 min-w-[132px]">
          <div className="flex items-center gap-1.5">
            <Bookmark
              className="h-3 w-3 text-foreground/55"
              strokeWidth={2.25}
              aria-hidden
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Saved per buyer
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-[28px] font-bold leading-none text-foreground tabular-nums">
              4 hrs
            </span>
            <span className="text-[16px] font-bold leading-none text-foreground/55">
              /week
            </span>
          </div>
        </div>

        {/* Vertical divider — md+ only */}
        <span
          aria-hidden
          className="hidden md:block h-10 w-px bg-foreground/10 shrink-0"
        />

        {/* CENTER — narrative paragraph */}
        <p className="flex-1 text-[13px] font-normal leading-snug text-foreground/75">
          Auto-Pilot launches across 12 accounts, rotates spend nightly, and pauses losers before they burn budget. That's 4 hours a week the buyer doesn't spend in Ads Manager.
        </p>

        {/* RIGHT — primary CTA */}
        <div className="shrink-0">
          <Link
            to="/plans-v2?tier=growth-pro&view=trial"
            className={cn(
              "inline-flex items-center gap-1 rounded-2xl bg-primary px-3 py-1.5",
              "text-[12px] font-semibold text-foreground transition-colors hover:bg-primary/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            Try Growth Pro · 14-day trial
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
