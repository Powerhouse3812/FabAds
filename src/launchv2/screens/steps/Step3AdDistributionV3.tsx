/**
 * Step3AdDistributionV3 — Merged creative + distribution split-pane step.
 *
 * Setup summary now in LaunchV2Flow breadcrumb strip.
 *
 * Left pane: creative (format + mode + source + ad creative + copy).
 * Right pane: distribution controls (page split, creative spread, cap meter).
 * Gutter rail: sticky icon column on the far right edge for quick actions.
 *
 * Catalogue (DPA) mode collapses the right pane to a one-line summary card.
 *
 * Draggable resize divider between panes — clamp 25–80%.
 * FabFunnel design system v1.2 throughout (lime #8FB821, rounded-2xl, Geist Mono, off-white bgBase).
 */

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  HardDrive,
  Hash,
  Image,
  Library,
  Link2,
  Lock,
  Plus,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { allowedFormats, defaultDestination } from "../../reducer";
import { FORMATS, SOURCES, RUNNING_ADS, CATALOGS } from "../../data";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { AdFormat, AdCopy, CreativeRef, RunningAdV2, SourceType, SpreadMode } from "../../types";
import AdContent from "./spread/AdContent";
import SelectedItemsRow from "./spread/SelectedItemsRow";
import { SourceSheet } from "./spread/SourceSheet";
import { FORMAT_ICON } from "./spread/meta";
import { WholeAdGrid } from "./spread/WholeAdCard";
import { SaveBundleRow } from "./spread/SaveBundleRow";
import CopyFromRunning, { runningAdItems, applyRunningAd } from "./shared/CopyFromRunning";
import CapMeterWithFixes from "./distribution/CapMeterWithFixes";
import StructureEditor from "./distribution/StructureEditor";
import { DistributionSectionChip } from "./distribution/DistributionTemplateBar";
import PostPickerModal from "./distribution/PostPickerModal";
import { accountsWithZeroPostAds, adSetCount, adsPerDestination, perPageDemand, spreadPreview } from "../../deriveV2";
import { PageSplitErrorModal } from "./distribution/PageSplitErrorModal";
import { buildReviewTree } from "../review/reviewModel";
import { formatMoney } from "@/launch2/utils/time";
import AccountSelectorPanel from "./distribution/AccountSelectorPanel";
import { CatalogueCampaignEditor } from "./shared/CatalogueCampaignEditor";
import CreativeImportModal from "./shared/CreativeImportModal";

// ── Source → Lucide icon map ──────────────────────────────────────────────────
const SOURCE_ICON: Record<SourceType, React.ElementType> = {
  genie: Sparkles,
  library: Library,
  upload: Upload,
  url: Link2,
  drive: HardDrive,
  reports: BarChart3,
  post_id: Hash,
  folder: FolderOpen,
};

// ── Page split options ────────────────────────────────────────────────────────
type PageSplitId = "one_page" | "fill_first" | "equal" | "duplicate";
const PAGE_SPLIT_OPTIONS: { id: PageSplitId; label: string; blurb: string; popular?: boolean }[] = [
  { id: "fill_first", label: "Fill first",  blurb: "Pack one page first — overflow spills to the next", popular: true },
  { id: "equal",      label: "Equal",       blurb: "Same number of ads on each page",                  popular: true },
  { id: "one_page",   label: "One page",    blurb: "All ads go to a single page" },
  { id: "duplicate",  label: "Duplicate",   blurb: "Every Page runs the full set. Budget multiplies × number of Pages." },
];

// ── Creative spread (mapping) options ─────────────────────────────────────────
const MAPPING_OPTIONS: { id: SpreadMode; label: string; blurb: string; example: string; popular?: boolean }[] = [
  { id: "round_robin",   label: "Rotating",       blurb: "Creatives cycle evenly across all ad sets",          example: "e.g. 3 creatives → 5 ad sets, rotates A→B→C→A→B", popular: true },
  { id: "one_per_adset", label: "One per ad set", blurb: "Each ad set gets exactly one unique creative",         example: "e.g. 3 creatives → 3 ad sets, 1 unique each",        popular: true },
  { id: "stacked",       label: "Stacked",        blurb: "Every ad set gets all the creatives",                  example: "e.g. 3 creatives → 2 ad sets, both get all 3" },
  { id: "multiply",      label: "Multiply",       blurb: "Each creative gets its own ad set",                    example: "e.g. 3 creatives → 3 new ad sets, 1 per creative" },
  { id: "custom",        label: "Custom",         blurb: "Define exact campaign structure yourself",             example: "Opens structure editor below ↓" },
];

// ── Live preview helpers ──────────────────────────────────────────────────────

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

