import { Link } from "react-router-dom";
import { RefreshCw, Telescope } from "lucide-react";

/**
 * IndustryInsightsTile — Owned by Agent B.
 *
 * Three-metric Industry Insights pulse tile on the AI-plan dashboard:
 *   • No. of Brands followed
 *   • Pages followed
 *   • Competitors tracked
 *
 * Compact status card (not a CTA). Surfaces the Industry Insights module
 * on the dashboard so AI-plan users discover what's being tracked.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────┐
 *   │  INDUSTRY INSIGHTS  🔭          View all →  │  ← header strip
 *   ├─────────────────────────────────────────────┤
 *   │   28      │     12      │     14            │  ← 3-col grid
 *   │ BRANDS    │  PAGES      │  COMPETITORS      │     w/ dividers
 *   │ +3 wk     │  +2 wk      │  +1 wk            │     + delta chips
 *   ├─────────────────────────────────────────────┤
 *   │  ⟳  Last synced 12 min ago                  │  ← sync caption
 *   └─────────────────────────────────────────────┘
 *
 * Data: mocked inline. Real backend wiring later.
 */

const BRANDS_FOLLOWED = 28;
const PAGES_FOLLOWED = 12;
const COMPETITORS = 14;
const LAST_SYNC = "12 min ago";

const BRANDS_DELTA = "+3 this week";
const PAGES_DELTA = "+2 this week";
const COMPETITORS_DELTA = "+1 this week";

interface MetricCellProps {
  value: number;
  label: string;
  delta: string;
}

function MetricCell({ value, label, delta }: MetricCellProps) {
  return (
    <div className="flex flex-col items-end px-3 first:pl-0 last:pr-0 text-right">
      <span className="font-mono text-[24px] font-semibold leading-none tabular-nums text-foreground">
        {value}
      </span>
      <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </span>
      <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--success-text))]">
        {delta}
      </span>
    </div>
  );
}

export function IndustryInsightsTile() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card">
      {/* Header strip */}
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
            Industry Insights
          </span>
          <Telescope
            className="h-3.5 w-3.5 text-foreground/55"
            strokeWidth={2}
            aria-hidden
          />
        </div>
        <Link
          to="/insights-v2/feed"
          className="text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <span aria-hidden>→</span>
        </Link>
      </header>

      {/* Body */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 divide-x divide-border/60">
          <MetricCell
            value={BRANDS_FOLLOWED}
            label="Brands followed"
            delta={BRANDS_DELTA}
          />
          <MetricCell
            value={PAGES_FOLLOWED}
            label="Pages followed"
            delta={PAGES_DELTA}
          />
          <MetricCell
            value={COMPETITORS}
            label="Competitors"
            delta={COMPETITORS_DELTA}
          />
        </div>

        {/* Last synced caption */}
        <div className="mt-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <RefreshCw
            className="h-3 w-3 text-foreground/45"
            strokeWidth={2}
            aria-hidden
          />
          <span>Last synced {LAST_SYNC}</span>
        </div>
      </div>
    </section>
  );
}
