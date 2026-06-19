/**
 * Step 4 — Review & Launch (the Meta master-detail finale).
 *
 *   [ TREE RAIL ] [ EDIT PANE + OVERVIEW (center) ] [ PREVIEW RAIL (right) ]
 *
 * The review tree is an EDITABLE master-detail surface with MULTI-SELECT:
 * selecting node(s) in the colour-coded rail loads their COMMON settings into
 * the center edit pane. The center header carries a stat strip, the launch
 * breakdown table, and a collapsible issues region (auto-expands when issues
 * grow). The right column is an always-open, node-aware FB feed preview rail.
 *
 * A persistent launch-readiness chip lives in the header (click → toggles the
 * issues region). The actual Launch button is in the orchestrator footer. Reads
 * the frozen contract (deriveV2 / reducer via reviewModel + nodeOverrides) and
 * writes via flow.patch.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PageDistribution } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import { formatMoney } from "@/launch2/utils/time";
import {
  buildIssues,
  buildReviewTree,
  capCheckResolved,
  flattenAllNodes,
  nodeKindFromId,
  readiness,
  reviewSummary,
  type ReviewIssue,
  type TreeNode,
} from "../review/reviewModel";
import { capCheck } from "../../deriveV2";
import { runPreflight } from "../../preflight";
import { MiniStat, ReadinessChip } from "../review/reviewParts";
import { NodeTreeRail } from "../review/NodeTreeRail";
import { ReviewFiltersPopover, type FilterKind } from "../review/ReviewFiltersPopover";
import { NodeEditPane } from "../review/NodeEditPane";
import { IssuesList } from "../review/ReviewPanes";
import { PlacementPreviewTabs } from "../review/PlacementPreviewTabs";
import { NomenclatureBuilder } from "../review/NomenclatureBuilder";
import { useLaunchV2, useRehydratedRunId } from "../../state/LaunchV2Context";
import { computePlanHash } from "../../services/mockLaunchV2";

export default function Step4Review({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [flightDays, setFlightDays] = useState<7 | 14 | 30>(7);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [namingOpen, setNamingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKind, setFilterKind] = useState<FilterKind>("all");
  const { toast } = useToast();

  // Stale-detection: compare the rehydrated run's planHash against the current
  // plan on mount. The context calls rehydrateFromStorage() without a plan arg,
  // so the stale path is dead there. Step4Review has the plan in scope — we do
  // the check here, once, on first render.
  const service = useLaunchV2();
  const rehydratedRunId = useRehydratedRunId();
  const staleChecked = useRef(false);
  useEffect(() => {
    if (staleChecked.current || !rehydratedRunId) return;
    staleChecked.current = true;
    const run = service.getRun(rehydratedRunId);
    if (!run || run.planHash === undefined) return;
    const currentHash = computePlanHash(plan);
    if (currentHash !== run.planHash) {
      service.markRunStale(rehydratedRunId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rehydratedRunId]);

  const tree = useMemo(() => buildReviewTree(plan), [plan]);
  const allNodes = useMemo(() => flattenAllNodes(tree), [tree]);

  // DEFAULT / RECOVER SELECTION — never leave the pane empty: if nothing valid
  // is selected, fall back to the first node (the first account).
  useEffect(() => {
    const stillValid = selectedIds.filter((id) => allNodes.some((n) => n.id === id));
    if (stillValid.length === 0) {
      const first = allNodes[0]?.id;
      if (first) setSelectedIds([first]);
    } else if (stillValid.length !== selectedIds.length) {
      setSelectedIds(stillValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNodes]);

  const selectedNodes = useMemo(
    () =>
      selectedIds
        .map((id) => allNodes.find((n) => n.id === id))
        .filter((n): n is TreeNode => Boolean(n)),
    [selectedIds, allNodes],
  );
  // Node that drives the preview rail (first of the current selection).
  const previewNode: TreeNode | null = selectedNodes[0] ?? null;

  /**
   * Selection handler shared with the tree rail.
   * - additive (shift/cmd) → toggle, but only same-level multi-select; switching
   *   kinds replaces the whole selection with just [id].
   * - non-additive → single select.
   */
  const handleSelect = (id: string, additive: boolean) => {
    if (!additive) {
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((prev) => {
      if (prev.length === 0) return [id];
      const newKind = nodeKindFromId(id);
      const currentKind = nodeKindFromId(prev[0]);
      if (newKind !== currentKind) return [id]; // cross-level → replace
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  /**
   * Checkbox multi-select handler.
   * `add=true`  → union: add ids that aren't already selected.
   * `add=false` → remove: drop all ids in the list from selection.
   * Mixed-kind subtrees (account checkbox selects campaigns/adsets/ads) are
   * allowed here — checkbox selection is cross-level by design.
   */
  const handleMultiSelect = (ids: string[], add: boolean) => {
    setSelectedIds((prev) => {
      if (add) {
        const existing = new Set(prev);
        const toAdd = ids.filter((id) => !existing.has(id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      } else {
        const toRemove = new Set(ids);
        const next = prev.filter((id) => !toRemove.has(id));
        return next.length !== prev.length ? next : prev;
      }
    });
  };

  /** Inline rename handler for NodeTreeRail — writes to nodeOverrides. */
  const handleRename = (id: string, nameField: string, value: string) => {
    const current = plan.nodeOverrides ?? {};
    flow.patch({
      nodeOverrides: {
        ...current,
        [id]: { ...(current[id] ?? {}), [nameField]: value },
      },
    });
  };

  const issues = useMemo(() => buildIssues(plan), [plan]);
  const ready = useMemo(() => readiness(issues), [issues]);
  const preflightIssues = useMemo(() => runPreflight(plan), [plan]);
  const preflightBlocked = preflightIssues.some((i) => i.tier === "error");
  const [prevErrors, setPrevErrors] = useState<number>(ready.errors);
  useEffect(() => {
    if (ready.errors < prevErrors) {
      const fixed = prevErrors - ready.errors;
      toast({
        title: `${fixed} ${fixed === 1 ? "issue" : "issues"} resolved`,
        duration: 2500,
      });
    }
    setPrevErrors(ready.errors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.errors]);

  // Footer "blockers" pill (in LaunchV2Flow) dispatches this → open issues.
  useEffect(() => {
    const handler = () => setIssuesOpen(true);
    window.addEventListener("lv2:open-issues-tab", handler);
    return () => window.removeEventListener("lv2:open-issues-tab", handler);
  }, []);

  // AUTO-EXPAND the issues region whenever the total issue count increases.
  const [prevIssueCount, setPrevIssueCount] = useState<number>(issues.length);
  useEffect(() => {
    if (issues.length > prevIssueCount) setIssuesOpen(true);
    setPrevIssueCount(issues.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues.length]);

  const sum = useMemo(() => reviewSummary(plan), [plan]);

  /**
   * Task 3 — cap-divergence note.
   *
   * Show a small muted line when the Step 4 override-aware cap differs from
   * the formula baseline used in Step 3. Two ways this can happen:
   *   1. Any nodeOverrides bag contains an "adsPerAdSet" key (per-adset override).
   *   2. The offender sets from capCheck (formula) vs capCheckResolved (actual)
   *      have different membership.
   *
   * We check condition 1 first (cheap) and fall back to condition 2 (needs
   * both derivations) only when no per-adset override is present.
   */
  const showCapDivergenceNote = useMemo(() => {
    // Condition 1 — any per-adset adsPerAdSet override present?
    const hasAdSetCountOverride = Object.values(plan.nodeOverrides ?? {}).some(
      (bag) => bag && Object.prototype.hasOwnProperty.call(bag, "adsPerAdSet"),
    );
    if (hasAdSetCountOverride) return true;

    // Condition 2 — offender page ids differ between formula and resolved?
    const formulaOffenderIds = new Set(
      capCheck(plan).offenders.map((p) => p.fbPageId),
    );
    const resolvedOffenderIds = new Set(
      capCheckResolved(plan).offenders.map((p) => p.fbPageId),
    );
    if (formulaOffenderIds.size !== resolvedOffenderIds.size) return true;
    for (const id of formulaOffenderIds) {
      if (!resolvedOffenderIds.has(id)) return true;
    }
    return false;
  }, [plan]);

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

  // Total visible issue count includes preflight issues (shown in same panel).
  const totalIssueCount = issues.length + preflightIssues.length;
  const hasAnyErrors = ready.errors > 0 || preflightBlocked;

  // Issues count badge color (errors red / warnings amber / else neutral).
  const issueBadgeStyle = {
    backgroundColor:
      hasAnyErrors
        ? "var(--color-error, #ff4d4f)"
        : ready.warnings > 0
          ? "var(--color-warning, #faad14)"
          : "var(--color-border)",
    color: hasAnyErrors || ready.warnings > 0 ? "white" : "var(--color-text-secondary)",
  };

  return (
    <div data-screen="lv2-step4-review" className="flex h-full min-h-0 flex-col">
      {/* HEADER */}
      <div className="flex shrink-0 items-center border-b border-border bg-background px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
          Review
        </span>
      </div>

      {/* MAIN */}
      <div className="flex min-h-0 flex-1">
        <>
      {/* LEFT — colour-coded tree rail (master, multi-select). */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-border bg-muted/20">
        <div className="shrink-0 border-b border-border">
          <ReviewFiltersPopover
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterKind={filterKind}
            onFilterKindChange={setFilterKind}
          />
        </div>
        <NodeTreeRail
          plan={plan}
          tree={tree}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onMultiSelect={handleMultiSelect}
          onRename={handleRename}
          highlightQuery={searchQuery}
          filterKind={filterKind}
        />
      </div>

      {/* CENTER — overview (stats + breakdown + issues) over the edit pane. */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        {/* OVERVIEW region */}
        <div className="flex flex-shrink-0 flex-col gap-4 border-b border-border px-4 py-4">
          {/* stat strip + flight toggle + readiness chip */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-y-3">
              <MiniStat label="Accounts" value={sum.accounts} />
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
                    onClick={() => setIssuesOpen((o) => !o)}
                    className="outline-none"
                    aria-label="Launch readiness"
                  >
                    <ReadinessChip level={ready.level} score={ready.score} label={ready.label} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {hasAnyErrors
                    ? `Fix ${ready.errors + preflightIssues.filter((i) => i.tier === "error").length} blocking issue${(ready.errors + preflightIssues.filter((i) => i.tier === "error").length) === 1 ? "" : "s"} to launch.`
                    : ready.warnings > 0
                      ? `${ready.warnings} ${ready.warnings === 1 ? "warning" : "warnings"} — you can still launch.`
                      : "Ready to launch."}
                  {" "}Click to {issuesOpen ? "hide" : "show"} issues.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Collapsible issues region — collapsed by default, auto-expands on growth. */}
          <div data-lv2-issues-tab className="rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => setIssuesOpen((o) => !o)}
              aria-expanded={issuesOpen}
              className="fab-focus flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left hover:bg-muted/40"
            >
              <span className="flex items-center gap-2">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    issuesOpen ? "rotate-0" : "-rotate-90",
                  )}
                />
                <span className="text-[13px] font-medium text-foreground">Issues</span>
                <span
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums"
                  style={issueBadgeStyle}
                >
                  {totalIssueCount}
                </span>
              </span>
              {!issuesOpen && totalIssueCount > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {hasAnyErrors
                    ? `${ready.errors + preflightIssues.filter((i) => i.tier === "error").length} blocking`
                    : ready.warnings > 0
                      ? `${ready.warnings} warning${ready.warnings === 1 ? "" : "s"}`
                      : "review"}
                </span>
              )}
            </button>
            {issuesOpen && (
              <div className="border-t border-border px-3 py-3">
                {preflightIssues.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Pre-launch checks
                    </p>
                    <IssuesList issues={preflightIssues} onApplyFix={() => {}} onAutoFix={() => {}} />
                  </div>
                )}
                {issues.length > 0 && (
                  <>
                    {preflightIssues.length > 0 && (
                      <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Campaign checks
                      </p>
                    )}
                    <IssuesList issues={issues} onApplyFix={applyFix} onAutoFix={autoFix} />
                  </>
                )}
                {preflightIssues.length === 0 && issues.length === 0 && (
                  <p className="text-[13px] text-muted-foreground">No issues.</p>
                )}
              </div>
            )}
          </div>

          {/* Cap-divergence note — shown only when per-adset overrides make
              the Step 4 cap status differ from the Setup step formula. */}
          {showCapDivergenceNote && (
            <p className="font-mono text-[11px] text-muted-foreground">
              Cap reflects your per-ad-set overrides — may differ from the Setup step.
            </p>
          )}
        </div>

        {/* Naming — collapsible nomenclature token builder (D27) */}
        <div className="shrink-0 border-b border-border px-4 py-2">
          <div className="rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => setNamingOpen((o) => !o)}
              aria-expanded={namingOpen}
              className="fab-focus flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left hover:bg-muted/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    namingOpen ? "rotate-0" : "-rotate-90",
                  )}
                />
                <span className="text-[13px] font-medium text-foreground">Naming</span>
              </span>
            </button>
            {namingOpen && (
              <div className="border-t border-border px-3 py-3">
                <NomenclatureBuilder flow={flow} />
              </div>
            )}
          </div>
        </div>

        {/* edit pane (detail) — multi-select aware */}
        <div className="min-h-0 flex-1">
          <NodeEditPane flow={flow} nodes={selectedNodes} />
        </div>

        {/* Bulk-selection footer — visible when 2+ nodes are selected */}
        {selectedIds.length > 1 && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-primary/5 px-4 py-2">
            <span className="font-mono text-[11px] font-semibold text-primary">
              {selectedIds.length} nodes selected — editing all simultaneously
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(selectedIds.slice(0, 1))}
              className="fab-focus inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear bulk selection"
            >
              <X className="h-3 w-3" />
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* RIGHT — always-open, node-aware preview rail with placement tabs (D25). */}
      <div className="flex w-[380px] shrink-0 flex-col border-l border-border">
        <div className="shrink-0 border-b border-border px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
            Ad Preview
          </span>
        </div>
        <div className="min-h-0 flex-1">
          <PlacementPreviewTabs plan={plan} node={previewNode} />
        </div>
      </div>
        </>
      </div>{/* end MAIN */}
    </div>
  );
}
