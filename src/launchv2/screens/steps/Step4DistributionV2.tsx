/**
 * Step 4 — Distribution — V2 (full redesign).
 *
 * Design philosophy:
 *  - Three jobs: Page Split → Campaign Structure → Creative Mapping.
 *    Lead with the most impactful (page split), defer the rest.
 *  - No persistent two-pane split. Single vertical column of sections,
 *    full-width, no competing scroll regions.
 *  - Sticky impact summary strip at top: "N campaigns · N ad sets · N ads · fill-first".
 *    Replaces the always-on tree. Tree is accessible on demand via collapsible panel.
 *  - Page split uses 2-up primary pills (Fill first / Equal — 90% case) +
 *    secondary row (One page / Duplicate — edge cases, lower visual weight).
 *  - Creative mapping uses the same 2+2 priority split.
 *  - Collapsible "Ad tree preview" section at the bottom houses AdTreeVisualization.
 *  - CapMeterWithFixes stays permanently visible — it's actionable, not decorative.
 *
 * Density/readability pass (2nd round):
 *  - Impact summary strip: py-3 px-4 rounded-2xl border border-border bg-card mb-4
 *    Each stat: font-mono tabular-nums text-[13px] font-semibold
 *    Labels: text-[10px] uppercase tracking-wide text-muted-foreground/70
 *    Vertical dividers between stats
 *  - Page split: PRIMARY CHOICE / EDGE CASES row labels above each row
 *  - CapMeterWithFixes: wrapped in rounded-2xl border border-border p-3 space-y-2 with header
 *  - Section spacing: space-y-6 throughout
 *  - Collapsible: proper row styling with ChevronDown, "Ad tree preview" label
 */
import { useState } from "react";
import { ChevronDown, LayoutGrid, Layers, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { adSetCount, adsPerDestination, spreadPreview } from "../../deriveV2";
import { SPREAD_LABELS } from "../../data";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { SpreadMode } from "../../types";
import AdTreeVisualization from "./distribution/AdTreeVisualization";
import CapMeterWithFixes from "./distribution/CapMeterWithFixes";
import StructureEditor from "./distribution/StructureEditor";
import DistributionTemplateBar, {
  DistributionSectionChip,
} from "./distribution/DistributionTemplateBar";
import { formatMoney } from "@/launch2/utils/time";

/* ── Option data ──────────────────────────────────────────────────────────── */

type PageSplitId = "one_page" | "fill_first" | "equal" | "duplicate";

/** Primary options — the 90% case. Full-weight pill cards. */
const PAGE_SPLIT_PRIMARY: { id: PageSplitId; label: string; blurb: string }[] = [
  { id: "fill_first", label: "Fill first", blurb: "Fill each page to 250, spill to next" },
  { id: "equal",      label: "Equal",      blurb: "Spread ads evenly across all pages" },
];

/** Secondary options — edge cases. Smaller, secondary style. */
const PAGE_SPLIT_SECONDARY: { id: PageSplitId; label: string; blurb: string }[] = [
  { id: "one_page",  label: "One page",  blurb: "All ads go to a single page" },
  { id: "duplicate", label: "Duplicate", blurb: "Every page gets the full set — multiplies spend" },
];

/** Primary mapping options — the most-used. */
const MAPPING_PRIMARY: { id: SpreadMode; label: string; blurb: string }[] = [
  { id: "one_per_adset", label: "One per ad set", blurb: "1 creative per ad set — clean 1:1 mapping" },
  { id: "round_robin",   label: "Round-robin",    blurb: "Cycle creatives evenly across all ad sets" },
];

/** Secondary mapping options — power-user. */
const MAPPING_SECONDARY: { id: SpreadMode; label: string; blurb: string }[] = [
  { id: "stacked",  label: "Stacked",  blurb: "All creatives stacked inside each ad set" },
  { id: "multiply", label: "Multiply", blurb: "One ad set per creative × structure (expands ad sets)" },
];

/* ── Impact summary derivation ───────────────────────────────────────────── */

function useSummary(flow: UseFlowV2) {
  const { plan } = flow;
  const p = spreadPreview(plan);
  const campaigns = plan.structure.campaigns;
  const adSets = adSetCount(plan);
  const adsPerDest = adsPerDestination(plan);
  const pages = Math.max(plan.targets.length, 1);
  const totalAds = plan.pageDistribution === "duplicate"
    ? adsPerDest * pages
    : adsPerDest;
  const splitLabel =
    plan.pageDistribution === "fill_first" ? "fill-first"
    : plan.pageDistribution === "equal"    ? "equal split"
    : plan.pageDistribution === "one_page" ? "single page"
    : "duplicate × all pages";
  const spreadLabel = SPREAD_LABELS[plan.spread] ?? plan.spread.replace(/_/g, " ");
  return {
    campaigns,
    adSets,
    adsPerDest,
    totalAds,
    pages,
    splitLabel,
    spreadLabel,
    creatives: p.creatives,
  };
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */

function Section({
  icon,
  title,
  chip,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  chip?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">{title}</span>
        {chip}
      </div>
      {children}
    </div>
  );
}

/* ── Option pill card ────────────────────────────────────────────────────── */

function OptionCard({
  label,
  blurb,
  active,
  warning,
  footer,
  onClick,
  secondary,
}: {
  label: string;
  blurb: string;
  active: boolean;
  warning?: boolean;
  footer?: React.ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-1 rounded-2xl border text-left transition-all duration-150",
        secondary ? "px-3 py-2.5" : "p-4",
        active
          ? warning
            ? "border-amber-400/70 bg-amber-50/40 dark:border-amber-700/50 dark:bg-amber-950/20"
            : "border-primary bg-primary/5"
          : "border-border bg-card hover:border-foreground/25 hover:-translate-y-px hover:shadow-sm",
      )}
    >
      <span className={cn(
        "font-semibold text-foreground",
        secondary ? "text-[12px]" : "text-[13px]",
      )}>
        {label}
      </span>
      <span className={cn(
        "font-mono text-muted-foreground",
        secondary ? "text-[10px]" : "text-[11px]",
      )}>
        {blurb}
      </span>
      {footer}
    </button>
  );
}

