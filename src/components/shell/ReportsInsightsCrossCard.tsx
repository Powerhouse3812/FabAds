import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Telescope, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * ReportsInsightsCrossCard — footer-pinned cross-module add-on prompt
 * for the Reports sub-nav. Promotes Industry Insights Pro to AI-plan
 * users at the moment they're already in a reporting mindset.
 *
 * Differs from the Insights extension card in ONE deliberate way: a
 * tiny "30% OFF" pill next to the eyebrow uses an orange tint —
 * the sole non-lime saturated color in the system, earning its
 * weight through scarcity (appears nowhere else in the app). Pill
 * is small (9px), tucked next to eyebrow — reads as a quiet tag,
 * not a banner.
 */

const STORAGE_KEY = "genie6:reports:insights-cross-dismissed";

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

export function ReportsInsightsCrossCard() {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [dismissed, dismiss] = useDismissed();

  if (plan !== "ai" || dismissed) return null;

  return (
    <div className="shrink-0 px-2 py-2">
      <div
        className={cn(
          "group relative flex flex-col gap-1.5 rounded-md px-2.5 py-2",
          "border border-foreground/[0.06] bg-foreground/[0.03]",
          "transition-[transform,border-color,background-color] duration-200 ease-out",
          "hover:-translate-y-[1px] hover:border-primary/30 hover:bg-foreground/[0.045]",
          "focus-within:border-primary/40",
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Industry Insights cross-sell"
          title="Dismiss"
          className={cn(
            "absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full",
            "text-foreground/45 opacity-0 transition-opacity duration-150",
            "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          )}
        >
          <X className="h-3 w-3" strokeWidth={2.25} />
        </button>

        <div className="flex items-center gap-1.5 pr-5">
          <Telescope
            className="h-3.5 w-3.5 shrink-0 text-foreground/55"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/55">
            Add on
          </span>
          {/* 30% OFF — sole non-lime saturated color in the app. Tucked
              next to the eyebrow so it reads as a quiet tag, not a
              banner. Orange chosen for scarcity-driven attention; lime
              would be lost in the existing lime CTA + accent surface. */}
          <span
            className={cn(
              "inline-flex items-center rounded-sm px-1 py-[1px]",
              "bg-orange-500/15 font-mono text-[9px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400",
            )}
            aria-label="30 percent off limited time"
          >
            30% off
          </span>
        </div>

        <p className="text-[11px] leading-snug text-foreground/70">
          Add Industry Insights Pro for ₹999/mo extra.
        </p>

        <button
          type="button"
          onClick={() => navigate("/plans-v2?addon=insights-pro")}
          className={cn(
            "mt-0.5 inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-[3px]",
            "bg-primary text-[10px] font-medium tracking-tight text-primary-foreground",
            "transition-colors duration-150 hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span>Add Insights</span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-150 group-hover:translate-x-[1px]"
          >
            →
          </span>
        </button>
      </div>
    </div>
  );
}