function livePageSplitPreviewV3(id: PageSplitId, totalAds: number, pageCount: number): string {
  const p = Math.max(pageCount, 1);
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

// ── Page-split visual diagram ─────────────────────────────────────────────────
/**
 * Tiny page boxes with ad "fill" bars showing how ads land per mode. Two pages
 * are illustrated (or one for one_page). Lime accent for the filled portion.
 */
function PageSplitDiagram({ id, active }: { id: PageSplitId; active: boolean }) {
  // Each page is a small box; the inner bar height (0–1) shows relative fill.
  let fills: number[];
  switch (id) {
    case "fill_first":
      fills = [1, 0.35]; // first packed, overflow spills
      break;
    case "equal":
      fills = [0.6, 0.6]; // even
      break;
    case "one_page":
      fills = [1]; // single page
      break;
    case "duplicate":
      fills = [1, 1]; // each page runs the full set
      break;
    default:
      fills = [0.5, 0.5];
  }
  return (
    <div className="flex items-end gap-1.5" aria-hidden>
      {fills.map((f, i) => (
        <div
          key={i}
          className={cn(
            "relative flex h-7 w-5 items-end overflow-hidden rounded-[5px] border",
            active ? "border-foreground/30 bg-foreground/[0.03]" : "border-border bg-muted/30",
          )}
        >
          <div
            className={cn("w-full", active ? "bg-primary" : "bg-foreground/15")}
            style={{ height: `${Math.round(f * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Live preview tree card (top of distribution pane) ─────────────────────────
function CountStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[15px] font-semibold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function LivePreviewCard({ flow, currency }: { flow: UseFlowV2; currency: string }) {
  const { plan } = flow;
  const preview = spreadPreview(plan);
  const accounts = Math.max(plan.targets.length, 1);
  const campaigns = accounts * Math.max(plan.structure.campaigns, 1);
  const budgetLabel = `${formatMoney(plan.budgetAmount, currency)}/day`;

  return (
    <Card className="rounded-2xl border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-foreground">Live preview</span>
          <span className="font-mono text-[11px] tabular-nums text-primary">{budgetLabel}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <CountStat value={accounts} label="accts" />
          <CountStat value={campaigns} label="camps" />
          <CountStat value={preview.adSets} label="ad sets" />
          <CountStat value={preview.total} label="ads" />
        </div>
        {/* Compact bar showing relative ads-per-tier */}
        <div className="flex items-center gap-1" aria-hidden>
          {[
            { n: accounts, c: "bg-foreground/20" },
            { n: campaigns, c: "bg-foreground/35" },
            { n: preview.adSets, c: "bg-foreground/55" },
            { n: preview.total, c: "bg-primary" },
          ].map((tier, i) => (
            <div
              key={i}
              className={cn("h-1.5 rounded-full", tier.c)}
              style={{ flex: Math.max(tier.n, 1) }}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {preview.creatives} creative{preview.creatives !== 1 ? "s" : ""} · {preview.adsPerDest} ad
          {preview.adsPerDest !== 1 ? "s" : ""} per destination
        </p>

        {/* Account-on-top read-only tree — structure replicates per account */}
        <AccountFanoutTree flow={flow} />
      </CardContent>
    </Card>
  );
}

/**
 * Read-only fan-out tree: account is the OUTERMOST level (a Meta campaign can't
 * span accounts), so the campaign→ad-set→ad structure replicates under each
 * selected account/page. Reuses buildReviewTree — no new derivation.
 */
function AccountFanoutTree({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  if (plan.targets.length === 0) return null;
  const tree = buildReviewTree(plan);
  if (tree.length === 0) return null;

  return (
    <div className="space-y-1.5 border-t border-primary/15 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          Fan-out by account
        </span>
        <span className="text-[9px] text-muted-foreground/70">replicates per account</span>
      </div>
      <div className="space-y-1">
        {tree.map((acct) => {
          const campaigns = acct.children?.length ?? 0;
          const adSets =
            acct.children?.reduce((n, c) => n + (c.children?.length ?? 0), 0) ?? 0;
          return (
            <div key={acct.id} className="rounded-lg border border-border bg-card/60 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <ShoppingBag className="h-3 w-3 shrink-0 text-primary" strokeWidth={1.5} />
                  <span className="truncate text-[11px] font-medium text-foreground">
                    {acct.label}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {acct.count ?? 0} ads
                </span>
              </div>
              <div className="mt-0.5 pl-[18px] font-mono text-[9px] tabular-nums text-muted-foreground/80">
                {campaigns} camp{campaigns !== 1 ? "s" : ""} · {adSets} ad set{adSets !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SectionCard (left pane) ───────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-border/50 pb-5 last:border-b-0 last:pb-0">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ── AdCopyCollapsed — open by default ─────────────────────────────────────────
function AdCopyCollapsed({
  flow,
  hasAds,
  wholeAdMode = false,
}: {
  flow: UseFlowV2;
  hasAds: boolean;
  wholeAdMode?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {wholeAdMode ? "Ad settings" : `Ad copy ${hasAds ? "— pre-filled from your saved ads." : ""}`}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <AdContent flow={flow} wholeAdMode={wholeAdMode} />
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── CatalogueAdCopy ───────────────────────────────────────────────────────────
function CatalogueAdCopy({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  return (
    <div className="space-y-3">
      {/* Headline */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Headline</label>
        <input
          value={plan.adCopy.headline}
          onChange={(e) => flow.patch({ adCopy: { ...plan.adCopy, headline: e.target.value } })}
          placeholder="e.g. {{product.name}} — Shop now"
          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Description{" "}
          <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <textarea
          value={plan.adCopy.description}
          onChange={(e) =>
            flow.patch({ adCopy: { ...plan.adCopy, description: e.target.value } })
          }
          rows={2}
          placeholder="Short description — supports {{product.*}} tokens"
          className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Destination URL */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Destination URL{" "}
          <span className="text-[11px] text-muted-foreground/60">(from catalogue — you can override)</span>
        </label>
        <input
          value={plan.adCopy.destinationUrl ?? ""}
          onChange={(e) =>
            flow.patch({ adCopy: { ...plan.adCopy, destinationUrl: e.target.value } })
          }
          placeholder="https://yourstore.com/product"
          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono text-[12px] outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  );
}

// ── PostImportSummary — compact summary + trigger for PostPickerModal ────────
/**
 * Replaces the old inline PostedAdsPicker list. Shows a one-line rollup of
 * the currently-selected posts ("N posts · P pages · M accounts") with a
 * lime-text "Select posts" button that opens the modal. Zero-state renders a
 * dashed rounded-2xl button instead — the modal owns all picking UI now.
 */
function PostImportSummary({
  flow,
  postSelIds,
  onOpenPicker,
}: {
  flow: UseFlowV2;
  postSelIds: string[];
  onOpenPicker: () => void;
}) {
  const { plan } = flow;

  const selectedAds = postSelIds
    .map((id) => RUNNING_ADS.find((ad) => ad.id === id))
    .filter((ad): ad is RunningAdV2 => Boolean(ad));

  if (selectedAds.length === 0) {
    return (
      <SectionCard
        title="Select posts"
        subtitle="Pick existing published posts from your pages to run as ads."
      >
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <Hash className="h-4 w-4" />
          Select posts from your pages
        </button>
      </SectionCard>
    );
  }

  const pageIds = new Set(selectedAds.map((ad) => ad.fbPageId));
  const acctCount = new Set(
    plan.targets
      .filter((t) => pageIds.has(t.fbPageId))
      .map((t) => t.accountId),
  ).size;

  return (
    <SectionCard
      title="Select posts"
      subtitle="Existing published posts running as ads."
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5">
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {selectedAds.length} post{selectedAds.length !== 1 ? "s" : ""} · {pageIds.size} page
          {pageIds.size !== 1 ? "s" : ""} · {acctCount} account{acctCount !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={onOpenPicker}
          className="fab-focus inline-flex flex-shrink-0 items-center gap-1 rounded-full text-[12px] font-medium text-[#5B7611] dark:text-[#C3E165] hover:underline"
        >
          Select posts
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </SectionCard>
  );
}

// ── CatalogueProductSetPicker ─────────────────────────────────────────────────
function CatalogueProductSetPicker({ flow, selectedAcctId }: { flow: UseFlowV2; selectedAcctId: string | null }) {
  const { plan, patch } = flow;

  if (!selectedAcctId) {
    return (
      <SectionCard title="Product sets" subtitle="Select an account on the left to configure its product sets.">
        <p className="font-mono text-[11px] text-muted-foreground">No account selected.</p>
      </SectionCard>
    );
  }

  const selection = plan.productSetByAccount?.[selectedAcctId];
  const catalogId = selection?.catalogId ?? null;
  const selectedSetIds: string[] = selection?.productSetIds ?? [];

  // Find catalogue from CATALOGS mock data
  const catalogue = CATALOGS.find(c => c.id === catalogId);

  if (!catalogId || !catalogue) {
    return (
      <SectionCard title="Product sets" subtitle="No catalogue selected for this account.">
        <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
          Go back to Step 2 and select a catalogue for this account.
        </p>
      </SectionCard>
    );
  }

  const productSets = catalogue.productSets ?? [];

  const toggle = (setId: string) => {
    const current = new Set(selectedSetIds);
    if (current.has(setId)) current.delete(setId); else current.add(setId);
    patch({
      productSetByAccount: {
        ...(plan.productSetByAccount ?? {}),
        [selectedAcctId]: { catalogId, productSetIds: [...current] },
      },
    });
  };

  const adSetCount = selectedSetIds.length;

  return (
    <SectionCard
      title="Product sets"
      subtitle={`${catalogue.name} · ${productSets.length} sets available`}
    >
      <div className="space-y-2">
        {productSets.map((ps: any) => {
          const sel = selectedSetIds.includes(ps.id);
          return (
            <button
              key={ps.id}
              type="button"
              onClick={() => toggle(ps.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                sel ? "border-foreground/30 bg-primary/5" : "border-border hover:border-foreground/20",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-foreground">{ps.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {ps.productCount ?? ps.products?.length ?? 0} products
                </p>
              </div>
              {sel && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      {adSetCount > 0 && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <p className="font-mono text-[11px] font-semibold text-primary-text">
            {adSetCount} product set{adSetCount !== 1 ? "s" : ""} selected
            → {adSetCount} ad set{adSetCount !== 1 ? "s" : ""}
            · 1 ad / ad set
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            Under 1 campaign · budget distributable in Review
          </p>
        </div>
      )}
    </SectionCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Step3AdDistributionV3({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;

  // ── Left pane: creative state ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [appliedFolder, setAppliedFolder] = useState<{ id: string; name: string } | null>(null);

  // Pre-select Catalogue format when catalogueToggle is on from Step 2
  useEffect(() => {
    if (plan.catalogueToggle && !plan.format && plan.objective) {
      flow.chooseObjectiveFormat(plan.objective, "dpa");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.catalogueToggle]);

  const allowedFmts: AdFormat[] = plan.objective
    ? allowedFormats(plan.objective, defaultDestination(plan.objective), null)
    : [];
  const formatSet = new Set(allowedFmts);

  const [creativeMode, setCreativeMode] = useState<"ads" | "media">(() => {
    if (plan.mediaScope === "whole_ads") return "ads";
    if (plan.creatives.some((c) => c.itemType === "ad" || c.savedAd)) return "ads";
    return "media";
  });
  const [pendingMode, setPendingMode] = useState<"ads" | "media" | null>(null);

  // Sync creativeMode when plan.mediaScope is updated externally (e.g. template apply).
  // Only fires when mediaScope flips — does not override a user's explicit mode choice
  // made within the current session if mediaScope stays "individual_media".
  useEffect(() => {
    if (plan.mediaScope === "whole_ads") {
      setCreativeMode("ads");
    }
  }, [plan.mediaScope]);

  const [recentLaunchOpen, setRecentLaunchOpen] = useState(false);

  // ── Cap status ──────────────────────────────────────────────────────────
  const pageDemand = perPageDemand(plan);
  const capErrors = pageDemand.filter(p => p.over);
  const [splitModalOpen, setSplitModalOpen] = useState(false);

  // Preserved page-split choice label — shown in the post-import lock strip.
  // Page split itself is never mutated while locked; this just renders what
  // it was (and will restore to) when post import is off.
  const preservedSplitLabel =
    plan.pageDistribution === "custom"
      ? "Custom"
      : PAGE_SPLIT_OPTIONS.find((o) => o.id === (plan.pageDistribution ?? "fill_first"))?.label ?? "Fill first";

  const activeSourceId = plan.source.type;

  const handleSheetSave = (items: CreativeRef[], suggestedCopy?: Partial<AdCopy>) => {
    const updates: Partial<typeof plan> = { creatives: items };
    if (suggestedCopy) {
      const isExplicitBundle =
        typeof suggestedCopy.primaryText === "string" &&
        suggestedCopy.primaryText.trim().length > 0;
      const copyBlockEmpty = !plan.adCopy.headline && !plan.adCopy.primaryText;
      if (isExplicitBundle || copyBlockEmpty) {
        updates.adCopy = { ...plan.adCopy, ...suggestedCopy };
      }
    }
    flow.patch(updates);
    setSheetOpen(false);
  };

  const handleRemoveCreative = (id: string) => {
    flow.patch({ creatives: plan.creatives.filter((c) => c.id !== id) });
  };

  const handleApplyFolder = (result: {
    creatives: CreativeRef[];
    suggestedCopy?: Partial<AdCopy>;
    folderId: string;
    folderName: string;
  }) => {
    handleSheetSave(result.creatives, result.suggestedCopy);
    setAppliedFolder({ id: result.folderId, name: result.folderName });
  };

  // ── Right pane: distribution derived values ────────────────────────────────
  const currency = plan.targets[0]?.currency ?? "USD";
  const duplicateMultiplier = Math.max(plan.targets.length, 1);
  const distCreativeCount = Math.max(plan.creatives.length, 1);
  const distAdSets = adSetCount(plan);
  const distAdsPerDest = adsPerDestination(plan);
  const distTotalAds = plan.structure.campaigns * plan.structure.adSetsPerCampaign * plan.structure.adsPerAdSet;
  const distPageCount = Math.max(plan.targets.length, 1);

  // ── Context bar: which account(s) this step applies to (broadcast model) ──
  const acctNames = Array.from(
    new Set(plan.targets.map((t) => t.accountName ?? t.accountId).filter(Boolean)),
  ) as string[];
  const acctCount = acctNames.length;

  // ── Cap-meter anchor ref ─────────────────────────────────────────────────────
  const capRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const hasCatalogueAccounts = Object.values(plan.catalogueByAccount ?? {}).some(Boolean);
  const hasPostIdAccounts = Object.values(plan.useExistingPostByAccount ?? {}).some(Boolean);
  const forceV2 = hasCatalogueAccounts || hasPostIdAccounts;

  // Hard-block condition: any post-mode account that ends up with 0 ads
  // because no post was selected for its page(s). Blocks Next/Launch via
  // planReady/buildIssues — this banner is the on-page explanation.
  const zeroAdAccounts = accountsWithZeroPostAds(plan);

  const [selectedAcctIds, setSelectedAcctIds] = useState<Set<string>>(() => new Set<string>());

  const handleSelectAccts = (ids: Set<string>) => {
    if (hasCatalogueAccounts) {
      // Single-select: keep only the most recently added ID
      const prev = selectedAcctIds;
      const newId = [...ids].find(id => !prev.has(id));
      setSelectedAcctIds(newId ? new Set([newId]) : ids.size > 0 ? new Set([...ids].slice(-1)) : new Set());
    } else {
      setSelectedAcctIds(ids);
    }
  };

  // ── Post ID picker (Task 1) ─────────────────────────────────────────────────
  const [postPickerOpen, setPostPickerOpen] = useState(false);

  // All accounts with the per-account "use existing posts" toggle ON.
  const postOnAcctIds = Object.entries(plan.useExistingPostByAccount ?? {})
    .filter(([, on]) => on)
    .map(([id]) => id);

  // Modal scope: the rail selection filtered to post-ON accounts; falls back
  // to every post-ON account when the rail selection is empty or all-catalogue.
  const postScopeIds = (() => {
    const filtered = [...selectedAcctIds].filter((id) => plan.useExistingPostByAccount?.[id]);
    return filtered.length > 0 ? filtered : postOnAcctIds;
  })();

  const postSelIds = plan.creatives.filter((c) => c.source === "post_id").map((c) => c.id);

  const handlePostsConfirm = (ids: string[]) => {
    const nonPostCreatives = plan.creatives.filter((c) => c.source !== "post_id");
    const nextPostCreatives: CreativeRef[] = ids
      .map((id) => RUNNING_ADS.find((ad) => ad.id === id))
      .filter((ad): ad is RunningAdV2 => Boolean(ad))
      .map((ad) => ({
        id: ad.id,
        name: ad.name,
        format: ad.format,
        source: "post_id" as const,
        thumbnail: ad.thumbnail,
        savedAd: false,
        itemType: "ad" as const,
      }));
    flow.patch({ creatives: [...nonPostCreatives, ...nextPostCreatives] });
  };

  // ── Selection style helpers (Tier-2 lock #6: 2px foreground border, no lime) ─
  const selectedBorder = "border-2 border-foreground bg-foreground/[0.03]";
  const unselectedBorder = "border border-border";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div data-screen="lv2-step3" className="flex h-full min-h-0 flex-col">
      {/* ── Context bar — binds everything below to the selected account(s) ── */}
      <div className="flex-shrink-0 border-b border-border bg-[#F0F0EC] dark:bg-[#1B1B1F] px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-8 w-1 flex-shrink-0 rounded-full bg-[#8FB821]" aria-hidden />
            <div className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-[#5B7611] dark:text-[#C3E165]">
                Configuring
              </span>
              <span className="block truncate text-[13px] font-semibold text-foreground">
                {acctCount === 0
                  ? "No account selected"
                  : acctCount === 1
                    ? acctNames[0]
                    : `${acctCount} ad accounts`}
              </span>
            </div>
            {acctCount > 1 && (
              <span className="ml-1 flex-shrink-0 rounded-full border border-[#8FB821]/40 bg-[#F5FBE2] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5B7611] dark:bg-[#1D2A09] dark:text-[#C3E165]">
                applies to all {acctCount} · overrides in distribution
              </span>
            )}
          </div>
          {plan.budgetAmount > 0 && (
            <div className="flex-shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {formatMoney(plan.budgetAmount, currency)}/{plan.budgetPeriod === "daily" ? "day" : "total"} · {plan.budgetMode}
            </div>
          )}
        </div>
      </div>

      {/* Account-mode split pane */}
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1"
      >
        {/* Account selector */}
        <div className="flex flex-col">
          <AccountSelectorPanel
            flow={flow}
            selectedIds={selectedAcctIds}
            onSelect={handleSelectAccts}
          />
          {hasCatalogueAccounts && (
            <p className="px-3 py-2 font-mono text-[10px] text-muted-foreground border-t border-border">
              Select one account at a time to configure its product sets.
            </p>
          )}
        </div>

      {/* ── Left pane: Ad creative ───────────────────────────────────────── */}
      <div
        className="h-full overflow-y-auto px-5 py-4 min-w-0 flex-1"
      >
        <div className="space-y-4">

          {/* ── 1+2. Creative type — unified card (format + mode) ──────── */}
          <SectionCard
            title="Creative type"
            subtitle="Choose your ad format and how you want to add creatives"
          >

            {/* Ad format chips */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Ad type
                {plan.catalogueToggle && (
                  <span className="ml-1 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                    from Step 2
                  </span>
                )}
              </Label>

              {!plan.objective ? (
                <p className="text-[10px] italic text-muted-foreground/60">
                  Pick an objective in Step 1 — that unlocks formats.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((f) => {
                    const enabled = formatSet.has(f.id);
                    const selected = plan.format === f.id;
                    const Icon = FORMAT_ICON[f.id];
                    return (
                      <button
                        key={f.id}
                        type="button"
                        disabled={!enabled}
                        onClick={() => {
                          if (!plan.objective || !enabled) return;
                          flow.chooseObjectiveFormat(plan.objective, f.id);
                        }}
                        aria-pressed={selected}
                        className={cn(
                          "fab-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "border border-[#8FB821] bg-[#F5FBE2] text-[#5B7611] dark:bg-[#1D2A09] dark:text-[#C3E165]"
                            : enabled
                              ? "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                              : "border border-border/50 text-muted-foreground/40 cursor-not-allowed",
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Creative option */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Creative option</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["ads", "media"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (mode === creativeMode) return;
                      if (plan.creatives.length > 0) {
                        setPendingMode(mode);
                      } else {
                        setCreativeMode(mode);
                      }
                    }}
                    aria-pressed={creativeMode === mode}
                    className={cn(
                      "fab-focus flex flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition-colors",
                      creativeMode === mode
                        ? "border border-[#8FB821] bg-[#F5FBE2] dark:bg-[#1D2A09]"
                        : "border border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {mode === "ads" ? "Saved ads" : "Media + copy"}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {mode === "ads"
                        ? "Pull complete ads from Genie or Library."
                        : "Bring images or video, write copy here."}
                    </span>
                  </button>
                ))}
              </div>

              {/* Warning banner */}
              {pendingMode && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="flex-1 text-amber-600 dark:text-amber-400">
                    Switching clears {plan.creatives.length} selected{" "}
                    {pendingMode === "ads" ? "media item" : "whole ad"}
                    {plan.creatives.length !== 1 ? "s" : ""}.
                  </span>
                  <button
                    onClick={() => {
                      flow.patch({ creatives: [] });
                      setCreativeMode(pendingMode);
                      setPendingMode(null);
                    }}
                    className="rounded-full border border-amber-500/40 bg-card px-2.5 py-1 font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    Clear and switch
                  </button>
                  <button
                    onClick={() => setPendingMode(null)}
                    className="rounded-full px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Disabled Next hint */}
          {!plan.format && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Pick a format to continue.
            </p>
          )}

          {hasCatalogueAccounts ? (
            /* Catalogue mode — product set picker */
            <CatalogueProductSetPicker
              flow={flow}
              selectedAcctId={selectedAcctIds.size === 1 ? [...selectedAcctIds][0] : null}
            />
          ) : hasPostIdAccounts ? (
            /* Post ID mode — compact summary + modal trigger */
            <>
              {zeroAdAccounts.length > 0 && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-2xl border border-[rgba(255,77,79,0.35)] bg-[rgba(255,77,79,0.10)] px-3.5 py-3"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#cf1322] mt-0.5" />
                  <div className="min-w-0 space-y-1">
                    <p className="text-[12px] font-semibold text-[#cf1322]">
                      {zeroAdAccounts.length === 1
                        ? "1 account will get 0 ads — fix before continuing"
                        : `${zeroAdAccounts.length} accounts will get 0 ads — fix before continuing`}
                    </p>
                    <ul className="space-y-0.5">
                      {zeroAdAccounts.map((a) => (
                        <li key={a.accountId} className="text-[12px] leading-snug text-[#cf1322]">
                          <strong className="font-semibold">{a.accountName}</strong> will get 0 ads —
                          select at least one post for its page, or turn off post import for this
                          account.
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <PostImportSummary
                flow={flow}
                postSelIds={postSelIds}
                onOpenPicker={() => setPostPickerOpen(true)}
              />
            </>
          ) : (
            <>
              {/* ── 3. Source — chips row: labeled left zone + icon-only right zone ── */}
              {(() => {
                const LABELED_SOURCES: SourceType[] = ["library", "genie", "upload"];
                const labeledSources = SOURCES.filter((s) => LABELED_SOURCES.includes(s.id as SourceType));
                const iconOnlySources = SOURCES.filter((s) => !LABELED_SOURCES.includes(s.id as SourceType));
                return (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-foreground">Creative source</Label>
                      <p className="text-[11px] text-muted-foreground">Where to pull your creatives from</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Left zone — labeled chips */}
                      {labeledSources.map((s) => {
                        const active = activeSourceId === s.id;
                        const Icon = SOURCE_ICON[s.id as SourceType] ?? Image;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              flow.patch({ source: { type: s.id as SourceType, ref: null } });
                              setSheetOpen(true);
                            }}
                            aria-pressed={active}
                            className={cn(
                              "fab-focus inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                              active
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {s.label}
                          </button>
                        );
                      })}

                      {/* Divider */}
                      <div className="mx-1 h-5 w-px flex-shrink-0 bg-border/60" />

                      {/* Right zone — icon-only chips */}
                      {iconOnlySources.map((s) => {
                        const active = activeSourceId === s.id;
                        const Icon = SOURCE_ICON[s.id as SourceType] ?? Image;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            title={s.label}
                            onClick={() => {
                              if (s.id === "post_id") {
                                // Post ID is a per-account mode, not a plan.source pick — turn it
                                // on for every account in this launch, then open the same picker
                                // the Step 2 "Use existing posts" toggle opens.
                                const allAcctIds = Array.from(new Set(plan.targets.map((t) => t.accountId)));
                                if (allAcctIds.length === 0) return;
                                const next = { ...(plan.useExistingPostByAccount ?? {}) };
                                allAcctIds.forEach((id) => { next[id] = true; });
                                flow.patch({ useExistingPostByAccount: next });
                                setPostPickerOpen(true);
                                return;
                              }
                              flow.patch({ source: { type: s.id as SourceType, ref: null } });
                              setSheetOpen(true);
                            }}
                            aria-pressed={active}
                            aria-label={s.label}
                            className={cn(
                              "fab-focus flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                              active
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        );
                      })}

                      {/* Copy from running ad — icon-only in right zone */}
                      <CopyFromRunning
                        triggerLabel="Copy from running ad"
                        items={runningAdItems()}
                        onPick={(id) => applyRunningAd(flow, id)}
                        pickerType="ad"
                      />

                      {/* Import from recent launch */}
                      <button
                        type="button"
                        onClick={() => setRecentLaunchOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 1v4.5m0 0L5 3.5M7 5.5l2-2M2.5 9A4.5 4.5 0 0 0 7 13a4.5 4.5 0 0 0 4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Import from recent launch
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── 4. Ad creative card ─────────────────────────────────── */}
              <SectionCard title="Ad creative">
                {creativeMode === "ads" ? (
                  <div className="space-y-3">
                    {plan.creatives.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        Add from Genie, Library or upload
                      </button>
                    ) : (
                      <WholeAdGrid
                        creatives={plan.creatives}
                        onRemove={handleRemoveCreative}
                        onAdd={() => setSheetOpen(true)}
                      />
                    )}

                    <SaveBundleRow
                      appliedFolder={appliedFolder}
                      adCopy={plan.adCopy}
                      onSaved={() => setAppliedFolder((f) => (f ? { ...f } : f))}
                    />

                    {/* Whole ads: only campaign settings (CTA/URL/UTM), no copy fields */}
                    <AdCopyCollapsed flow={flow} hasAds={plan.creatives.length > 0} wholeAdMode />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Media</Label>
                        {plan.creatives.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSheetOpen(true)}
                            className="text-xs text-foreground hover:underline"
                          >
                            + Add more
                          </button>
                        )}
                      </div>
                      {plan.creatives.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setSheetOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                        >
                          <Plus className="h-4 w-4" />
                          Add from Genie, Library or upload
                        </button>
                      ) : (
                        <SelectedItemsRow
                          creatives={plan.creatives}
                          onRemove={handleRemoveCreative}
                          onChangeSource={() => setSheetOpen(true)}
                        />
                      )}
                    </div>

                    <Separator />

                    <SaveBundleRow
                      appliedFolder={appliedFolder}
                      adCopy={plan.adCopy}
                      onSaved={() => setAppliedFolder((f) => (f ? { ...f } : f))}
                    />

                    <AdContent flow={flow} />
                  </>
                )}
              </SectionCard>
            </>
          )}

          {/* Sheet portal */}
          <SourceSheet
            open={sheetOpen}
            source={plan.source.type}
            currentSelections={plan.creatives}
            creativeMode={creativeMode}
            onSave={(items, suggestedCopy) => {
              handleSheetSave(items, suggestedCopy);
              setAppliedFolder(null);
            }}
            onApplyFolder={handleApplyFolder}
            onClose={() => setSheetOpen(false)}
          />

          {/* Post picker modal — Task 1 */}
          <PostPickerModal
            open={postPickerOpen}
            onClose={() => setPostPickerOpen(false)}
            plan={plan}
            accountIds={postScopeIds}
            selectedIds={postSelIds}
            onConfirm={(ids) => {
              handlePostsConfirm(ids);
              setPostPickerOpen(false);
            }}
          />
        </div>
      </div>

      {/* ── Right pane: Distribution ─────────────────────────────────────────── */}
      <div
        className="h-full overflow-y-auto px-5 py-4 min-w-0 border-l border-border/50 w-[300px] flex-shrink-0"
      >
        {hasCatalogueAccounts ? (
          /* Catalogue (DPA) mode — editable campaign-based configuration */
          <div className="p-4 overflow-y-auto">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Campaign structure
            </p>
            <CatalogueCampaignEditor
              plan={flow.plan}
              onPatch={(partial) => flow.patch(partial)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Live preview (hero) — how ads divide across the selected account(s) ── */}
            <LivePreviewCard flow={flow} currency={currency} />

            {/* Distribution controls eyebrow */}
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted-foreground block">
              Distribution
            </span>

            {/* ── 1. Page split ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                  Page split
                </span>
                <DistributionSectionChip flow={flow} section="pageDistribution" />
                {capErrors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSplitModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(255,77,79,0.10)] border border-[rgba(255,77,79,0.25)] hover:bg-[rgba(255,77,79,0.16)] transition-colors"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#cf1322"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="font-mono text-[10px] font-bold text-[#cf1322] uppercase tracking-[0.05em]">
                      {capErrors.length} {capErrors.length === 1 ? "page over cap" : "pages over cap"}
                    </span>
                  </button>
                )}
                {capErrors.length === 0 && pageDemand.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSplitModalOpen(true)}
                    className="flex items-center gap-1 text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)] hover:text-[rgba(15,15,12,0.55)] dark:hover:text-[rgba(255,255,255,0.55)] transition-colors"
                    title="View page capacity"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span className="font-mono text-[9px]">Capacity</span>
                  </button>
                )}
              </div>

              {/* Page split error modal */}
              <PageSplitErrorModal
                open={splitModalOpen}
                onClose={() => setSplitModalOpen(false)}
                pageDemand={pageDemand}
                currentMode={plan.pageDistribution ?? "fill_first"}
                onApplyFix={(mode) => patch({ pageDistribution: mode })}
              />

              {/* ── Post-import lock strip — page split is overridden, not mutated ── */}
              {hasPostIdAccounts && (
                <div className="flex items-start gap-2.5 rounded-xl bg-[#F0F0EC] dark:bg-[#1B1B1F] px-3.5 py-2.5">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.75} />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[12px] text-foreground/80 leading-snug">
                      Page split locked while post import is on — posts run only from their owner page.
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      was: {preservedSplitLabel} · restores when post import is off
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {PAGE_SPLIT_OPTIONS.map((opt) => {
                  const on = plan.pageDistribution === opt.id;
                  const isDupe = opt.id === "duplicate";
                  const showRecommended = opt.id === "fill_first" && !on;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={hasPostIdAccounts ? undefined : () => patch({ pageDistribution: opt.id })}
                      aria-pressed={on}
                      aria-disabled={hasPostIdAccounts}
                      className={cn(
                        "fab-focus flex flex-col gap-2 rounded-2xl p-4 text-left transition-colors",
                        hasPostIdAccounts && "opacity-50 cursor-not-allowed",
                        on
                          ? isDupe
                            ? "border-2 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                            : selectedBorder
                          : cn(unselectedBorder, "bg-card", !hasPostIdAccounts && "hover:border-foreground/30"),
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                        {showRecommended && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Recommended
                          </span>
                        )}
                      </div>
                      <PageSplitDiagram id={opt.id} active={on} />
                      {on ? (
                        isDupe ? (
                          <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                            {formatMoney(plan.budgetAmount, currency)} →{" "}
                            {formatMoney(plan.budgetAmount * duplicateMultiplier, currency)} ×
                            {duplicateMultiplier}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-foreground/80 font-medium">
                            → {livePageSplitPreviewV3(opt.id, distTotalAds, distPageCount)}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">{opt.blurb}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Duplicate level sub-option ───────────────────────────────── */}
              {plan.pageDistribution === 'duplicate' && !hasPostIdAccounts && (
                <div className="mt-3 space-y-1.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[rgba(15,15,12,0.40)] dark:text-[rgba(255,255,255,0.40)] font-semibold">Duplicate at level</p>
                  <div className="flex gap-1.5">
                    {([
                      { value: 'ad', label: 'Ads', desc: 'If ad set has space' },
                      { value: 'adset', label: 'Ad Sets', desc: 'One ad set per page' },
                      { value: 'campaign', label: 'Campaigns', desc: 'One campaign per page' },
                    ] as const).map(opt => {
                      const active = (plan.duplicateLevel ?? 'ad') === opt.value;
                      return (
                        <button key={opt.value} type="button"
                          onClick={() => patch({ duplicateLevel: opt.value })}
                          className={cn(
                            'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border flex-1 text-center transition-colors',
                            active
                              ? 'border-[#8FB821] bg-[#F5FBE2] dark:bg-[#1D2A09]'
                              : 'border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] hover:border-[#8FB821]/50'
                          )}>
                          <span className={cn('text-[11px] font-semibold',
                            active ? 'text-[#5B7611] dark:text-[#C3E165]' : 'text-[rgba(15,15,12,0.75)] dark:text-[rgba(255,255,255,0.75)]'
                          )}>
                            {opt.label}
                          </span>
                          <span className="font-mono text-[8px] text-[rgba(15,15,12,0.40)] dark:text-[rgba(255,255,255,0.40)] leading-tight">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── 2. Creative distribution ──────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                  Creative distribution
                </span>
                <DistributionSectionChip flow={flow} section="spread" />
              </div>
              {/* Creative distribution warning */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
                  <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
                </svg>
                <div className="flex-1 min-w-0 space-y-2.5">
                  <p className="text-[12px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    Creatives are assigned to slots by position at your chosen distribution level.{" "}
                    <strong className="font-semibold">Too few → they repeat. Too many → extras are ignored.</strong>
                  </p>
                  <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Example</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {["5 creatives","1 Campaign","1 Adset","3 Ads"].map(t => (
                        <span key={t} className="font-mono text-[11px] bg-muted/60 border border-border rounded-md px-2 py-0.5 text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">Dist. level</span>
                      <span className="font-mono text-[10px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded px-2 py-0.5">Ads</span>
                      <span className="font-mono text-[10px] text-muted-foreground">→ 3 slots total</span>
                    </div>
                    <div className="border-t border-border pt-2 space-y-1">
                      {[["Slot 1","Creative 1","live"],["Slot 2","Creative 2","live"],["Slot 3","Creative 3","live"]].map(([slot,cr,status]) => (
                        <div key={slot} className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground w-10">{slot}</span>
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <span className="font-mono text-[11px] text-foreground/70">{cr}</span>
                          <span className="ml-auto font-mono text-[9px] bg-green-500/10 text-green-600 dark:text-green-400 rounded px-1.5 py-0.5">{status}</span>
                        </div>
                      ))}
                      <div className="border-t border-dashed border-border my-1" />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground w-10">C4, C5</span>
                        <span className="text-[10px] text-muted-foreground">→</span>
                        <span className="font-mono text-[11px] text-muted-foreground">no slot available</span>
                        <span className="ml-auto font-mono text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 rounded px-1.5 py-0.5">ignored</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                    Switch dist. level to <strong className="text-foreground/70">Adset</strong> → 1 slot total, only Creative 1 goes live.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MAPPING_OPTIONS.map((opt) => {
                  const on = plan.spread === opt.id;
                  const showRecommended = opt.popular && !on;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => patch({ spread: opt.id })}
                      aria-pressed={on}
                      className={cn(
                        "fab-focus flex flex-col gap-2 rounded-2xl p-4 text-left transition-colors",
                        on
                          ? selectedBorder
                          : `${unselectedBorder} bg-card hover:border-foreground/30`,
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                        {showRecommended && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{opt.blurb}</span>
                      {on ? (
                        <span className="font-mono text-[11px] text-foreground/80 font-medium">
                          → {liveSpreadPreview(opt.id, distCreativeCount, distAdSets, distAdsPerDest)}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-muted-foreground/70">{opt.example}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {plan.spread === "custom" && (
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    Define exact structure — campaigns, ad sets per campaign, and ads per ad set.
                  </p>
                  <StructureEditor flow={flow} />
                  <p className="font-mono text-[11px] text-muted-foreground">
                    = {plan.structure.campaigns} campaign{plan.structure.campaigns !== 1 ? "s" : ""} · {plan.structure.adSetsPerCampaign} ad set{plan.structure.adSetsPerCampaign !== 1 ? "s" : ""} · {plan.structure.adsPerAdSet} ad{plan.structure.adsPerAdSet !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* ── 3. Cap meter ──────────────────────────────────────────────── */}
            <div ref={capRef} className="scroll-mt-4">
              <CapMeterWithFixes flow={flow} />
            </div>
          </div>
        )}
      </div>

      </div>

      <CreativeImportModal
        open={recentLaunchOpen}
        onClose={() => setRecentLaunchOpen(false)}
        onImport={(patch) => flow.patch(patch)}
      />
    </div>
  );
}
