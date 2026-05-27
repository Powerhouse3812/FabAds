import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";

/**
 * CreditAtLimitModal — blocking surface that opens once per session when
 * the user crosses the 100% credit-usage threshold. Reads from
 * `useCredits()` and self-gates via `sessionStorage` so refreshing the
 * page does NOT spam the modal, but a new tab / new session does.
 *
 * Closable by the standard X / outside-click / Esc. If the user is still
 * over limit on the next page navigation that mounts this component,
 * the gate's session key was cleared on dismiss, so it re-opens. (We
 * persist a small dismissal counter to avoid re-opening within the same
 * session if the user already saw + dismissed it once.)
 *
 * Copy is English only, no clichés. The trial CTA is locked at 14 days.
 */

const SESSION_KEY = "fabads.credits.atLimitModal.seen";

export function CreditAtLimitModal() {
  const {
    limit,
    daysToReset,
    resetDate,
    isAtLimit,
    upgradeTierLabel,
    upgradeTierLimit,
  } = useCredits();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAtLimit) return;
    if (typeof window === "undefined") return;
    const seen = window.sessionStorage.getItem(SESSION_KEY);
    if (seen) return;
    setOpen(true);
    window.sessionStorage.setItem(SESSION_KEY, "1");
  }, [isAtLimit]);

  if (!isAtLimit) return null;

  const resetLabel = resetDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[480px] sm:rounded-2xl">
        <div className="space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            At your limit
          </p>
          <h2 className="text-[24px] font-semibold leading-tight text-foreground tabular-nums">
            {limit} credits used. Next reset in {daysToReset} days.
          </h2>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Generation is paused until {resetLabel} unless you top up or
            trial {upgradeTierLabel.split(" ")[0]}.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild size="lg" className="w-full">
              <Link to="/plans-v2?tier=growth&view=trial">
                Start 14-day {upgradeTierLabel} trial —{" "}
                {upgradeTierLimit} credits/mo
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/plans-v2?action=topup">
                Top up 100 credits · ₹1,999
              </Link>
            </Button>
          </div>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-foreground/45 underline-offset-2 transition-colors hover:text-foreground/70 hover:underline focus-visible:outline-none focus-visible:text-foreground focus-visible:underline"
            >
              Wait for reset
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
