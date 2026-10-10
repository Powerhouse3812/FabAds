/**
 * Rising + Scaling (Discover overview, expanded only).
 * Rising  = creative elements (framework / hook / angle / concept) whose new-ad launches grew most vs the previous period.
 * Scaling = pages running more live ads than before and holding at least one winner.
 * Both carry a unit label and "Based on X ads". Neither ranks by popularity.
 */
import { useMemo } from "react";
import type { Ad, ElementType, PeriodKey } from "@/lib/insights-v3/types";
import { comparisonLabel, risingRank, rising, scaling, type TrendItem } from "@/lib/insights-v3/selectors";
import { BasedOnNote, ChangeChip, DisabledSection, ElementChip, Hint, fmtInt } from "@/components/insights-v3/shared";

const ELEMENT_KINDS: ElementType[] = ["framework", "hook", "angle", "concept"];
const RISING_LIMIT = 8;
const SCALING_LIMIT = 5;

export interface RisingScalingProps {
  /** Ads in the base scope (industry, category, prefs; NOT the period): trends compare periods. */
  baseAds: Ad[];
  period: PeriodKey;
  now: number;
  /** Ads in the page's current scope: the "Based on" figure. */
  basedOn: number;
}

function Panel({ title, unit, basedOn, children }: { title: string; unit: string; basedOn: number; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="min-w-0 rounded-xl border border-border bg-card p-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <BasedOnNote ads={basedOn} />
      </header>
      <p className="mt-0.5 text-xs text-muted-foreground">{unit}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function RisingScaling({ baseAds, period, now, basedOn }: RisingScalingProps) {
  const risingItems = useMemo<TrendItem[]>(
    () =>
      ELEMENT_KINDS.flatMap((k) => rising(k, baseAds, period, now, { limit: RISING_LIMIT }))
        .sort((a, b) => risingRank(b) - risingRank(a) || b.cur - a.cur || (a.id < b.id ? -1 : 1))
        .slice(0, RISING_LIMIT),
    [baseAds, period, now],
  );
  const scalingItems = useMemo(() => scaling("page", baseAds, period, now, { limit: SCALING_LIMIT }), [baseAds, period, now]);
  const vs = comparisonLabel(period);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {risingItems.length === 0 ? (
        <DisabledSection
          title="Rising creative elements"
          reason="No framework, hook, angle or concept launched more new ads than in the previous period, so nothing is rising in this scope."
          minHeight={140}
        />
      ) : (
        <Panel title="Rising creative elements" unit={`Change in new ads launched, compared with ${vs}`} basedOn={basedOn}>
          <ol className="space-y-1.5">
            {risingItems.map((it) => (
              <li key={`${it.kind}:${it.id}`} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <ElementChip type={it.kind as ElementType} id={it.id} label={it.label} />
                <ChangeChip changePct={it.changePct} />
                <Hint content={`${fmtInt(it.cur)} new ads this period, ${fmtInt(it.prev)} in the previous period`}>
                  <span tabIndex={0} className="rounded-sm font-mono text-[11px] tabular-nums text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {fmtInt(it.cur)} new ads
                  </span>
                </Hint>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {scalingItems.length === 0 ? (
        <DisabledSection
          title="Scaling pages"
          reason="No page is running more live ads than before while also holding a winner, so nothing is scaling in this scope."
          minHeight={140}
        />
      ) : (
        <Panel title="Scaling pages" unit={`Live ads now vs ${vs}`} basedOn={basedOn}>
          <ol className="space-y-1.5">
            {scalingItems.map((it) => (
              <li key={it.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <ElementChip type="page" id={it.id} label={it.label} />
                <span className="font-mono text-[11px] tabular-nums text-success-text">
                  {fmtInt(it.activePrev)} → {fmtInt(it.activeNow)} live ads
                </span>
                <span className="rounded-full border border-warning-text/30 bg-warning-text/10 px-2 py-0.5 text-[11px] font-medium text-warning-text">
                  <span className="font-mono tabular-nums">{fmtInt(it.winners)}</span> {it.winners === 1 ? "winner" : "winners"}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
