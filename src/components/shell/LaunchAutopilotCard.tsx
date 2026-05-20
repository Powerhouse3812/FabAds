import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * LaunchAutopilotCard — footer-pinned tier-up prompt for the Launch
 * sub-nav. Targets AI-plan users browsing locked launch surfaces,
 * promoting the Growth Pro tier where Autopilot lives.
 *
 * Differs from the Insights extension card in one respect — the
 * eyebrow uses a lime tint to signal "this is a tier-up, not a side
 * add-on". Otherwise the same compact 96px footer grammar.
 */

const STORAGE_KEY = "genie6:launch:autopilot-card-dismissed";

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

export function LaunchAutopilotCard() {
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
          aria-label="Dismiss Autopilot prompt"
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
          <Rocket
            className="h-3.5 w-3.5 shrink-0 text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
          {/* Eyebrow lime-tinted — signals tier-up, not side add-on. */}
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary/80">
            Growth
          </span>
        </div>

        <p className="text-[11px] leading-snug text-foreground/70">
          Auto-launch your top creatives across 15 accounts.
        </p>

        <button
          type="button"
          onClick={() => navigate("/plans-v2?tier=growth&view=trial")}
          className={cn(
            "mt-0.5 inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-[3px]",
            "bg-primary text-[10px] font-medium tracking-tight text-primary-foreground",
            "transition-colors duration-150 hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span>Try Growth Pro</span>
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