/* ── Row group label ─────────────────────────────────────────────────────── */

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60 font-semibold">
      {children}
    </span>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export default function Step4DistributionV2({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const [treeOpen, setTreeOpen] = useState(false);
  const currency = plan.targets[0]?.currency ?? "INR";
  const duplicateMultiplier = Math.max(plan.targets.length, 1);
  const s = useSummary(flow);

  return (
    <div
      data-screen="lv2-step4-distribution-v2"
      className="flex h-full min-h-0 flex-col"
    >
      {/* Template bar */}
      <div className="mb-4">
        <DistributionTemplateBar flow={flow} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1">

        {/* ── Impact summary strip ─────────────────────────────────────── */}
        <div
          className="rounded-2xl border border-border bg-card mb-4 px-4 py-3"
          aria-label="Current distribution output"
        >
          <div className="flex flex-wrap items-center gap-0">
            {/* Campaigns */}
            <div className="flex flex-col border-r border-border last:border-0 pr-4 mr-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Campaigns</span>
              <span className="font-mono tabular-nums text-[13px] font-semibold text-foreground">
                {s.campaigns}
              </span>
            </div>
            {/* Ad sets */}
            <div className="flex flex-col border-r border-border last:border-0 pr-4 mr-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Ad sets</span>
              <span className="font-mono tabular-nums text-[13px] font-semibold text-foreground">
                {s.adSets}
              </span>
            </div>
            {/* Total ads */}
            <div className="flex flex-col border-r border-border last:border-0 pr-4 mr-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Total ads</span>
              <span className="font-mono tabular-nums text-[13px] font-semibold text-foreground">
                {s.totalAds}
              </span>
            </div>
            {/* Pages */}
            <div className="flex flex-col border-r border-border last:border-0 pr-4 mr-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Pages</span>
              <span className="font-mono tabular-nums text-[13px] font-semibold text-foreground">
                {s.pages}
              </span>
            </div>
            {/* Split mode */}
            <div className="flex flex-col border-r border-border last:border-0 pr-4 mr-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Split</span>
              <span className="font-mono tabular-nums text-[13px] font-semibold text-foreground capitalize">
                {s.splitLabel}
              </span>
            </div>
            {/* Spread */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Spread</span>
              <span className="font-mono tabular-nums text-[13px] font-semibold text-foreground capitalize">
                {s.spreadLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── § 1: Page Split ──────────────────────────────────────────── */}
        <Section
          icon={<LayoutGrid className="h-3.5 w-3.5" />}
          title="Page Split"
          chip={<DistributionSectionChip flow={flow} section="pageDistribution" />}
        >
          {/* Primary options — full weight */}
          <div className="space-y-1.5">
            <RowLabel>Primary choice</RowLabel>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_SPLIT_PRIMARY.map((opt) => (
                <OptionCard
                  key={opt.id}
                  label={opt.label}
                  blurb={opt.blurb}
                  active={plan.pageDistribution === opt.id}
                  onClick={() => patch({ pageDistribution: opt.id })}
                />
              ))}
            </div>
          </div>

          {/* Secondary options — reduced weight, labeled row */}
          <div className="space-y-1.5">
            <RowLabel>Edge cases</RowLabel>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_SPLIT_SECONDARY.map((opt) => {
                const isDupe = opt.id === "duplicate";
                return (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    blurb={opt.blurb}
                    active={plan.pageDistribution === opt.id}
                    warning={isDupe}
                    secondary
                    onClick={() => patch({ pageDistribution: opt.id })}
                    footer={
                      isDupe && plan.pageDistribution === "duplicate" ? (
                        <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 tabular-nums">
                          {formatMoney(plan.budgetAmount, currency)} → {formatMoney(plan.budgetAmount * duplicateMultiplier, currency)} ×{duplicateMultiplier}
                        </span>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── § 2: Campaign Structure ──────────────────────────────────── */}
        <Section
          icon={<Layers className="h-3.5 w-3.5" />}
          title="Campaign Structure"
          chip={<DistributionSectionChip flow={flow} section="structure" />}
        >
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <StructureEditor flow={flow} />
          </div>
        </Section>

        {/* ── § 3: Creative Mapping ────────────────────────────────────── */}
        <Section
          icon={<Shuffle className="h-3.5 w-3.5" />}
          title="Creative Mapping"
          chip={<DistributionSectionChip flow={flow} section="spread" />}
        >
          {/* Primary options */}
          <div className="space-y-1.5">
            <RowLabel>Primary choice</RowLabel>
            <div className="grid grid-cols-2 gap-2">
              {MAPPING_PRIMARY.map((opt) => (
                <OptionCard
                  key={opt.id}
                  label={opt.label}
                  blurb={opt.blurb}
                  active={plan.spread === opt.id}
                  onClick={() => patch({ spread: opt.id })}
                />
              ))}
            </div>
          </div>

          {/* Secondary options */}
          <div className="space-y-1.5">
            <RowLabel>Advanced</RowLabel>
            <div className="grid grid-cols-2 gap-2">
              {MAPPING_SECONDARY.map((opt) => (
                <OptionCard
                  key={opt.id}
                  label={opt.label}
                  blurb={opt.blurb}
                  active={plan.spread === opt.id}
                  secondary
                  onClick={() => patch({ spread: opt.id })}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Cap status — always visible, actionable ──────────────────── */}
        <div className="rounded-2xl border border-border p-3 space-y-2">
          <p className="text-[11px] font-semibold text-foreground">Cap check</p>
          <CapMeterWithFixes flow={flow} />
        </div>

        {/* ── Collapsible full structure preview ───────────────────────── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setTreeOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
            aria-expanded={treeOpen}
          >
            <span className="text-[13px] font-semibold text-foreground">Ad tree preview</span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              treeOpen && "rotate-180"
            )} />
          </button>
          {treeOpen && (
            <div className="border-t border-border px-4 py-4">
              <AdTreeVisualization flow={flow} />
            </div>
          )}
        </div>

        {/* Bottom breathing room */}
        <div className="h-2" />
      </div>
    </div>
  );
}
