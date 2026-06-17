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
  FolderOpen,
  HardDrive,
  Hash,
  Image,
  Library,
  Link2,
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
import type { AdFormat, AdCopy, CreativeRef, SourceType, SpreadMode } from "../../types";
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
import { adSetCount, adsPerDestination, capCheck, spreadPreview } from "../../deriveV2";
import { buildReviewTree } from "../review/reviewModel";
import { formatMoney } from "@/launch2/utils/time";
import AccountSelectorPanel from "./distribution/AccountSelectorPanel";

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
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
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

// ── PostedAdsPicker — browse RUNNING_ADS and select as creative ──────────────
function PostedAdsPicker({
  flow,
  selectedAcctIds,
}: {
  flow: UseFlowV2;
  selectedAcctIds: Set<string>;
}) {
  const { plan } = flow;

  // Filter RUNNING_ADS to the selected accounts' pages
  const selectedAccountNames = plan.targets
    .filter((t) => selectedAcctIds.has(t.accountId))
    .map((t) => t.pageName);

  const filtered =
    selectedAccountNames.length > 0
      ? RUNNING_ADS.filter((ad) =>
          selectedAccountNames.some(
            (name) =>
              ad.pageName.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(ad.pageName.toLowerCase()),
          ),
        )
      : RUNNING_ADS;

  // Fall back to all ads when mock data has no exact match
  const ads = filtered.length > 0 ? filtered : RUNNING_ADS;

  const selectedIds = new Set(
    plan.creatives.filter((c) => c.source === "post_id").map((c) => c.id),
  );

  const toggle = (ad: (typeof RUNNING_ADS)[0]) => {
    const isSelected = selectedIds.has(ad.id);
    const next = isSelected
      ? plan.creatives.filter((c) => c.id !== ad.id)
      : [
          ...plan.creatives,
          {
            id: ad.id,
            name: ad.name,
            format: ad.format,
            source: "post_id" as const,
            thumbnail: ad.thumbnail,
            savedAd: false,
            itemType: "ad" as const,
          },
        ];
    flow.patch({ creatives: next });
  };

  return (
    <SectionCard
      title="Select post"
      subtitle="Pick an existing published post to run as an ad."
    >
      <div className="space-y-2">
        {selectedAcctIds.size === 0 && (
          <p className="font-mono text-[11px] text-muted-foreground">
            Select an account on the left to see its posts.
          </p>
        )}
        <div className="space-y-2">
          {ads.map((ad) => {
            const sel = selectedIds.has(ad.id);
            return (
              <button
                key={ad.id}
                type="button"
                onClick={() => toggle(ad)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  sel
                    ? "border-foreground/30 bg-primary/5"
                    : "border-border hover:border-foreground/20",
                )}
              >
                {ad.thumbnail && (
                  <img
                    src={ad.thumbnail}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-foreground">{ad.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {ad.pageName} · {ad.format}
                  </p>
                </div>
                {sel && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
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

  // ── Cap status ──────────────────────────────────────────────────────────
  const cap = capCheck(plan);

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

  // ── Cap-meter anchor ref ─────────────────────────────────────────────────────
  const capRef = useRef<HTMLDivElement>(null);

  // ── Draggable divider ───────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(70); // percentage, clamped 25–80 (creative 70 / distribution 30)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const raw = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(80, Math.max(25, raw)));
    };
    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleDividerMouseDown = () => {
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const hasCatalogueAccounts = Object.values(plan.catalogueByAccount ?? {}).some(Boolean);
  const hasPostIdAccounts = Object.values(plan.useExistingPostByAccount ?? {}).some(Boolean);
  const forceV2 = hasCatalogueAccounts || hasPostIdAccounts;
  const [distVariant, setDistVariant] = useState<"v1" | "v2">(() => {
    const hasCat = Object.values(plan.catalogueByAccount ?? {}).some(Boolean);
    const hasPost = Object.values(plan.useExistingPostByAccount ?? {}).some(Boolean);
    return hasCat || hasPost ? "v2" : "v1";
  });
  useEffect(() => {
    if (forceV2) setDistVariant("v2");
  }, [forceV2]);

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

  // ── Selection style helpers (Tier-2 lock #6: 2px foreground border, no lime) ─
  const selectedBorder = "border-2 border-foreground bg-foreground/[0.03]";
  const unselectedBorder = "border border-border";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div data-screen="lv2-step3" className="flex h-full min-h-0 flex-col">
      {/* V1/V2 variant toggle strip */}
      <div className="flex flex-shrink-0 items-center justify-end gap-2 border-b border-border/60 bg-background px-4 py-1.5">
        {forceV2 ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            Account layout — {hasCatalogueAccounts ? "Catalogue" : "Post ID"}
          </span>
        ) : (
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5">
            {(["v1", "v2"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDistVariant(v)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-mono transition-colors",
                  distVariant === v
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "v1" ? "Classic" : "Account"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* V1/V2 split pane — always rendered; account panel injected as first column in V2 */}
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1"
      >
        {/* Account selector — V2 mode only */}
        {(distVariant === "v2" || forceV2) && (
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
        )}

      {/* ── Left pane: Ad creative ───────────────────────────────────────── */}
      <div
        style={(distVariant === "v1" && !forceV2) ? { width: `${leftWidth}%` } : undefined}
        className={cn(
          "h-full overflow-y-auto px-5 py-4 min-w-0",
          (distVariant === "v2" || forceV2) && "flex-1"
        )}
      >
        <div className="space-y-4">

          {/* ── 1+2. Creative type — unified card (format + mode) ──────── */}
          <SectionCard title="Creative type">
            {/* Progress pills */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors",
                  plan.format
                    ? "bg-foreground/[0.06] text-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {plan.format ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="font-mono">1</span>
                )}
                Ad format
              </span>
              <span className="text-muted-foreground/40">→</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors bg-foreground/[0.06] text-foreground">
                <Check className="h-3 w-3" />
                Creative mode
              </span>
            </div>

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
                            ? "border-2 border-foreground bg-foreground/[0.03] text-foreground"
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

            {/* Divider */}
            <div className="border-t border-border/40 my-3" />

            {/* Creative mode toggle */}
            <div className="space-y-2">
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
                        ? selectedBorder
                        : `${unselectedBorder} bg-card hover:border-foreground/30`,
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
            /* Post ID mode — browse and select existing published posts */
            <PostedAdsPicker flow={flow} selectedAcctIds={selectedAcctIds} />
          ) : (
            <>
              {/* ── 3. Source — chips row: labeled left zone + icon-only right zone ── */}
              {(() => {
                const LABELED_SOURCES: SourceType[] = ["library", "genie", "upload"];
                const labeledSources = SOURCES.filter((s) => LABELED_SOURCES.includes(s.id as SourceType));
                // post_id is now a per-launch Step 2 selection — excluded from chip row
                const iconOnlySources = SOURCES.filter((s) => !LABELED_SOURCES.includes(s.id as SourceType) && s.id !== "post_id");
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
        </div>
      </div>

      {/* ── Drag handle — V1 mode only ───────────────────────────────────────── */}
      {(distVariant === "v1" && !forceV2) && (
        <div
          onMouseDown={handleDividerMouseDown}
          className={cn(
            "w-1 cursor-col-resize shrink-0 select-none transition-colors",
            isDragging ? "bg-foreground/40" : "bg-border hover:bg-foreground/40",
          )}
        />
      )}

      {/* ── Right pane: Distribution ─────────────────────────────────────────── */}
      <div
        style={(distVariant === "v1" && !forceV2) ? { width: `${100 - leftWidth}%` } : undefined}
        className={cn(
          "h-full overflow-y-auto px-5 py-4 min-w-0 border-l border-border",
          (distVariant === "v2" || forceV2) && "w-[280px] flex-shrink-0"
        )}
      >
        {hasCatalogueAccounts ? (
          /* Catalogue (DPA) mode — adset count summary card */
          (() => {
            // Compute total adsets across all catalogue accounts
            const totalAdSets = Object.entries(plan.productSetByAccount ?? {})
              .filter(([id]) => plan.catalogueByAccount?.[id])
              .reduce((sum, [, sel]) => sum + (sel.productSetIds?.length ?? 0), 0);
            return (
              <div className="flex flex-col gap-3 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Campaign structure</p>
                <div className="rounded-2xl border border-border bg-background p-3 space-y-1">
                  <p className="font-mono text-[11px] text-foreground">
                    <span className="font-semibold text-[15px] tabular-nums">{totalAdSets || "—"}</span>
                    <span className="ml-1 text-muted-foreground">ad set{totalAdSets !== 1 ? "s" : ""}</span>
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">1 ad / ad set · Meta-managed creative</p>
                  <p className="font-mono text-[10px] text-muted-foreground">1 campaign · budget shared</p>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                  Meta fills images, prices, and URLs from your product catalogue automatically.
                </p>
              </div>
            );
          })()
        ) : (
          <div className="space-y-6">
            {/* Right pane section eyebrow */}
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted-foreground block">
              Distribution
            </span>

            {/* ── 0. Live preview — how ads divide ────────────────────────── */}
            <LivePreviewCard flow={flow} currency={currency} />

            {/* ── 1. Page split ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                  Page split
                </span>
                <DistributionSectionChip flow={flow} section="pageDistribution" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PAGE_SPLIT_OPTIONS.map((opt) => {
                  const on = plan.pageDistribution === opt.id;
                  const isDupe = opt.id === "duplicate";
                  const showRecommended = opt.id === "fill_first" && !on;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => patch({ pageDistribution: opt.id })}
                      aria-pressed={on}
                      className={cn(
                        "fab-focus flex flex-col gap-2 rounded-2xl p-4 text-left transition-colors",
                        on
                          ? isDupe
                            ? "border-2 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                            : selectedBorder
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
            </div>

            {/* ── 2. Creative distribution ──────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                  Creative distribution
                </span>
                <DistributionSectionChip flow={flow} section="spread" />
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
    </div>
  );
}
