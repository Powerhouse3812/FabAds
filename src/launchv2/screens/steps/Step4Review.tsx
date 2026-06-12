/**
 * Step 4 — Review & Launch (the Meta two-pane finale).
 *
 *   Left pane  : indexed Account→Campaign→AdSet→Ad tree (collapsible, multi-
 *                select) with a flat "table view" toggle.
 *   Right pane : tabbed — Edit / Distribution / Preview / Issues.
 *
 * A persistent launch-readiness chip (issues count, Meta campaign-score style)
 * lives in the right-pane header. The actual Launch button is in the
 * orchestrator footer — this screen builds the review *surface*, surfacing
 * readiness + tree/edit/distribution/preview/issues. Full height (h-full).
 *
 * Reads only the frozen contract (deriveV2 / reducer via reviewModel) and writes
 * via flow.patch. Edit ONLY this file + helpers under screens/review/.
 */
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PageDistribution } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import { formatMoney } from "@/launch2/utils/time";
import { buildIssues, readiness, reviewSummary, type ReviewIssue } from "../review/reviewModel";
import { MiniStat, ReadinessChip } from "../review/reviewParts";
import { ReviewTree } from "../review/ReviewTree";
import { EditPane, IssuesPane, PreviewPane } from "../review/ReviewPanes";
import { dailyTotalBudget } from "../../deriveV2";

type RightTab = "edit" | "preview" | "issues";

export default function Step4Review({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<RightTab>("preview");
  const [flightDays, setFlightDays] = useState<7 | 14 | 30>(7);

  // When selection is cleared while Edit tab is open → fall back to Preview
  useEffect(() => {
    if (selected.size === 0) {
      setTab((prev) => (prev === "edit" ? "preview" : prev));
    }
  }, [selected.size]);

  const issues = useMemo(() => buildIssues(plan), [plan]);
  const ready = useMemo(() => readiness(issues), [issues]);
  const sum = useMemo(() => reviewSummary(plan), [plan]);
  const dailyTotal = useMemo(() => dailyTotalBudget(plan), [plan]);

  /** Apply a single issue's recommended fix (only distribution is in-place). */
  const applyFix = (issue: ReviewIssue) => {
    if (issue.fix?.kind === "switch_distribution" && issue.fix.distribution) {
      flow.patch({ pageDistribution: issue.fix.distribution });
    }
  };
  /** Auto-fix: pick the first distribution that clears all cap offenders. */
  const autoFix = () => {
    const candidates: PageDistribution[] = ["fill_first", "equal"];
    for (const d of candidates) {
      const probe = buildIssues({ ...plan, pageDistribution: d });
      if (!probe.some((i) => i.tier === "error")) {
        flow.patch({ pageDistribution: d });
        return;
      }
    }
  };

  return (
    <div data-screen="lv2-step4-review" className="flex h-full min-h-0">
      {/* LEFT — tree / table */}
      <div className="flex w-[260px] shrink-0 flex-col border-r border-border bg-muted/20">
        <ReviewTree plan={plan} selected={selected} onSelectedChange={setSelected} />
      </div>

      {/* RIGHT — tabs + readiness */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* hero: total daily budget — the number that matters before launch */}
        <div className="flex-shrink-0 border-b border-border px-4 pt-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 mb-3">
            <div className="font-mono tabular-nums text-[32px] leading-none font-semibold text-foreground">
              {formatMoney(dailyTotal, sum.currency)}
              <span className="ml-2 text-[13px] font-normal text-muted-foreground">/ day</span>
            </div>
            <div className="mt-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              ~{formatMoney(dailyTotal * 7, sum.currency)} over 7d est.
            </div>
          </div>
        </div>
        {/* header: summary strip + readiness chip */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4">
          <div className="flex flex-wrap items-center gap-y-3">
            <MiniStat label="Accounts" value={sum.accounts} />
            <MiniStat label="Pages" value={sum.pages} />
            <MiniStat label="Campaigns" value={sum.campaigns} />
            <MiniStat label="Ad sets" value={sum.adSets} />
            <MiniStat label="Ads" value={sum.totalAds} sub={`${sum.adsPerDest}/dest`} />
            <MiniStat label="per day" value={formatMoney(sum.budgetPerDay, sum.currency)} />
            <MiniStat
              label={`${flightDays}d est.`}
              value={formatMoney(sum.budgetPerDay * flightDays, sum.currency)}
              last
            />
          </div>
          {/* Flight-days toggle */}
          <div className="flex items-center gap-0.5 self-end">
            <span className="mr-1 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide">Est.</span>
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFlightDays(d)}
                className={cn(
                  "fab-focus rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors",
                  flightDays === d
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setTab("issues")}
                  className="outline-none"
                  aria-label="Launch readiness"
                >
                  <ReadinessChip level={ready.level} score={ready.score} label={ready.label} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {ready.errors > 0
                  ? `${ready.errors} blocking ${ready.errors === 1 ? "issue" : "issues"} must be fixed before launch.`
                  : ready.warnings > 0
                    ? `${ready.warnings} ${ready.warnings === 1 ? "warning" : "warnings"} — you can still launch.`
                    : "All checks pass. Launch from the footer."}
                {" "}Click to open Issues.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as RightTab)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-shrink-0 px-4 pt-3">
            <TabsList className="grid w-full grid-cols-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* 7.6: was `disabled` + `pointer-events-none`, which made the
                       trigger un-focusable so screen-reader users never got the
                       tooltip explaining WHY it was disabled. Now we use
                       `aria-disabled` so the tab stays focusable + announceable,
                       and we describe it via `aria-describedby`. Clicks are a
                       no-op via the onClick guard on TabsTrigger; pointer-events
                       stay enabled so the tooltip still appears on hover. */}
                    <TabsTrigger
                      value="edit"
                      aria-disabled={selected.size === 0}
                      aria-describedby={selected.size === 0 ? "lv2-edit-tab-hint" : undefined}
                      onClick={(e) => {
                        if (selected.size === 0) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className={cn(
                        "w-full",
                        selected.size === 0 && "cursor-not-allowed opacity-60",
                      )}
                    >
                      Edit
                    </TabsTrigger>
                  </TooltipTrigger>
                  {selected.size === 0 && (
                    <TooltipContent id="lv2-edit-tab-hint" side="bottom">
                      Select an item in the tree to edit
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="issues" className="relative">
                Issues
                {issues.length > 0 && (
                  <span
                    className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums text-white"
                    style={{
                      backgroundColor: ready.errors > 0 ? "var(--color-error, #ff4d4f)" : ready.warnings > 0 ? "var(--color-warning, #faad14)" : "var(--color-border)",
                      color: ready.errors > 0 || ready.warnings > 0 ? "white" : "var(--color-text-secondary)",
                    }}
                  >
                    {issues.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* panes — only the active one mounts (each owns its scroll) */}
          <div className="min-h-0 flex-1">
            {tab === "edit" && <EditPane flow={flow} selected={selected} />}
            {tab === "preview" && <PreviewPane plan={plan} selected={selected} />}
            {tab === "issues" && <IssuesPane issues={issues} onApplyFix={applyFix} onAutoFix={autoFix} />}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
