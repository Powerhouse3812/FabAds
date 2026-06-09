/**
 * Step4ReviewV2 — "Control Room" redesign of the Review & Launch screen.
 *
 * Design philosophy:
 *   • Readiness-first: the chip is the hero, not a trailing footnote.
 *   • Reduced-prominence tree (240px) — structural context, not primary UI.
 *   • "Override" tab replaces "Edit" — semantically correct last-minute intent.
 *   • Issues tab hidden when 0 issues (replaced by inline "All clear" indicator).
 *   • KPI strip: full-width, generous tiles, Geist Mono numbers.
 *   • Launch-readiness visible in right-panel header before scrolling to footer.
 *   • Default tab: Preview.
 */
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Rocket,
  Zap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PageDistribution } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import { formatMoney } from "@/launch2/utils/time";
import {
  buildIssues,
  readiness,
  reviewSummary,
  type ReviewIssue,
} from "../review/reviewModel";
import { ReadinessChip } from "../review/reviewParts";
import { ReviewTree } from "../review/ReviewTree";
import {
  DistributionPane,
  IssuesPane,
  PreviewPane,
} from "../review/ReviewPanes";
import { EditPane } from "../review/ReviewPanes";

/* ── Tab type (Distribution stays but renamed slot) ─────────────────── */
type RightTab = "override" | "distribution" | "preview" | "issues";

/* ── KPI tile ───────────────────────────────────────────────────────── */
function KpiTile({
  value,
  label,
  sub,
  last,
}: {
  value: React.ReactNode;
  label: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[80px] flex-col justify-center gap-1 px-6 py-4",
        !last && "border-r border-border",
      )}
    >
      <span className="font-mono text-[22px] font-semibold tabular-nums leading-none tracking-tight text-foreground">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground/70">
        {label}
        {sub && <span className="normal-case tracking-normal text-muted-foreground/50"> · {sub}</span>}
      </span>
    </div>
  );
}

/* ── Inline "All clear" indicator shown instead of Issues tab ─────── */
function AllClearBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em]"
      style={{ color: "#237804", backgroundColor: "rgba(82,196,26,0.12)" }}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      All clear
    </span>
  );
}

