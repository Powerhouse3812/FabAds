import { Link } from "react-router-dom";
import { ArrowUpRight, Telescope, TrendingUp, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ModuleAnalyticsStrip — the compact, minimal analytics surface for the
 * Growth dashboard, mirroring the AI dashboard's 2-row strip language.
 *
 * Maalik A-12.197 (referencing the finalised Figma): the numeric analytics
 * had grown too big across iterations. This collapses Genie + Industry
 * Insights numbers into ONE card with two label-prefixed rows:
 *
 *   GENIE              Total generations · Brands synced · Products · ...
 *   ─────────────────────────────────────────────────────────────────────
 *   INDUSTRY INSIGHTS  Total ads · Competitors · Brands followed · ...
 *
 * Each row: a lime module label on the left, then 5 inline metric cells
 * separated by hairline dividers. Tiny lime delta chip on the lead metric
 * only (matches the AI dashboard). NO sparklines, NO per-metric cards —
 * the lowest-hierarchy form of the data.
 */

interface Metric {
  label: string;
  value: string;
  delta?: { value: number; unit?: "%" | "" };
}

const GENIE_METRICS: Metric[] = [
  { label: "Total generations", value: "15,004", delta: { value: 4.5 } },
  { label: "Brands synced", value: "18" },
  { label: "Products synced", value: "142" },
  { label: "Categories", value: "12" },
  { label: "On-brand score", value: "87" },
];

const INSIGHTS_METRICS: Metric[] = [
  { label: "Total ads", value: "24,851", delta: { value: 12 } },
  { label: "Competitors", value: "53" },
  { label: "Brands followed", value: "64" },
  { label: "Pages tracked", value: "128" },
  { label: "Categories tracked", value: "9" },
];

export function ModuleAnalyticsStrip() {
  return (
    <section
      data-fabads-dash-section="module-analytics"
      aria-label="Genie and Industry Insights analytics"
      className="overflow-hidden rounded-2xl border border-border/60 bg-card"
    >
      <AnalyticsRow
        icon={Wand2}
        label="Genie"
        href="/iq/genie6/library"
        metrics={GENIE_METRICS}
      />
      <div aria-hidden className="h-px bg-border/60" />
      <AnalyticsRow
        icon={Telescope}
        label="Industry Insights"
        href="/insights-v2/feed"
        metrics={INSIGHTS_METRICS}
      />
    </section>
  );
}

function AnalyticsRow({
  icon: Icon,
  label,
  href,
  metrics,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  metrics: Metric[];
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-5">
      {/* Module label — lime, left-anchored, fixed width on lg so the
          metric grids of both rows line up. Doubles as the "open" link. */}
      <Link
        to={href}
        className={cn(
          "group flex shrink-0 items-center gap-1.5 lg:w-[148px]",
          "transition-colors",
        )}
      >
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
          {label}
        </span>
        <ArrowUpRight
          className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </Link>

      {/* Metric cells — inline, hairline dividers on lg, gap grid on mobile. */}
      <div
        className={cn(
          "grid flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3",
          "lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-border/60",
        )}
      >
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1 lg:px-4 lg:first:pl-0">
            <span className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {m.label}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-semibold leading-none text-foreground tabular-nums">
                {m.value}
              </span>
              {m.delta && (
                <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 py-0.5 font-mono text-[9px] font-semibold text-primary tabular-nums">
                  <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.4} />+
                  {m.delta.value}
                  {m.delta.unit ?? "%"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
