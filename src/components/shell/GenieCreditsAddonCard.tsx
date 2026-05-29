import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * GenieCreditsAddonCard — footer-pinned add-on prompt for the Genie
 * sub-nav. Promotes a one-time credit top-up for AI-plan users who
 * are running low.
 *
 * Redesigned around a RADIAL USAGE METER: an SVG donut ring (real
 * stroke-dasharray math, lime arc on a currentColor track) is the hero,
 * showing cycle usage at a glance, with the big mono count in the center.
 * A muted sub-line states credits left, and a lime CTA chip drives the
 * top-up. Mock numbers mirror the dashboard CreditUsageCard (1218 / 1500).
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

// Mock cycle figures — mirror the dashboard CreditUsageCard so the
// upsell surfaces cannot contradict each other.
const USED = 1218;
const LIMIT = 1500;
const REMAINING = LIMIT - USED; // 282
const PERCENT = Math.round((USED / LIMIT) * 100); // 81

// Ring geometry. 72px outer with a 6px stroke reads as a clean donut at
// this small size; round caps soften the arc terminus.
const RING_SIZE = 72;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
// Fraction filled, then the dash offset that exposes exactly that arc.
const RING_OFFSET = RING_CIRCUMFERENCE * (1 - USED / LIMIT);

export function GenieCreditsAddonCard() {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [dismissed, dismiss] = useDismissed();

  if (plan !== "ai" || dismissed) return null;

  // Arc tone: lime <85%, amber 85–99%, red at the cap. 81% stays lime.
  const arcToneClass =
    PERCENT >= 100
      ? "text-red-500"
      : PERCENT >= 85
        ? "text-amber-500"
        : "text-primary";

  return (
    <div className="shrink-0 px-2 py-2">
      <div
        className={cn(
          "group relative flex flex-col items-center gap-2 rounded-md px-2.5 pb-2.5 pt-2",
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

        {/* Eyebrow */}
        <div className="flex w-full items-center gap-1.5 pr-5">
          <Zap
            className="h-3.5 w-3.5 shrink-0 text-foreground/55"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/55">
            Add-on
          </span>
        </div>

        {/* Radial usage meter */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="relative"
            style={{ width: RING_SIZE, height: RING_SIZE }}
          >
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="-rotate-90"
              aria-hidden
            >
              {/* Track */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={RING_STROKE}
                className="text-foreground/[0.12]"
              />
              {/* Usage arc */}
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_OFFSET}
                className={cn(
                  "transition-[stroke-dashoffset] duration-700 ease-out",
                  arcToneClass,
                )}
              />
            </svg>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center leading-none"
              aria-label={`${USED} of ${LIMIT} credits used`}
            >
              <span className="font-mono text-[15px] font-bold tabular-nums text-foreground">
                {USED}
              </span>
              <span className="mt-0.5 font-mono text-[9px] tabular-nums text-muted-foreground">
                /{LIMIT}
              </span>
            </div>
          </div>
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {PERCENT}% used
          </span>
        </div>

        {/* Sub-line */}
        <p className="w-full text-center text-[11px] leading-snug text-muted-foreground">
          {REMAINING} credits left this cycle.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate("/plans-v2?addon=credits")}
          className={cn(
            "mt-0.5 inline-flex w-full items-center justify-center gap-1 rounded-sm px-2 py-[5px]",
            "bg-primary text-[11px] font-medium tracking-tight text-primary-foreground",
            "transition-colors duration-150 hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span>Buy 100 credits · ₹1,999</span>
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
