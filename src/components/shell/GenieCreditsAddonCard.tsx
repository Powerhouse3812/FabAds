import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * GenieCreditsAddonCard — footer-pinned add-on prompt for the Genie
 * sub-nav. Promotes a one-time credit top-up for AI-plan users who
 * are running low. Mirrors the exact grammar of InsightsExtensionCard:
 * Geist Mono caps eyebrow, single-line pitch, lime CTA chip, hover X.
 *
 * Gating: AI plan only (Growth users have higher credit allocations
 * and don't need the top-up upsell).
 */

const STORAGE_KEY = "genie6:genie:credits-addon-dismissed";

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

export function GenieCreditsAddonCard() {
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
          aria-label="Dismiss credits add-on prompt"
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
          <Zap
            className="h-3.5 w-3.5 shrink-0 text-foreground/55"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/55">
            Add-on
          </span>
        </div>

        <p className="text-[11px] leading-snug text-foreground/70">
          +100 credits for ₹1,999 · one-time top-up.
        </p>

        <button
          type="button"
          onClick={() => navigate("/plans-v2?addon=credits")}
          className={cn(
            "mt-0.5 inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-[3px]",
            "bg-primary text-[10px] font-medium tracking-tight text-primary-foreground",
            "transition-colors duration-150 hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span>Buy credits</span>
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
