/**
 * Competitor detail · Overview tab, top to bottom:
 *   AI summary + KPIs · industries and categories they run ads in · launch activity line · suggested actions.
 * Every block says how many ads it is built on.
 */
import { useState } from "react";
import type { RankedItem } from "@/lib/insights-v3/selectors";
import { OverlaySection, fmtInt } from "../../shared";
import { AdvertiserActions } from "../AdvertiserActions";
import { LaunchLine } from "../LaunchLine";
import { SummaryAndKpis } from "../overlayParts";
import type { DetailTabProps } from "./types";

const TAG_PREVIEW = 6;

/** One labelled row of plain count tags (not buttons). Wraps; "+N more" after the first few. */
function TagRow({ label, items }: { label: string; items: RankedItem[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, TAG_PREVIEW);
  const rest = items.length - TAG_PREVIEW;
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <h4 className="w-24 shrink-0 pt-1 text-xs font-medium text-muted-foreground">{label}</h4>
      {items.length === 0 ? (
        <p className="pt-1 text-xs italic text-muted-foreground">No {label.toLowerCase()} data for these ads.</p>
      ) : (
        <ul aria-label={label} className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {shown.map((i) => (
            <li
              key={i.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-text"
            >
              <span className="min-w-0 truncate" title={i.label}>
                {i.label}
              </span>
              <span className="shrink-0 font-mono font-normal tabular-nums opacity-80">{fmtInt(i.count)}</span>
              <span className="sr-only">{i.count === 1 ? "ad" : "ads"}</span>
            </li>
          ))}
          {rest > 0 && (
            <li>
              <button
                type="button"
                aria-expanded={all}
                onClick={() => setAll((v) => !v)}
                className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {all ? "Show less" : `+${rest} more`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function OverviewTab({ kind, detail, ads }: DetailTabProps) {
  const noun = kind === "page" ? "page" : "domain";
  return (
    <>
      <SummaryAndKpis summary={detail.summary} kpis={detail.kpis} basedOn={detail.basedOn} />

      <OverlaySection title="Industries and categories" basedOn={detail.industries.basedOn}>
        <div className="space-y-3">
          <TagRow label="Industries" items={detail.industries.items} />
          <TagRow label="Categories" items={detail.categories.items} />
        </div>
      </OverlaySection>

      <LaunchLine
        series={detail.launchActivity}
        basedOn={detail.launchActivity.basedOn}
        emptyReason={`This ${noun} launched no ads in the picked period, so there is nothing to chart.`}
      />

      <AdvertiserActions detail={detail} ads={ads} />
    </>
  );
}
