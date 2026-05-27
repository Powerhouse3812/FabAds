import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";

/**
 * CreditApproachingBanner — full-width amber strip mounted at the top of
 * the AI-plan dashboard scroll container when the user is in the
 * "approaching limit" band (>= 85% used, but not yet at 100%).
 *
 * Not dismissible. Persistent until the cycle resets or the user starts
 * a Growth trial. Returns `null` outside the warning band so callers can
 * mount it unconditionally.
 *
 * Tone (locked): English, quietly-persuasive-with-confronting-edge.
 * Specific numbers over adjectives.
 */
export function CreditApproachingBanner() {
  const { used, limit, isApproaching, isAtLimit } = useCredits();

  if (!isApproaching || isAtLimit) return null;

  const remaining = Math.max(limit - used, 0);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.06] px-4 py-2.5 min-h-[52px]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle
          className="h-4 w-4 shrink-0 text-amber-600"
          strokeWidth={2.2}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-700">
            Approaching limit
          </p>
          <p className="text-[12.5px] font-medium text-foreground tabular-nums leading-snug">
            {used} of {limit} credits used. {remaining} left this cycle.
          </p>
        </div>
      </div>
      <Button asChild variant="secondary" size="sm" className="shrink-0">
        <Link to="/plans-v2?tier=growth&view=trial">
          Start 14-day Growth trial
        </Link>
      </Button>
    </div>
  );
}
