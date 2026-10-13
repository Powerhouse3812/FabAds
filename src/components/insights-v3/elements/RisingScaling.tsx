/**
 * Rising + Scaling for the active tab's element type. Shown only when the
 * overview is expanded (OverviewShell `expandedOnly`).
 *
 * Rising  = more new ads this period than the previous equal period.
 * Scaling = more ads seen live than at the end of the previous period AND at least one winner.
 * Neither says an item performs better; they describe movement in usage.
 */
import type { ElementType } from "@/lib/insights-v3/types";
import type { TrendItem } from "@/lib/insights-v3/selectors";
import {
  BasedOnNote,
  ChangeChip,
  DisabledSection,
  ElementChip,
  InfoGlyph,
  fmtInt,
} from "@/components/insights-v3/shared";
import { ELEMENT_NOUN, ELEMENT_NOUN_SINGULAR } from "./constants";

function Panel({
  title,
  tip,
  basedOn,
  children,
}: {
  title: string;
  tip: string;
  basedOn: number;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="min-w-0 rounded-xl border border-border bg-card p-3">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          {title}
          <InfoGlyph tip={tip} />
        </h4>
        <BasedOnNote ads={basedOn} />
      </header>
      {children}
    </section>
  );
}

export function RisingScaling({
  type,
  rising,
  scaling,
  basedOn,
}: {
  type: ElementType;
  rising: TrendItem[];
  scaling: TrendItem[];
  basedOn: number;
}) {
  const noun = ELEMENT_NOUN[type];
  const one = ELEMENT_NOUN_SINGULAR[type];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Panel
        title={`Rising ${noun}`}
        tip={`${noun[0].toUpperCase()}${noun.slice(1)} whose new-ad count grew against the previous equal period. This is movement in usage, not a verdict on results.`}
        basedOn={basedOn}
      >
        {rising.length === 0 ? (
          <DisabledSection
            className="mt-2"
            minHeight={96}
            title={`No rising ${noun}`}
            reason={`No ${one} launched more ads than in the previous period for this scope.`}
          />
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {rising.map((it) => (
              <li key={it.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 py-1.5">
                <ElementChip type={type} id={it.id} label={it.label} />
                <ChangeChip changePct={it.changePct} />
                <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                  {fmtInt(it.cur)} new ads this period
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title={`Scaling ${noun}`}
        tip={`${noun[0].toUpperCase()}${noun.slice(1)} with more ads seen live than at the end of the previous period, and at least one winner.`}
        basedOn={basedOn}
      >
        {scaling.length === 0 ? (
          <DisabledSection
            className="mt-2"
            minHeight={96}
            title={`No scaling ${noun}`}
            reason={`No ${one} has both more live ads than before and a winner in this scope.`}
          />
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {scaling.map((it) => (
              <li key={it.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 py-1.5">
                <ElementChip type={type} id={it.id} label={it.label} />
                <span className="rounded-full border border-success-text/30 bg-success-text/10 px-2 py-0.5 font-mono text-[11px] tabular-nums text-success-text">
                  {fmtInt(it.activePrev)} → {fmtInt(it.activeNow)} live ads
                </span>
                <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                  {fmtInt(it.winners)} {it.winners === 1 ? "winner" : "winners"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
