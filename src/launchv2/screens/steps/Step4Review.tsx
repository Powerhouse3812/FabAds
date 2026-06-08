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
import { DistributionPane, EditPane, IssuesPane, PreviewPane } from "../review/ReviewPanes";

type RightTab = "edit" | "distribution" | "preview" | "issues";

export default function Step4Review({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<RightTab>("preview");

  // When selection is cleared while Edit tab is open → fall back to Preview
  useEffect(() => {
    if (selected.size === 0) {
      setTab((prev) => (prev === "edit" ? "preview" : prev));
    }
  }, [selected.size]);

  const issues = useMemo(() => buildIssues(plan), [plan]);
  const ready = useMemo(() => readiness(issues), [issues]);
  const sum = useMemo(() => reviewSummary(plan), [plan]);

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
      <div className="flex w-[340px] shrink-0 flex-col border-r border-border bg-muted/20">
        <ReviewTree plan={plan} selected={selected} onSelectedChange={setSelected} />
      </div>

      {/* RIGHT — tabs + readiness */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header: summary strip + readiness chip */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <MiniStat label="Campaigns" value={sum.campaigns} />
            <MiniStat label="Ad sets" value={sum.adSets} />
            <MiniStat label="Ads" value={sum.totalAds} sub={`${sum.adsPerDest}/dest`} />
            <MiniStat label="Budget/day" value={formatMoney(sum.budgetPerDay, sum.currency)} />
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="edit" disabled={selected.size === 0}>Edit</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="issues" className="relative">
                Issues
                {issues.length > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums",
                      ready.errors > 0 ? "bg-[#ff4d4f] text-white" : ready.warnings > 0 ? "bg-[#faad14] text-white" : "bg-muted text-muted-foreground",
                    )}
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
            {tab === "distribution" && <DistributionPane flow={flow} />}
            {tab === "preview" && <PreviewPane plan={plan} selected={selected} />}
            {tab === "issues" && <IssuesPane issues={issues} onApplyFix={applyFix} onAutoFix={autoFix} />}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