/* ── Right panel header with launch-readiness preview ───────────────── */
function RightPanelHeader({
  ready,
  issues,
  selectedSize,
  onOpenIssues,
}: {
  ready: ReturnType<typeof readiness>;
  issues: ReviewIssue[];
  selectedSize: number;
  onOpenIssues: () => void;
}) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/10 px-4 py-2.5">
      {/* Left: readiness chip — the primary signal */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenIssues}
              className="outline-none"
              aria-label="Launch readiness"
            >
              <ReadinessChip
                level={ready.level}
                score={ready.score}
                label={ready.label}
                className="text-sm font-semibold"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {ready.errors > 0
              ? `${ready.errors} blocking ${ready.errors === 1 ? "issue" : "issues"} must be fixed before launch.`
              : ready.warnings > 0
                ? `${ready.warnings} ${ready.warnings === 1 ? "warning" : "warnings"} — you can still launch.`
                : "All checks pass. Use the footer button to ship."}
            {issues.length > 0 && " Click to open Issues."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Right: launch-ready signal + selection hint */}
      <div className="flex items-center gap-2.5">
        {selectedSize > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-foreground"
            style={{ color: "var(--color-primary-text, #5B7611)" }}
          >
            <Layers className="h-3 w-3" />
            {selectedSize} selected
          </span>
        )}
        {ready.level === "ready" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.04em]"
            style={{ color: "#237804", backgroundColor: "rgba(82,196,26,0.12)" }}
          >
            <Rocket className="h-3 w-3" />
            Ready
          </span>
        ) : ready.level === "review" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.04em]"
            style={{ color: "#874d00", backgroundColor: "rgba(250,173,20,0.12)" }}
          >
            <AlertTriangle className="h-3 w-3" />
            Review
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.04em]"
            style={{ color: "#cf1322", backgroundColor: "rgba(255,77,79,0.10)" }}
          >
            <Zap className="h-3 w-3" />
            Blocked
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Step4ReviewV2 — the full screen
═══════════════════════════════════════════════════════════════════════ */
export default function Step4ReviewV2({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<RightTab>("preview");

  const issues = useMemo(() => buildIssues(plan), [plan]);
  const ready = useMemo(() => readiness(issues), [issues]);
  const sum = useMemo(() => reviewSummary(plan), [plan]);

  const hasIssues = issues.length > 0;

  /* When selection clears while Override is open → fall back to Preview */
  useEffect(() => {
    if (selected.size === 0 && tab === "override") {
      setTab("preview");
    }
  }, [selected.size, tab]);

  /* When Issues appear mid-session, don't force-jump the user */
  const activeTab = (!hasIssues && tab === "issues") ? "preview" : tab;

  const applyFix = (issue: ReviewIssue) => {
    if (issue.fix?.kind === "switch_distribution" && issue.fix.distribution) {
      flow.patch({ pageDistribution: issue.fix.distribution });
    }
  };

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

  /* Tab count: 3 without Issues (all-clear) or 4 with */
  const tabCols = hasIssues ? 4 : 3;

  return (
    <div data-screen="lv2-step5-review-v2" className="flex h-full min-h-0">

      {/* ── LEFT: Reduced-prominence tree ─────────────────────────── */}
      <div className="flex w-[240px] shrink-0 flex-col border-r border-border bg-muted/10">
        <ReviewTree plan={plan} selected={selected} onSelectedChange={setSelected} />
      </div>

      {/* ── RIGHT: Control panel ──────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* KPI strip — full-width, 64px tall, each stat in a tile */}
        <div className="flex flex-shrink-0 items-stretch border-b border-border bg-muted/5">
          <KpiTile
            value={sum.campaigns}
            label="Campaigns"
          />
          <KpiTile
            value={sum.adSets}
            label="Ad sets"
          />
          <KpiTile
            value={sum.totalAds}
            label="Ads"
            sub={`${sum.adsPerDest} / dest`}
          />
          <KpiTile
            value={formatMoney(sum.budgetPerDay, sum.currency)}
            label="Budget / day"
            last
          />
        </div>

        {/* Right panel sub-header: readiness chip + inline launch state */}
        <RightPanelHeader
          ready={ready}
          issues={issues}
          selectedSize={selected.size}
          onOpenIssues={() => {
            if (hasIssues) setTab("issues");
          }}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setTab(v as RightTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-shrink-0 items-center justify-between gap-3 px-4 pt-3">
            <TabsList className={cn("grid", tabCols === 4 ? "grid-cols-4" : "grid-cols-3", "flex-1")}>
              {/* Override (was "Edit") — tooltip when nothing selected */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={selected.size === 0 ? "cursor-not-allowed" : undefined}>
                      <TabsTrigger
                        value="override"
                        disabled={selected.size === 0}
                        className="w-full"
                        style={selected.size === 0 ? { pointerEvents: "none" } : undefined}
                      >
                        Override
                      </TabsTrigger>
                    </span>
                  </TooltipTrigger>
                  {selected.size === 0 && (
                    <TooltipContent side="bottom">
                      Select an item in the tree to override its values
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>

              {/* Issues tab: only shown when there are issues */}
              {hasIssues && (
                <TabsTrigger value="issues" className="relative">
                  Issues
                  <span
                    className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums"
                    style={{
                      backgroundColor: ready.errors > 0
                        ? "rgba(255,77,79,1)"
                        : "rgba(250,173,20,1)",
                      color: "white",
                    }}
                  >
                    {issues.length}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* "All clear" replaces the Issues tab slot when no issues */}
            {!hasIssues && (
              <AllClearBadge />
            )}
          </div>

          {/* Pane area */}
          <div className="min-h-0 flex-1">
            {activeTab === "override" && (
              <EditPane flow={flow} selected={selected} />
            )}
            {activeTab === "distribution" && (
              <DistributionPane flow={flow} />
            )}
            {activeTab === "preview" && (
              <PreviewPane plan={plan} selected={selected} />
            )}
            {activeTab === "issues" && hasIssues && (
              <IssuesPane issues={issues} onApplyFix={applyFix} onAutoFix={autoFix} />
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
