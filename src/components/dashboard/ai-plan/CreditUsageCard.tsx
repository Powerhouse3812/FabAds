import { Link } from "react-router-dom";
import { ArrowRight, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * CreditUsageCard — dedicated credit balance + burn-down card for the
 * AI-plan dashboard. Lives in the bento body next to RecentWorkStrip,
 * and is intentionally more prominent than the small "credits" chip
 * in NowStatusStrip.
 *
 * Layout:
 *   - Header strip:  mono-caps eyebrow + lime Zap accent (right)
 *   - Body:          big balance number, burn-down bar, 3-cell detail
 *                    grid, CTA row (Top up + View usage history)
 *
 * Data: mocked locally for the demo. No real backend wiring yet.
 */

const CYCLE_USED = 128;
const CYCLE_TOTAL = 500;
const DAILY_BURN = 6;
const CYCLE_RESET = "26 Aug";

export function CreditUsageCard() {
  const usedPct = Math.min(100, (CYCLE_USED / CYCLE_TOTAL) * 100);
  const remaining = Math.max(0, CYCLE_TOTAL - CYCLE_USED);
  const daysLeft = Math.max(0, Math.round(remaining / Math.max(1, DAILY_BURN)));
  const isHot = usedPct > 80;

  return (
    <section className="rounded-2xl border border-border/60 bg-card">
      {/* Header strip */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
          Generation Credits
        </p>
        <Zap className="h-4 w-4 text-primary" strokeWidth={2.2} />
      </header>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">
        {/* Big balance row */}
        <div>
          <p className="font-mono font-semibold tabular-nums leading-none text-[30px]">
            <span className="text-foreground">{CYCLE_USED}</span>
            <span className="text-muted-foreground"> / {CYCLE_TOTAL}</span>
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/55">
            used this cycle
          </p>
        </div>

        {/* Burn-down progress bar */}
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(usedPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Credit usage this cycle"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              isHot ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${usedPct}%` }}
          />
        </div>

        {/* Burn-down detail row */}
        <div className="grid grid-cols-3 divide-x divide-border/60 border-y border-border/60 -mx-4 px-0">
          <DetailCell label="Daily burn" value={`~${DAILY_BURN} / day`} />
          <DetailCell label="Days left" value={`~${daysLeft} days`} />
          <DetailCell label="Resets" value={CYCLE_RESET} />
        </div>

        {/* CTA row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link to="/plans-v2?addon=credits">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Top up
            </Link>
          </Button>
          <Link
            to="/iq/genie6/library?view=usage"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/55 transition-colors hover:text-foreground"
          >
            View usage history
            <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 first:pl-4 last:pr-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">
        {label}
      </p>
      <p className="mt-1 font-mono tabular-nums text-[13px] font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}
