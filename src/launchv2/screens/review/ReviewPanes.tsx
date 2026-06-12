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
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Layers,
  Megaphone,
  Pencil,
  PlayCircle,
  ThumbsUp,
  Wand2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { BidStrategy, BudgetMode, PlanV2 } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import { BID_LABELS } from "../../data";
import { budgetPerDay } from "../../deriveV2";
import { formatMoney } from "@/launch2/utils/time";
import {
  buildReviewTree,
  flattenAllNodes,
  nodeKindFromId,
  perAccountBreakdown,
  type AccountBreakdown,
  type IssueFixKind,
  type ReviewIssue,
  type TreeNode,
} from "./reviewModel";
import {
  ctaLabel,
  ERR,
  ERR_TEXT,
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
            Pick a node in the tree to edit its fields.
          </p>
        )}

        {/* ── Account ─────────────────────────────────────────────── */}
        {kind === "account" && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <SectionHead icon={Building2} label="Account" onEdit={() => flow.setStep(2)} editLabel="Edit accounts in Setup" />
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
              <SectionHead icon={Megaphone} label="Campaign" onEdit={() => flow.setStep(2)} editLabel="Edit campaign in Setup" />
              <EditSelect
                label="Budget mode"
                values={vals((n) => n.fields?.budgetMode ?? plan.budgetMode)}
                options={[
                  { value: "CBO", label: "Campaign budget (CBO)" },
                  { value: "ABO", label: "Ad set budget (ABO)" },
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
              <SectionHead icon={Layers} label="Ad set" onEdit={() => flow.setStep(2)} editLabel="Edit ad set in Setup" />
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
              <SectionHead icon={ImageIcon} label="Ad copy" onEdit={() => flow.setStep(3)} editLabel="Edit ad copy in Creative step" />
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

        {/* TODO: enable when wired — bulk-save footer hidden until reducer
           supports bulk-patching individual nodes. Was shipping disabled which
           added noise to the panel; cleaner to omit entirely until functional. */}
      </div>
    </ScrollArea>
  );
}

function SectionHead({
  icon: Icon,
  label,
  onEdit,
  editLabel,
}: {
  icon: typeof Layers;
  label: string;
  /** Optional deeplink — when present a pencil renders to the right. */
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-1.5 text-xs font-semibold text-foreground">
      <span className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="fab-focus inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={editLabel ?? `Edit ${label}`}
          title={editLabel ?? `Edit ${label}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
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
/*  PREVIEW pane — per-account breakdown + Meta-style ad mockup        */
/* ------------------------------------------------------------------ */
export function PreviewPane({ plan, selected }: { plan: PlanV2; selected: Set<string> }) {
  // ── NEW state ──
  const [viewMode, setViewMode] = useState<"rows" | "cards">("rows");
  const [flightDays, setFlightDays] = useState<7 | 14 | 30>(7);
  const breakdown = useMemo(() => perAccountBreakdown(plan), [plan]);
  const totalDaily = budgetPerDay(plan);
  const currency = plan.targets[0]?.currency ?? "USD";

  // ── existing ad mockup derivations ──
  const tree = buildReviewTree(plan);
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
      <div className="flex flex-col gap-4 p-4">

        {/* ── BREAKDOWN SECTION ─────────────────────────────────── */}
        <div className="space-y-2.5">
          {/* Header: label + view toggle + flight-days toggle */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground/70">
              Launch breakdown
            </span>
            <div className="flex items-center gap-2">
              {/* Flight-days toggle */}
              <div className="flex items-center gap-0.5">
                {([7, 14, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFlightDays(d)}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors",
                      flightDays === d
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              {/* View mode toggle */}
              <div className="flex items-center gap-0 rounded-lg border border-border p-0.5">
                {(["rows", "cards"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "rounded px-2.5 py-0.5 text-[10px] font-medium capitalize transition-colors",
                      viewMode === mode
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Empty state */}
          {breakdown.length === 0 ? (
            <p className="text-[11px] italic text-muted-foreground">
              No destinations added yet — go to Setup step.
            </p>
          ) : viewMode === "rows" ? (
            <BreakdownRows
              breakdown={breakdown}
              flightDays={flightDays}
              totalDaily={totalDaily}
              currency={currency}
            />
          ) : (
            <BreakdownCards breakdown={breakdown} flightDays={flightDays} />
          )}
        </div>

        {/* ── DIVIDER ───────────────────────────────────────────── */}
        <div className="border-t border-border" />

        {/* ── EXISTING AD MOCKUP ────────────────────────────────── */}
        <p className="text-xs text-muted-foreground">Facebook feed preview · representative</p>
        <div className="w-full max-w-[340px] self-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                {copy.headline || "Headline preview"}
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
          <p className="self-center text-[11px] text-muted-foreground">
            Showing <span className="font-medium text-foreground">{creative.name}</span>
            {target ? <> on {target.pageName}</> : null}
          </p>
        )}
      </div>
    </ScrollArea>
  );
}

/* ------------------------------------------------------------------ */
/*  BREAKDOWN sub-components                                           */
/* ------------------------------------------------------------------ */

function BreakdownRows({
  breakdown,
  flightDays,
  totalDaily,
  currency,
}: {
  breakdown: AccountBreakdown[];
  flightDays: number;
  totalDaily: number;
  currency: string;
}) {
  const totals = breakdown.reduce(
    (acc, b) => ({
      pages: acc.pages + b.pages,
      campaigns: acc.campaigns + b.campaigns,
      adSets: acc.adSets + b.adSets,
      ads: acc.ads + b.ads,
    }),
    { pages: 0, campaigns: 0, adSets: 0, ads: 0 },
  );

  const cols = "grid-cols-[1fr_2.5rem_3.5rem_3.5rem_2.5rem_6.5rem]";

  return (
    <div className="overflow-hidden rounded-2xl border border-border text-[11px]">
      {/* Column headers */}
      <div className={cn("grid gap-x-2 border-b border-border bg-muted/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground/70", cols)}>
        <span>Account</span>
        <span className="text-right">Pgs</span>
        <span className="text-right">Camps</span>
        <span className="text-right">Sets</span>
        <span className="text-right">Ads</span>
        <span className="text-right">Budget</span>
      </div>

      {/* Per-account rows */}
      {breakdown.map((b) => (
        <div
          key={b.accountId}
          className={cn(
            "grid items-center gap-x-2 border-b border-border px-3 py-2 last:border-0",
            cols,
          )}
        >
          <span className="truncate font-medium text-foreground">{b.accountName}</span>
          <span className="text-right font-mono tabular-nums text-muted-foreground">{b.pages}</span>
          <span className="text-right font-mono tabular-nums text-muted-foreground">{b.campaigns}</span>
          <span className="text-right font-mono tabular-nums text-muted-foreground">{b.adSets}</span>
          <span className="text-right font-mono tabular-nums text-muted-foreground">{b.ads}</span>
          <div className="text-right">
            <div className="font-mono tabular-nums text-foreground">{formatMoney(b.dailyBudget, b.currency)}</div>
            <div className="font-mono tabular-nums text-[10px] text-muted-foreground">
              {formatMoney(b.dailyBudget * flightDays, b.currency)} / {flightDays}d
            </div>
          </div>
        </div>
      ))}

      {/* Total row */}
      {breakdown.length > 1 && (
        <div className={cn("grid items-center gap-x-2 border-t border-border bg-muted/20 px-3 py-2 font-semibold", cols)}>
          <span className="text-foreground">Total</span>
          <span className="text-right font-mono tabular-nums">{totals.pages}</span>
          <span className="text-right font-mono tabular-nums">{totals.campaigns}</span>
          <span className="text-right font-mono tabular-nums">{totals.adSets}</span>
          <span className="text-right font-mono tabular-nums">{totals.ads}</span>
          <div className="text-right">
            <div className="font-mono tabular-nums text-foreground">{formatMoney(totalDaily, currency)}</div>
            <div className="font-mono tabular-nums text-[10px] text-muted-foreground">
              {formatMoney(totalDaily * flightDays, currency)} / {flightDays}d
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownCards({
  breakdown,
  flightDays,
}: {
  breakdown: AccountBreakdown[];
  flightDays: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {breakdown.map((b) => (
        <div
          key={b.accountId}
          className="space-y-2.5 rounded-2xl border border-border bg-card p-3"
        >
          {/* Account name */}
          <div className="space-y-1">
            <p className="truncate text-[13px] font-semibold text-foreground">{b.accountName}</p>
            <span className="inline-block rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {b.pages} page{b.pages !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Structure counts */}
          <div className="space-y-1 text-[11px]">
            <BStatRow label="Campaigns" value={b.campaigns} />
            <BStatRow label="Ad sets" value={b.adSets} />
            <BStatRow label="Ads" value={b.ads} />
          </div>

          {/* Budget */}
          <div className="space-y-1 border-t border-border/60 pt-2 text-[11px]">
            <BStatRow label="Daily" value={`${formatMoney(b.dailyBudget, b.currency)}`} />
            <BStatRow
              label={`${flightDays}d est.`}
              value={formatMoney(b.dailyBudget * flightDays, b.currency)}
              highlight
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BStatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums font-medium",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
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
            {errors.length > 0 && <IssueGroup title="Must fix" issues={errors} onApplyFix={onApplyFix} />}
            {warnings.length > 0 && <IssueGroup title="Should fix" issues={warnings} onApplyFix={onApplyFix} />}
            {infos.length > 0 && <IssueGroup title="Could improve" issues={infos} onApplyFix={onApplyFix} />}
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
