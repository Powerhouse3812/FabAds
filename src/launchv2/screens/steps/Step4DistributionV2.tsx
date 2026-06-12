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
import { ChevronDown, LayoutGrid, Shuffle } from "lucide-react";
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
  { id: "fill_first", label: "Fill first", blurb: "Pack one page first — overflow spills to the next" },
  { id: "equal",      label: "Equal",      blurb: "Same number of ads on each page" },
];

/** Secondary options — edge cases. Smaller, secondary style. */
const PAGE_SPLIT_SECONDARY: { id: PageSplitId; label: string; blurb: string }[] = [
  { id: "one_page",  label: "One page",  blurb: "All ads go to a single page" },
  { id: "duplicate", label: "Duplicate", blurb: "Every page runs the full set — budget multiplies per page" },
];

/** Primary mapping options — the most-used. */
const MAPPING_PRIMARY: { id: SpreadMode; label: string; blurb: string; example: string }[] = [
  { id: "one_per_adset", label: "One per ad set", blurb: "Each ad set gets exactly one unique creative", example: "e.g. 3 creatives → 3 ad sets, 1 unique each" },
  { id: "round_robin",   label: "Rotating",       blurb: "Creatives cycle evenly across all ad sets",    example: "e.g. 3 creatives → 5 ad sets, rotates A→B→C→A→B" },
];

/** Secondary mapping options — power-user. */
const MAPPING_SECONDARY: { id: SpreadMode; label: string; blurb: string; example: string }[] = [
  { id: "stacked",  label: "Stacked",  blurb: "Every ad set gets all the creatives",  example: "e.g. 3 creatives → 2 ad sets, both get all 3" },
  { id: "multiply", label: "Multiply", blurb: "Each creative gets its own ad set",     example: "e.g. 3 creatives → 3 new ad sets, 1 per creative" },
  { id: "custom",   label: "Custom",   blurb: "Define exact campaign structure yourself", example: "Opens structure editor below ↓" },
];

/* ── Live preview helpers ────────────────────────────────────────────────── */

function liveSpreadPreview(mode: SpreadMode, c: number, a: number, adsPerDest: number): string {
  switch (mode) {
    case "one_per_adset": return `${c} creative${c !== 1 ? "s" : ""} → ${c} ad set${c !== 1 ? "s" : ""}, 1 unique each`;
    case "round_robin":   return `${c} creative${c !== 1 ? "s" : ""} → ${a} ad set${a !== 1 ? "s" : ""}, rotates evenly`;
    case "stacked":       return `${c} creative${c !== 1 ? "s" : ""} → ${a} ad set${a !== 1 ? "s" : ""}, all ${c} in each (${adsPerDest} ads)`;
    case "multiply":      return `${c} creative${c !== 1 ? "s" : ""} → ${c * a} ad set${c * a !== 1 ? "s" : ""}, 1 per creative`;
    case "custom":        return "Structure editor below ↑";
    default:              return "";
  }
}

function livePageSplitPreview(id: PageSplitId, totalAds: number, pages: number): string {
  const p = Math.max(pages, 1);
  const perPage = Math.floor(totalAds / p);
  const rem = totalAds - perPage * p;
  switch (id) {
    case "fill_first": {
      const p1 = Math.min(totalAds, 250);
      const p2 = Math.max(0, totalAds - p1);
      return p2 > 0 ? `Page 1: ${p1}, Page 2: ${p2} ads` : `All ${totalAds} ads on Page 1`;
    }
    case "equal":    return `${perPage}–${perPage + (rem > 0 ? 1 : 0)} ads/page (${totalAds} ÷ ${p})`;
    case "one_page": return `All ${totalAds} ads → 1 page`;
    case "duplicate":return `${totalAds} × ${p} pages = ${totalAds * p} ads total`;
    default:         return "";
  }
}

/* ── Friendly spread label map ───────────────────────────────────────────── */

