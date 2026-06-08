/**
 * ReviewPanes — the right pane of Step 4's Meta two-pane review. Four tabs:
 *   Edit         — fields of the selected node (bulk hint when multi-select)
 *   Distribution — ad→Page axis: fill-first / equal / duplicate + 250-cap math
 *   Preview       — a Meta-style ad-preview mockup of the selected/first ad
 *   Issues        — 3-tier error→fix list, each with a 1-click recommended fix
 *
 * Edits route through `flow.patch` (frozen contract). Distribution writes
 * `pageDistribution`; the Issues fixes call into the supplied `onApplyFix`.
 */
import { useMemo } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Layers,
  Megaphone,
  PlayCircle,
  ThumbsUp,
  Wand2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { BidStrategy, BudgetMode, PageDistribution, PlanV2 } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import { BID_LABELS, getTemplate } from "../../data";
import { perPageDemand } from "../../deriveV2";
import { formatMoney } from "@/launch2/utils/time";
import {
  buildReviewTree,
  flattenAllNodes,
  nodeKindFromId,
  reviewSummary,
  type IssueFixKind,
  type ReviewIssue,
  type TreeNode,
} from "./reviewModel";
import {
  CapMeter,
  ctaLabel,
  ERR,
  ERR_TEXT,
  FieldRow,
  OK_TEXT,
  WARN,
  WARN_TEXT,
} from "./reviewParts";

