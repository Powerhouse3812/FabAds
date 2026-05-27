import { useCredits } from "@/hooks/use-credits";
import { cn } from "@/lib/utils";

/**
 * CreditUsageCard — full-width hero on Row 2 of the AI-plan dashboard.
 *
 * Redesigned per Maalik's Figma to a col-7 hero layout:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ CREDIT USAGE                    118 credits left this cycle│  ← header strip
 *   ├────────────────────────────────────────────────────────────┤
 *   │  1218 / 1500                                               │
 *   │  USED THIS CYCLE                                           │  ← hero body
 *   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░  (81%)                     │
 *   ├──────────┬──────────┬───────────┬──────────────────────────┤
 *   │ DAILY    │ RESET    │ GENERATNS │ GENERATED THIS WEEK      │  ← 4-col footer
 *   │ ~6 / day │ 26 Aug   │ 192 total │ 41 total                 │
 *   └──────────┴──────────┴───────────┴──────────────────────────┘
 *
 * Neutral bg (no internal gradient), Geist throughout, mono caps eyebrows,
 * shadcn tokens, `tabular-nums` on numerics.
 *
 * Data: `used`, `limit`, `percent`, and `resetDate` come from the unified
 * `useCredits()` hook so the dashboard cannot contradict itself across
 * the header chip + this card + the upsell surfaces. `generations` and
 * `generated this week` remain local constants — they are not part of
 * the credit-state contract.
 */

// Cycle length used for the daily-burn derivation. The mock reset window
// runs ~from late July to 26 Aug; 30 days is the closest clean round.
const CYCLE_DAYS = 30;
const GENERATIONS_TOTAL = 192;
const GENERATED_THIS_WEEK = 41;

export function CreditUsageCard() {
  const { used, limit, percent, daysToReset, resetDate, isApproaching, isAtLimit } =
    useCredits();

  const remaining = Math.max(limit - used, 0);
  const dailyBurn = Math.max(
    1,
    Math.round(used / Math.max(1, CYCLE_DAYS - daysToReset)),
  );

  // Color states on the progress fill — lime <85%, amber 85-99%, red 100%.
  const barColorClass = isAtLimit
    ? "bg-red-500"
    : isApproaching
      ? "bg-amber-500"
      : "bg-primary";

  const resetLabel = resetDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  return (
    <section className="rounded-2xl border border-border/60 bg-card">
      {/* Header strip */}
      <header className="flex items-center justify-between px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          Credit usage
        </p>
        <p className="text-[11.5px] text-muted-foreground tabular-nums">
          {remaining} credits left this cycle
        </p>
      </header>

      {/* Hero body */}
      <div className="px-5 py-4">
        <p className="font-semibold tabular-nums leading-none text-[30px]">
          <span className="text-foreground">{used}</span>
          <span className="text-foreground/40"> / {limit}</span>
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          used this cycle
        </p>

        {/* Progress bar */}
        <div
          className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/40"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Credit usage this cycle"
        >
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", barColorClass)}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      </div>

      {/* Footer 4-col strip */}
      <div className="flex border-t border-border/60">
        <FooterCell label="Daily burn" value={`~${dailyBurn} / day`} />
        <FooterCell label="Reset" value={resetLabel} />
        <FooterCell label="Generations" value={`${GENERATIONS_TOTAL} total`} />
        <FooterCell
          label="Generated this week"
          value={`${GENERATED_THIS_WEEK} total`}
        />
      </div>
    </section>
  );
}

function FooterCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-4 py-3 border-r last:border-r-0 border-border/60">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 tabular-nums text-[13px] font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}