const FRIENDLY_SPREAD_V2: Record<string, string> = {
  "Round-robin": "Rotating evenly",
  "One per ad set": "1 per ad set",
  "Stacked": "All creatives in each",
  "Multiply": "1 ad set per creative",
};

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
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">{s.totalAds}</span>
              <span className="text-xs text-muted-foreground">ads</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">{s.adSets}</span>
              <span className="text-xs text-muted-foreground">ad sets</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">{s.pages}</span>
              <span className="text-xs text-muted-foreground">page{s.pages !== 1 ? "s" : ""}</span>
            </div>
            <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground capitalize">
              {FRIENDLY_SPREAD_V2[s.spreadLabel] ?? s.spreadLabel}
            </span>
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
              {PAGE_SPLIT_PRIMARY.map((opt) => {
                const isActive = plan.pageDistribution === opt.id;
                return (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    blurb={opt.blurb}
                    active={isActive}
                    onClick={() => patch({ pageDistribution: opt.id })}
                    footer={isActive ? (
                      <span className="font-mono text-[11px] text-primary/80 font-medium">
                        → {livePageSplitPreview(opt.id, s.totalAds, s.pages)}
                      </span>
                    ) : undefined}
                  />
                );
              })}
            </div>
          </div>

          {/* Secondary options — reduced weight, labeled row */}
          <div className="space-y-1.5">
            <RowLabel>Edge cases</RowLabel>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_SPLIT_SECONDARY.map((opt) => {
                const isDupe = opt.id === "duplicate";
                const isActive = plan.pageDistribution === opt.id;
                return (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    blurb={opt.blurb}
                    active={isActive}
                    warning={isDupe}
                    secondary
                    onClick={() => patch({ pageDistribution: opt.id })}
                    footer={
                      isActive ? (
                        isDupe ? (
                          <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 tabular-nums">
                            {formatMoney(plan.budgetAmount, currency)} → {formatMoney(plan.budgetAmount * duplicateMultiplier, currency)} ×{duplicateMultiplier}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-primary/80 font-medium">
                            → {livePageSplitPreview(opt.id, s.totalAds, s.pages)}
                          </span>
                        )
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── § 2: Creative Distribution ───────────────────────────────── */}
        <Section
          icon={<Shuffle className="h-3.5 w-3.5" />}
          title="Creative distribution"
          chip={<DistributionSectionChip flow={flow} section="spread" />}
        >
          {/* Primary options */}
          <div className="space-y-1.5">
            <RowLabel>Primary choice</RowLabel>
            <div className="grid grid-cols-2 gap-2">
              {MAPPING_PRIMARY.map((opt) => {
                const isActive = plan.spread === opt.id;
                return (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    blurb={opt.blurb}
                    active={isActive}
                    onClick={() => patch({ spread: opt.id })}
                    footer={isActive ? (
                      <span className="font-mono text-[11px] text-primary/80 font-medium">
                        → {liveSpreadPreview(opt.id, s.creatives, s.adSets, s.adsPerDest)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground/70">{opt.example}</span>
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Secondary options */}
          <div className="space-y-1.5">
            <RowLabel>Advanced</RowLabel>
            <div className="grid grid-cols-2 gap-2">
              {MAPPING_SECONDARY.map((opt) => {
                const isActive = plan.spread === opt.id;
                return (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    blurb={opt.blurb}
                    active={isActive}
                    secondary
                    onClick={() => patch({ spread: opt.id })}
                    footer={isActive ? (
                      <span className="font-mono text-[11px] text-primary/80 font-medium">
                        → {liveSpreadPreview(opt.id, s.creatives, s.adSets, s.adsPerDest)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground/70">{opt.example}</span>
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Custom mode: reveal StructureEditor */}
          {plan.spread === "custom" && (
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Define exact structure — campaigns, ad sets per campaign, and ads per ad set.
              </p>
              <StructureEditor flow={flow} />
            </div>
          )}
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
