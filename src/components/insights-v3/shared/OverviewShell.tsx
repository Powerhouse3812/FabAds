import { useCallback, useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { AiSummary, Kpi } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { AiSummaryBlock } from "./AiSummaryBlock";
import { BasedOnNote } from "./BasedOnNote";
import { KpiRow } from "./KpiRow";

const KEY_PREFIX = "fabads:insights-v3:overview:";

function readExpanded(pageKey: string, fallback: boolean): boolean {
  try {
    const v = window.localStorage.getItem(KEY_PREFIX + pageKey);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

function writeExpanded(pageKey: string, v: boolean) {
  try {
    window.localStorage.setItem(KEY_PREFIX + pageKey, v ? "1" : "0");
  } catch {
    /* storage blocked: state just won't persist */
  }
}

export interface OverviewShellProps {
  /** Persistence key, e.g. "discover", "advertiser-domain". One state per page. */
  pageKey: string;
  /** Ads the whole overview is built on — always shown. */
  basedOn: number;
  /** Used until the user has chosen. Default true. */
  defaultExpanded?: boolean;
  kpis: Kpi[];
  /** AI summary. Null/undefined renders a disabled summary using `summaryDisabledReason`. */
  summary?: AiSummary | null;
  summaryDisabledReason?: string;
  /** Launch-frequency chart etc. (compose TrendBars). Expanded only. */
  charts?: ReactNode;
  /** Rising + Scaling. Rendered only when expanded. */
  expandedOnly?: ReactNode;
  /** Top-10 groups (compose TopTenGroups). Expanded only. */
  groups?: ReactNode;
  title?: string;
  className?: string;
}

/**
 * Collapsible overview. Collapsed = just the small KPI row (+ "Based on X ads").
 * Expanded = KPIs, AI summary + charts, Rising/Scaling, top-10 groups.
 * Collapsed state persists per `pageKey` in localStorage (guarded).
 */
export function OverviewShell({
  pageKey,
  basedOn,
  defaultExpanded = true,
  kpis,
  summary,
  summaryDisabledReason,
  charts,
  expandedOnly,
  groups,
  title = "Overview",
  className,
}: OverviewShellProps) {
  const [expanded, setExpanded] = useState(() => readExpanded(pageKey, defaultExpanded));
  const bodyId = useId();
  const toggle = useCallback(() => {
    setExpanded((v) => {
      writeExpanded(pageKey, !v);
      return !v;
    });
  }, [pageKey]);

  const showSummary = summary !== undefined || !!summaryDisabledReason;
  const showTop = showSummary || !!charts;

  return (
    <section aria-label={title} className={cn("rounded-2xl border border-border bg-card/60 p-3 sm:p-4", className)}>
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", !expanded && "-rotate-90")}
            aria-hidden="true"
          />
          {title}
          <span className="sr-only">{expanded ? " — collapse" : " — expand"}</span>
        </button>
        <BasedOnNote ads={basedOn} />
      </header>

      <div id={bodyId} className="mt-3 space-y-3">
        <KpiRow kpis={kpis} dense={!expanded} />
        {expanded && (
          <>
            {showTop && (
              <div
                className={cn(
                  "grid grid-cols-1 gap-3",
                  showSummary && charts && "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
                )}
              >
                {showSummary &&
                  (summary ? (
                    <AiSummaryBlock summary={summary} />
                  ) : (
                    <AiSummaryBlock
                      summary={{ text: "", ads: basedOn }}
                      disabledReason={summaryDisabledReason ?? "Not enough data in this scope to write a summary."}
                    />
                  ))}
                {charts && <div className="min-w-0">{charts}</div>}
              </div>
            )}
            {expandedOnly && <div className="min-w-0">{expandedOnly}</div>}
            {groups && <div className="min-w-0">{groups}</div>}
          </>
        )}
      </div>
    </section>
  );
}
