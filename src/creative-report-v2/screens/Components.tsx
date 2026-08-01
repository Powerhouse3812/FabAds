/**
 * Components — "what's winning across the book" (handoff §5.3).
 * Five tabs (Hooks / Headlines / Primary text / CTAs / Visual styles), URL is
 * the single source of tab state. Rows split into Winners (>= median win-rate)
 * and Decliners (below median), each rendered as its own ComponentTable, with
 * a one-click "Brief this → Genie" hand-off per row.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ComponentTable } from "@/creative-report-v2/components/ComponentTable";
import { StateMessage } from "@/creative-report-v2/components/states/StateMessage";
import { GridSkeleton } from "@/creative-report-v2/components/states/Skeletons";
import { useCreativeData } from "@/creative-report-v2/hooks/useCreativeData";
import { useReportParams } from "@/creative-report-v2/hooks/useReportParams";
import { useReportBasePath } from "@/creative-report-v2/state/ReportBasePathContext";
import { pluralize } from "@/creative-report-v2/lib/format";
import {
  COMPONENT_TABS,
  COMPONENT_TAB_LABELS,
  P,
} from "@/creative-report-v2/lib/paramSchema";

/** Lowercase the first letter for mid-sentence use — but leave acronyms alone.
 *  A naive lowerFirst turns the "CTAs" tab label into "cTAs" in the subhead. */
function lowerFirst(s: string): string {
  if (!s.length) return s;
  // Two leading capitals means an acronym ("CTAs") — mid-sentence it stays as-is.
  if (s.length > 1 && s[0] === s[0].toUpperCase() && s[1] === s[1].toUpperCase()) return s;
  return s[0].toLowerCase() + s.slice(1);
}

export function ComponentsReport() {
  const data = useCreativeData();
  const { view, setParam } = useReportParams();
  const navigate = useNavigate();
  const basePath = useReportBasePath();

  const tabLabel = COMPONENT_TAB_LABELS[view.tab];

  const rows = useMemo(() => data.getComponents(view.tab), [data, view.tab]);

  const { winners, decliners } = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.winRate - a.winRate);
    return {
      winners: sorted.filter((r) => r.vsMedianPct >= 0),
      decliners: sorted.filter((r) => r.vsMedianPct < 0),
    };
  }, [rows]);

  const onBrief = (value: string) => {
    const query =
      view.tab === "hooks"
        ? `hook=${encodeURIComponent(value)}`
        : `brief=${encodeURIComponent(value)}`;
    navigate(`/genie/new?${query}&from=${encodeURIComponent(basePath)}`);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Tab strip — the ONE place tab state lives, driven by the URL. */}
      <div role="tablist" aria-label="Component type" className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
        {COMPONENT_TABS.map((tab) => {
          const active = view.tab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParam(P.tab, tab)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {COMPONENT_TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Which {lowerFirst(tabLabel)} are winning across your book this period — brief the next
        batch from what works.
      </p>

      {data.status === "loading" ? (
        <GridSkeleton />
      ) : data.status === "empty" ? (
        <StateMessage
          variant="empty"
          title="No ad account connected"
          body="Connect an ad account to see which components are winning."
          actionLabel="Connect ad account"
          onAction={() => {}}
        />
      ) : data.status === "filtered-empty" ? (
        <StateMessage
          variant="filtered"
          title="No components match these filters"
          body="Nothing in the current filters. Clear them to see your full component book."
        />
      ) : rows.length === 0 ? (
        <StateMessage
          variant="filtered"
          title="No components in this view"
          body="Nothing in the current filters. Clear them to see your full component book."
        />
      ) : (
        <div className="space-y-8">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Winners <span className="font-normal text-muted-foreground">· {pluralize(winners.length, "component")}</span>
            </h2>
            <ComponentTable rows={winners} tabLabel={tabLabel} onBrief={onBrief} />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Decliners <span className="font-normal text-muted-foreground">· {pluralize(decliners.length, "component")}</span>
            </h2>
            <ComponentTable rows={decliners} tabLabel={tabLabel} onBrief={onBrief} />
          </section>
        </div>
      )}
    </div>
  );
}
