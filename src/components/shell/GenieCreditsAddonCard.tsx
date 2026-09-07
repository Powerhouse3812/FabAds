import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";
import {
  CREDITS_LIMIT,
  CREDITS_PERCENT,
  CREDITS_REMAINING,
  CREDITS_USED,
} from "@/genie6/lib/credits";

/**
 * GenieCreditsAddonCard — footer-pinned usage meter for the Genie sub-nav.
 * Shows credits-used balance on all plans via a RADIAL USAGE METER: an SVG
 * donut ring (real stroke-dasharray math, lime arc on a currentColor track)
 * with the mono count in the center. A muted sub-line states credits left.
 *
 * Genie 2.0 §3 & §16: the balance sits at the bottom of the Genie sub-nav,
 * visible on all plans (Genie 2.0 explicitly states "Credits balance sits at
 * the bottom of this sub-nav"). The upsell CTA ("Buy 100 credits · ₹1,999")
 * is gated to AI-plan users, but the balance meter itself is not.
 */


// Mock cycle figures — mirror the dashboard CreditUsageCard so the
// upsell surfaces cannot contradict each other.
// Genie 2.0 §15 — credits are now shown in the sub-nav (here), Catalogue and
// Studio. These were three separately hardcoded numbers; they now all read
// src/genie6/lib/credits.ts so a walkthrough can never show two different
// balances on two screens. This card is the USAGE meter (used of limit); the
// pills elsewhere show the BALANCE (remaining) — different presentations of
// one source, which is fine, two sources of truth is not.
const USED = CREDITS_USED;
const LIMIT = CREDITS_LIMIT;
const REMAINING = CREDITS_REMAINING;
const PERCENT = CREDITS_PERCENT;

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

  // Balance always renders on all plans; upsell CTA gated to AI plan only.

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
          "flex flex-col items-center gap-2 rounded-md px-2.5 pb-2.5 pt-2",
          "border border-foreground/[0.06] bg-foreground/[0.03]",
          "transition-[transform,border-color,background-color] duration-200 ease-out",
        )}
      >

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

        {/* CTA — upsell gated to AI plan only */}
        {plan === "ai" && (
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
              className="inline-block transition-transform duration-150 hover:translate-x-[1px]"
            >
              →
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
