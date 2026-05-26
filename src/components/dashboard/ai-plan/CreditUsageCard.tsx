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
 * Data: mocked locally. Real backend wiring later.
 */

const CYCLE_USED = 1218;
const CYCLE_TOTAL = 1500;
const CYCLE_REMAINING = CYCLE_TOTAL - CYCLE_USED;
const CYCLE_RESET = "26 August";
const DAILY_BURN = 6;
const GENERATIONS_TOTAL = 192;
const GENERATED_THIS_WEEK = 41;

export function CreditUsageCard() {
  const usedPct = Math.min(100, (CYCLE_USED / CYCLE_TOTAL) * 100);

  return (
    <section className="rounded-2xl border border-border/60 bg-card">
      {/* Header strip */}
      <header className="flex items-center justify-between px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          Credit usage
        </p>
        <p className="text-[11.5px] text-muted-foreground tabular-nums">
          {CYCLE_REMAINING} credits left this cycle
        </p>
      </header>

      {/* Hero body */}
      <div className="px-5 py-4">
        <p className="font-semibold tabular-nums leading-none text-[30px]">
          <span className="text-foreground">{CYCLE_USED}</span>
          <span className="text-foreground/40"> / {CYCLE_TOTAL}</span>
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          used this cycle
        </p>

        {/* Progress bar */}
        <div
          className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/40"
          role="progressbar"
          aria-valuenow={Math.round(usedPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Credit usage this cycle"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      {/* Footer 4-col strip */}
      <div className="flex border-t border-border/60">
        <FooterCell label="Daily burn" value={`~${DAILY_BURN} / day`} />
        <FooterCell label="Reset" value={CYCLE_RESET} />
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
