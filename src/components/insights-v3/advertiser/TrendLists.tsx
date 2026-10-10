/**
 * Rising + Scaling lists for the expanded overview. Every row opens the
 * item's detail overlay. Overview blocks follow the scope only (not the tag filter).
 */
import { TrendingUp } from "lucide-react";
import type { SavableType } from "@/lib/insights-v3/types";
import type { TrendItem } from "@/lib/insights-v3/selectors";
import { BasedOnNote, DisabledSection, ElementChip, Hint, fmtInt, fmtPct } from "../shared";

export type TrendListMode = "rising" | "scaling";

function Metric({ item, mode }: { item: TrendItem; mode: TrendListMode }) {
  if (mode === "scaling") {
    const delta = item.activeNow - item.activePrev;
    return (
      <Hint content={`Active ads now vs the end of the previous period: ${fmtInt(item.activePrev)} → ${fmtInt(item.activeNow)}. ${fmtInt(item.winners)} winning.`}>
        <span tabIndex={0} className="font-mono text-xs tabular-nums text-success-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          +{fmtInt(delta)} active · {fmtInt(item.winners)} {item.winners === 1 ? "winner" : "winners"}
        </span>
      </Hint>
    );
  }
  const label = item.changePct === null ? "New this period" : fmtPct(item.changePct);
  return (
    <Hint content={`New ads launched this period vs the previous equal period: ${fmtInt(item.cur)} vs ${fmtInt(item.prev)}.`}>
      <span
        tabIndex={0}
        className={`font-mono text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          item.changePct === null || item.changePct > 0 ? "text-success-text" : "text-muted-foreground"
        }`}
      >
        {label} · {fmtInt(item.cur)} new
      </span>
    </Hint>
  );
}

export function TrendList({
  title,
  mode,
  items,
  type,
  basedOn,
  emptyReason,
  unit,
}: {
  title: string;
  mode: TrendListMode;
  items: TrendItem[];
  type: SavableType;
  basedOn: number;
  emptyReason: string;
  /** What the right-hand number measures. */
  unit: string;
}) {
  if (items.length === 0) return <DisabledSection title={title} reason={emptyReason} minHeight={140} />;
  return (
    <section aria-label={title} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-primary-text" aria-hidden="true" />
          {title}
        </h3>
        <BasedOnNote ads={basedOn} />
      </header>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Unit: <span className="font-medium text-foreground">{unit}</span>
      </p>
      <ul className="mt-2 divide-y divide-border">
        {items.map((it) => (
          <li key={it.id} className="flex min-w-0 items-center justify-between gap-3 py-1.5">
            <ElementChip type={type} id={it.id} label={it.label} />
            <Metric item={it} mode={mode} />
          </li>
        ))}
      </ul>
    </section>
  );
}