/* ------------------------------------------------------------------ */
/*  EDIT pane — context-aware per selected node kind                   */
/* ------------------------------------------------------------------ */
export function EditPane({ flow, selected }: { flow: UseFlowV2; selected: Set<string> }) {
  const { plan } = flow;
  const tree = useMemo(() => buildReviewTree(plan), [plan]);
  const allNodes = useMemo(() => flattenAllNodes(tree), [tree]);
  const selectedNodes = useMemo(
    () =>
      [...selected]
        .map((id) => allNodes.find((n) => n.id === id))
        .filter((n): n is TreeNode => Boolean(n)),
    [selected, allNodes],
  );

  const multi = selected.size > 1;
  const firstId = [...selected][0];
  const kind = nodeKindFromId(firstId);
  const N = selected.size;
  const kindLabel = kind ?? "node";

  /** Collect stringified values of a field from every selected node. */
  const vals = (
    getter: (n: TreeNode) => string | number | boolean | undefined | null,
  ): string[] => selectedNodes.map((n) => String(getter(n) ?? ""));

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-4">

        {/* Bulk-edit banner */}
        {multi && (
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs text-foreground">
            <Layers className="h-4 w-4 text-primary" />
            {N} {kindLabel}s selected — edits apply to all.
          </div>
        )}

        {/* Safety fallback */}
        {!selected.size && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Select a node in the tree to edit its fields.
          </p>
        )}

        {/* ── Account ─────────────────────────────────────────────── */}
        {kind === "account" && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <SectionHead icon={Building2} label="Account" />
              <EditInput
                label="Destinations"
                values={[String(plan.targets.length)]}
                type="number"
                count={N}
                kind={kindLabel}
                onChange={() => {}}
              />
              <EditInput
                label="Pages"
                values={[plan.targets.map((t) => t.pageName).join(", ")]}
                count={N}
                kind={kindLabel}
                onChange={() => {}}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Campaign ────────────────────────────────────────────── */}
        {kind === "campaign" && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <SectionHead icon={Megaphone} label="Campaign" />
              <EditSelect
                label="Budget mode"
                values={vals((n) => n.fields?.budgetMode ?? plan.budgetMode)}
                options={[
                  { value: "CBO", label: "CBO — Campaign Budget" },
                  { value: "ABO", label: "ABO — Ad Set Budget" },
                ]}
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ budgetMode: v as BudgetMode })}
              />
              <EditInput
                label="Daily budget"
                values={vals((n) => n.fields?.budgetAmount ?? plan.budgetAmount)}
                type="number"
                placeholder="0"
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ budgetAmount: Number(v) })}
              />
              <EditSelect
                label="Bid strategy"
                values={vals((n) => n.fields?.bidStrategy ?? plan.bidStrategy)}
                options={Object.entries(BID_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ bidStrategy: v as BidStrategy })}
              />
              <EditToggle
                label="Advantage+"
                values={vals((n) => n.fields?.advantagePlus ?? plan.advantagePlus)}
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ advantagePlus: v })}
              />
              <EditToggle
                label="A/B test"
                values={vals((n) => n.fields?.abTest ?? plan.abTest)}
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ abTest: v })}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Ad set ──────────────────────────────────────────────── */}
        {kind === "adset" && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <SectionHead icon={Layers} label="Ad set" />
              <EditInput
                label="Optimization goal"
                values={vals((n) =>
                  (n.fields?.optimizationGoal ?? plan.optimizationGoal ?? "")
                    .toString()
                    .replace(/_/g, " ")
                    .toLowerCase(),
                )}
                placeholder="e.g. conversions"
                count={N}
                kind={kindLabel}
                onChange={() => {}} // cascade-locked — demo only
              />
              <EditInput
                label="Audience"
                values={vals((n) => n.fields?.audienceName ?? "")}
                placeholder="Audience name"
                count={N}
                kind={kindLabel}
                onChange={() => {}} // demo audience names — no direct PlanV2 field
              />
              <EditSelect
                label="Placements"
                values={vals((n) =>
                  n.fields?.placements ??
                  (plan.advantagePlus ? "Automatic" : "Manual — Feed + Stories"),
                )}
                options={[
                  { value: "Automatic", label: "Automatic placements" },
                  { value: "Manual — Feed + Stories", label: "Manual — Feed + Stories" },
                ]}
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ advantagePlus: v === "Automatic" })}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Ad (leaf) — editable copy fields ────────────────────── */}
        {kind === "ad" && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <SectionHead icon={ImageIcon} label="Ad copy" />
              <EditInput
                label="Primary text"
                values={vals((n) => n.fields?.primaryText ?? plan.adCopy.primaryText)}
                placeholder="Write a hook…"
                multiline
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ adCopy: { ...plan.adCopy, primaryText: v } })}
              />
              <EditInput
                label="Headline"
                values={vals((n) => n.fields?.headline ?? plan.adCopy.headline)}
                placeholder="Headline"
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ adCopy: { ...plan.adCopy, headline: v } })}
              />
              <EditInput
                label="Description"
                values={vals((n) => n.fields?.description ?? plan.adCopy.description)}
                placeholder="Description"
                count={N}
                kind={kindLabel}
                onChange={(v) => flow.patch({ adCopy: { ...plan.adCopy, description: v } })}
              />
              <div className="grid grid-cols-2 gap-3">
                <EditInput
                  label="CTA"
                  values={vals((n) => n.fields?.cta ?? plan.adCopy.cta)}
                  placeholder="CTA"
                  count={N}
                  kind={kindLabel}
                  onChange={(v) => flow.patch({ adCopy: { ...plan.adCopy, cta: v } })}
                />
                <EditInput
                  label="Destination URL"
                  values={vals((n) => n.fields?.destinationUrl ?? plan.adCopy.destinationUrl)}
                  placeholder="https://…"
                  count={N}
                  kind={kindLabel}
                  onChange={(v) =>
                    flow.patch({ adCopy: { ...plan.adCopy, destinationUrl: v } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

function SectionHead({ icon: Icon, label }: { icon: typeof Layers; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit pane sub-components                                           */
/* ------------------------------------------------------------------ */

/** Amber override warning shown below a Mixed field. */
function MixedWarning({ count, kind }: { count: number; kind: string }) {
  return (
    <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
      Saving will override all {count} {kind}s.
    </p>
  );
}

/** Editable text / number input with mixed-state detection. */
function EditInput({
  label,
  values,
  type = "text",
  multiline,
  placeholder,
  count,
  kind,
  onChange,
}: {
  label: string;
  values: string[];
  type?: "text" | "number";
  multiline?: boolean;
  placeholder?: string;
  count: number;
  kind: string;
  onChange: (v: string) => void;
}) {
  const unique = [...new Set(values.filter((v) => v !== "" && v !== "undefined" && v !== "null"))];
  const isMixed = unique.length > 1;
  const current = isMixed ? "" : (unique[0] ?? "");
  const cls = cn(
    "w-full rounded-lg border bg-background px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/40",
    isMixed
      ? "border-amber-400 dark:border-amber-600 placeholder:text-amber-500 dark:placeholder:text-amber-400"
      : "border-border",
  );
  return (
    <label className="block py-1.5">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={current}
          placeholder={isMixed ? "Mixed" : placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cn(cls, "resize-none")}
        />
      ) : (
        <input
          type={type}
          value={current}
          placeholder={isMixed ? "Mixed" : placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
      {isMixed && count > 1 && <MixedWarning count={count} kind={kind} />}
    </label>
  );
}

/** Editable select dropdown with mixed-state detection. */
function EditSelect({
  label,
  values,
  options,
  count,
  kind,
  onChange,
}: {
  label: string;
  values: string[];
  options: { value: string; label: string }[];
  count: number;
  kind: string;
  onChange: (v: string) => void;
}) {
  const unique = [...new Set(values.filter((v) => v !== "" && v !== "undefined" && v !== "null"))];
  const isMixed = unique.length > 1;
  const current = isMixed ? "" : (unique[0] ?? "");
  return (
    <label className="block py-1.5">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border bg-background px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/40",
          isMixed
            ? "border-amber-400 dark:border-amber-600 text-amber-500 dark:text-amber-400"
            : "border-border",
        )}
      >
        {isMixed && <option value="">Mixed</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isMixed && count > 1 && <MixedWarning count={count} kind={kind} />}
    </label>
  );
}

/** Toggle switch with mixed-state badge. */
function EditToggle({
  label,
  values,
  count,
  kind,
  onChange,
}: {
  label: string;
  values: string[];
  count: number;
  kind: string;
  onChange: (v: boolean) => void;
}) {
  const unique = [...new Set(values.filter((v) => v !== "" && v !== "undefined" && v !== "null"))];
  const isMixed = unique.length > 1;
  const current = !isMixed && unique[0] === "true";
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {isMixed && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Mixed
            </span>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={current}
            onClick={() => onChange(!current)}
            className={cn(
              "relative flex h-5 w-9 items-center rounded-full border transition-colors",
              current ? "border-primary bg-primary" : "border-border bg-muted",
              isMixed && "border-amber-400 dark:border-amber-600",
            )}
          >
            <span
              className={cn(
                "absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                current ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>
      {isMixed && count > 1 && <MixedWarning count={count} kind={kind} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DISTRIBUTION pane                                                  */
/* ------------------------------------------------------------------ */
const DIST_OPTIONS: { id: PageDistribution; label: string; blurb: string }[] = [
  { id: "one_page", label: "One page", blurb: "All ads run under a single page." },
  { id: "fill_first", label: "Fill-first", blurb: "Load each Page to its headroom, then spill to the next. Best for cap safety." },
  { id: "equal", label: "Equal split", blurb: "Spread ads evenly across every Page." },
  { id: "duplicate", label: "Duplicate to all", blurb: "Every Page gets the full set — multiplies spend & ad count." },
];

export function DistributionPane({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const demand = perPageDemand(plan);
  const sum = reviewSummary(plan);
  const activeOpt = DIST_OPTIONS.find((o) => o.id === plan.pageDistribution) ?? DIST_OPTIONS[0];

  const handleEditOnStep4 = () => {
    if (typeof flow.setStep === "function") flow.setStep(4);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-sm font-semibold">Page distribution</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How the {sum.adsPerDest} ads per destination map onto your {plan.targets.length} Page
            {plan.targets.length === 1 ? "" : "s"}. Set on Step 4 Distribution.
          </p>
        </div>

        {/* Read-only summary of the currently-selected distribution mode */}
        <div className="space-y-2">
          <div className="rounded-xl border border-primary bg-primary/10 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{activeOpt.label}</span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{activeOpt.blurb}</p>
          </div>
          <button
            type="button"
            onClick={handleEditOnStep4}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Edit on Step 4 Distribution →
          </button>
        </div>

        <Separator />

        {/* Per-page cap math + headroom */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground">Per-Page cap (250 max)</h4>
          {demand.length === 0 ? (
            <p className="text-xs text-muted-foreground">No destinations yet.</p>
          ) : (
            demand.map((p) => (
              <div key={p.fbPageId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{p.pageName}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{p.accountName}</div>
                  </div>
                  {p.over && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ color: ERR_TEXT, backgroundColor: "rgba(255,77,79,0.12)" }}
                    >
                      <AlertTriangle className="h-3 w-3" /> Over cap
                    </span>
                  )}
                </div>
                <CapMeter current={p.current} demand={p.demand} />
              </div>
            ))
          )}
        </div>

        <Separator />
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Total ads requested</span>
          <span className="font-mono font-semibold tabular-nums">{sum.totalAds}</span>
        </div>
      </div>
    </ScrollArea>
  );
}

/* ------------------------------------------------------------------ */
/*  PREVIEW pane — Meta-style ad mockup                                */
/* ------------------------------------------------------------------ */
export function PreviewPane({ plan, selected }: { plan: PlanV2; selected: Set<string> }) {
  const tree = buildReviewTree(plan);
  // find the selected ad leaf, else first ad in the tree
  const allAds = tree.flatMap((a) => a.children ?? []).flatMap((c) => c.children ?? []).flatMap((s) => s.children ?? []);
  const selId = [...selected].find((id) => allAds.some((a) => a.id === id && !a.summary));
  const ad = allAds.find((a) => a.id === selId && !a.summary) ?? allAds.find((a) => !a.summary);
  const creative = plan.creatives.find((c) => c.id === ad?.creativeId) ?? plan.creatives[0];
  const target = plan.targets[ad?.targetIndex ?? 0] ?? plan.targets[0];
  const copy = plan.adCopy;
  const isVideo = creative?.format === "single_video";
  const isCarousel = creative?.format === "carousel";

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col items-center gap-3 p-4">
        <p className="self-start text-xs text-muted-foreground">Facebook feed preview · representative</p>
        <div className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold leading-tight">{target?.pageName ?? "Your Page"}</div>
              <div className="text-[10px] text-muted-foreground">Sponsored · {creative?.name ? creative.format.replace(/_/g, " ") : "Ad"}</div>
            </div>
          </div>
          {/* primary text */}
          {copy.primaryText ? (
            <p className="px-3 pb-2 text-[13px] leading-snug">{copy.primaryText}</p>
          ) : (
            <p className="px-3 pb-2 text-[13px] italic leading-snug text-muted-foreground">Your primary text appears here.</p>
          )}
          {/* media */}
          <div className="relative aspect-square w-full bg-muted">
            {creative?.thumbnail ? (
              <img src={creative.thumbnail} alt={creative.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                {isVideo ? <PlayCircle className="h-9 w-9" /> : <ImageIcon className="h-9 w-9" />}
                <span className="px-6 text-center text-[11px]">{creative?.name ?? "Creative"}</span>
              </div>
            )}
            {isCarousel && (
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-card" : "bg-card/50")} />
                ))}
              </div>
            )}
          </div>
          {/* link card */}
          <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                {copy.displayLink || displayHost(copy.destinationUrl) || "yourbrand.com"}
              </div>
              <div className="truncate text-[13px] font-semibold leading-tight">
                {copy.headline || "Your headline goes here"}
              </div>
              {copy.description && (
                <div className="truncate text-[11px] text-muted-foreground">{copy.description}</div>
              )}
            </div>
            <span className="shrink-0 rounded-md bg-foreground/[0.08] px-2.5 py-1.5 text-[11px] font-semibold">
              {ctaLabel(copy.cta)}
            </span>
          </div>
          {/* engagement row */}
          <div className="flex items-center gap-4 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Like</span>
            <span>Comment</span>
            <span>Share</span>
          </div>
        </div>
        {creative && (
          <p className="text-[11px] text-muted-foreground">
            Showing <span className="font-medium text-foreground">{creative.name}</span>
            {target ? <> on {target.pageName}</> : null}
          </p>
        )}
      </div>
    </ScrollArea>
  );
}

function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/*  ISSUES pane — 3-tier error→fix                                     */
/* ------------------------------------------------------------------ */
export function IssuesPane({
  issues,
  onApplyFix,
  onAutoFix,
}: {
  issues: ReviewIssue[];
  onApplyFix: (issue: ReviewIssue) => void;
  onAutoFix: () => void;
}) {
  const errors = issues.filter((i) => i.tier === "error");
  const warnings = issues.filter((i) => i.tier === "warning");
  const infos = issues.filter((i) => i.tier === "info");
  const fixable = issues.filter((i) => i.fix && i.fix.kind === "switch_distribution");

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card px-4 py-10 text-center">
            <CheckCircle2 className="h-7 w-7" style={{ color: OK_TEXT }} />
            <p className="text-sm font-medium">No issues — clear to launch</p>
            <p className="max-w-[20rem] text-xs text-muted-foreground">
              Cap checks pass and no soft warnings fired. Use the footer Launch button to ship.
            </p>
          </div>
        ) : (
          <>
            {fixable.length > 0 && (
              <Button variant="outline" size="sm" className="w-full" onClick={onAutoFix}>
                <Wand2 className="h-4 w-4" />
                Auto-fix {fixable.length} cap {fixable.length === 1 ? "issue" : "issues"}
              </Button>
            )}
            {errors.length > 0 && <IssueGroup title="Blocking" issues={errors} onApplyFix={onApplyFix} />}
            {warnings.length > 0 && <IssueGroup title="Warnings" issues={warnings} onApplyFix={onApplyFix} />}
            {infos.length > 0 && <IssueGroup title="Suggestions" issues={infos} onApplyFix={onApplyFix} />}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

const TIER_META = {
  error: { Icon: XCircle, color: ERR, text: ERR_TEXT, bg: "rgba(255,77,79,0.06)", ring: "rgba(255,77,79,0.3)" },
  warning: { Icon: AlertTriangle, color: WARN, text: WARN_TEXT, bg: "rgba(250,173,20,0.07)", ring: "rgba(250,173,20,0.3)" },
  info: { Icon: Info, color: "rgba(15,15,12,0.55)", text: "rgba(15,15,12,0.7)", bg: "rgba(15,15,12,0.03)", ring: "rgba(15,15,12,0.12)" },
} as const;

function IssueGroup({
  title,
  issues,
  onApplyFix,
}: {
  title: string;
  issues: ReviewIssue[];
  onApplyFix: (issue: ReviewIssue) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {issues.map((issue) => {
        const m = TIER_META[issue.tier];
        return (
          <div
            key={issue.id}
            className="rounded-xl border p-3"
            style={{ backgroundColor: m.bg, borderColor: m.ring }}
          >
            <div className="flex items-start gap-2.5">
              <m.Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: m.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium" style={{ color: m.text }}>{issue.title}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{issue.detail}</p>
                {issue.fix && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7"
                    onClick={() => onApplyFix(issue)}
                    disabled={!isAutoApplicable(issue.fix.kind)}
                  >
                    {issue.fix.label}
                    {!isAutoApplicable(issue.fix.kind) && <span className="ml-1 text-[10px] text-muted-foreground">(in earlier step)</span>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Only distribution switches can be applied in-place here; the others point back. */
function isAutoApplicable(kind: IssueFixKind): boolean {
  return kind === "switch_distribution";
}
